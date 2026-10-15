// @ts-nocheck
// Studio module — see src/lib/studio/index.ts barrel and docs/ARCHITECTURE.md.
import { ctx } from '../context';
import { playSynthSfx } from '../domain/audio';
import { buildBezierPath } from '../domain/geometry';
import { pushHistory } from '../domain/history';
import { renderWires, scheduleMinimap, updateWirePaths } from './render-wires';
import { showToast } from './toast';
import { applyTransform } from './transform';

export function wireCanvasPanZoom() {
const viewport = document.getElementById('canvasViewport');
if (!viewport || viewport.dataset.wired) return;
viewport.dataset.wired = '1';

const MIN_ZOOM = 0.35;
const MAX_ZOOM = 2.0;

// Active pointers for multitouch tracking.
const activePointers = new Map();
// Pinch gesture baseline captured when 2 pointers are down on empty canvas.
let pinchState = null;
// Single-finger pan baseline + velocity for inertia.
let panState = null;
let panVelocity = { x: 0, y: 0 };
let lastPanMoveT = 0;
let inertiaRaf = 0;
// rAF-throttled flags: un solo applyTransform / updateWirePaths por frame.
// Los cables viven dentro de #canvasWorld y escalan solos con el transform,
// así que pan/pinch/zoom NO reconstruyen cables (era el coste principal).
let panRaf = 0;
let wireRefreshRaf = 0;
let wireRefreshNodeId = null;
// Rect del viewport cacheado durante el gesto (evita getBoundingClientRect
// por cada pointermove, que fuerza layout en móvil).
let vpRectCache = null;
// Rueda/trackpad coalescada en un solo rAF.
let wheelRaf = 0;
let wheelPending = null;
// Double-tap detection (zoom in on empty canvas).
let lastTapT = 0;
let lastTapX = 0;
let lastTapY = 0;

function clampZoom(z) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
}

function setGesturing(on) {
  try {
    document.body.classList.toggle('vn-gesturing', !!on);
  } catch {}
}

function refreshVpRect() {
  try {
    vpRectCache = viewport.getBoundingClientRect();
  } catch {
    vpRectCache = null;
  }
  return vpRectCache;
}

function getVpRect() {
  return vpRectCache || refreshVpRect();
}

function screenToWorld(clientX, clientY) {
  const r = getVpRect();
  const left = r ? r.left : 0;
  const top = r ? r.top : 0;
  return {
    x: (clientX - left - ctx.state.panX) / ctx.state.zoom,
    y: (clientY - top - ctx.state.panY) / ctx.state.zoom
  };
}

function zoomAtPoint(newZoom, anchorClientX, anchorClientY) {
  const r = getVpRect();
  const left = r ? r.left : 0;
  const top = r ? r.top : 0;
  // World point currently under the anchor.
  const worldX = (anchorClientX - left - ctx.state.panX) / ctx.state.zoom;
  const worldY = (anchorClientY - top - ctx.state.panY) / ctx.state.zoom;
  ctx.state.zoom = Math.round(clampZoom(newZoom) * 100) / 100;
  ctx.state.panX = anchorClientX - left - worldX * ctx.state.zoom;
  ctx.state.panY = anchorClientY - top - worldY * ctx.state.zoom;
  scheduleApplyTransform();
  // Sin renderWires: el mundo escala por GPU y los cables van dentro.
}

function scheduleApplyTransform() {
  if (panRaf) return;
  panRaf = requestAnimationFrame(() => {
    panRaf = 0;
    applyTransform();
  });
}

function scheduleWireRefresh(nodeId) {
  // Al arrastrar un nodo solo se toca el atributo `d` de sus cables.
  if (nodeId !== undefined) {
    if (wireRefreshNodeId !== null && wireRefreshNodeId !== nodeId) wireRefreshNodeId = null;
    else wireRefreshNodeId = nodeId;
  } else {
    wireRefreshNodeId = null;
  }
  if (wireRefreshRaf) return;
  wireRefreshRaf = requestAnimationFrame(() => {
    wireRefreshRaf = 0;
    const only = wireRefreshNodeId;
    wireRefreshNodeId = null;
    updateWirePaths(only);
  });
}

function stopInertia() {
  if (inertiaRaf) {
    cancelAnimationFrame(inertiaRaf);
    inertiaRaf = 0;
  }
  panVelocity = { x: 0, y: 0 };
}

function startInertia() {
  stopInertia();
  const vx = panVelocity.x;
  const vy = panVelocity.y;
  const speed = Math.hypot(vx, vy);
  // Only glide on flicks; ignore tiny drifts (mouse pans included).
  if (speed < 4) {
    setGesturing(false);
    return;
  }
  let curVx = vx;
  let curVy = vy;
  const decay = 0.94;
  setGesturing(true);
  const step = () => {
    curVx *= decay;
    curVy *= decay;
    if (Math.hypot(curVx, curVy) < 0.4) {
      inertiaRaf = 0;
      setGesturing(false);
      return;
    }
    ctx.state.panX += curVx / 60;
    ctx.state.panY += curVy / 60;
    applyTransform();
    inertiaRaf = requestAnimationFrame(step);
  };
  inertiaRaf = requestAnimationFrame(step);
}

function pinchDistance() {
  const pts = [...activePointers.values()];
  if (pts.length < 2) return 0;
  return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
}

function pinchMidpoint() {
  const pts = [...activePointers.values()];
  return { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
}

function beginPinch() {
  const mid = pinchMidpoint();
  pinchState = {
    startDist: Math.max(pinchDistance(), 1),
    startZoom: ctx.state.zoom,
    startPanX: ctx.state.panX,
    startPanY: ctx.state.panY,
    startMidX: mid.x,
    startMidY: mid.y
  };
  panState = null;
  ctx.dragState = { mode: 'pinch' };
}

viewport.addEventListener('pointerdown', (e) => {
  // Ignore right-click / pen eraser pans.
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  // Let nodes / ports / controls handle their own gestures.
  if (e.target.closest('.vn-node') || e.target.closest('button') || e.target.closest('select') || e.target.closest('input') || e.target.closest('a')) return;
  e.preventDefault();
  stopInertia();
  setGesturing(true);
  refreshVpRect();
  try { viewport.setPointerCapture(e.pointerId); } catch {}
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (activePointers.size === 1) {
    // Candidate single-finger pan.
    panState = {
      startX: e.clientX,
      startY: e.clientY,
      origPanX: ctx.state.panX,
      origPanY: ctx.state.panY,
      lastX: e.clientX,
      lastY: e.clientY,
      lastT: performance.now(),
      moved: false
    };
    lastPanMoveT = performance.now();
    panVelocity = { x: 0, y: 0 };
    ctx.dragState = {
      mode: 'pan',
      startX: e.clientX,
      startY: e.clientY,
      origPanX: ctx.state.panX,
      origPanY: ctx.state.panY
    };
  } else if (activePointers.size === 2) {
    // Switch to pinch: cancel single-finger pan baseline.
    beginPinch();
  }
});

// Prevent iOS Safari gesture zoom / double-tap page zoom on the canvas.
viewport.addEventListener('gesturestart', (e) => e.preventDefault());
viewport.addEventListener('gesturechange', (e) => e.preventDefault());
viewport.addEventListener('dblclick', (e) => e.preventDefault());
viewport.addEventListener('contextmenu', (e) => {
  // Long-press menu breaks fluid touch panning.
  if (e.target.closest && e.target.closest('#canvasViewport')) e.preventDefault();
});

window.addEventListener('pointermove', (e) => {
  if (activePointers.has(e.pointerId)) {
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  }

  // Two-finger pinch-zoom + pan (highest priority on canvas).
  if (pinchState && activePointers.size >= 2) {
    const dist = Math.max(pinchDistance(), 1);
    const mid = pinchMidpoint();
    const newZoom = clampZoom(pinchState.startZoom * (dist / pinchState.startDist));
    // Keep the world point under the initial midpoint stable, then follow fingers.
    const r = getVpRect();
    const left = r ? r.left : 0;
    const top = r ? r.top : 0;
    const worldX = (pinchState.startMidX - left - pinchState.startPanX) / pinchState.startZoom;
    const worldY = (pinchState.startMidY - top - pinchState.startPanY) / pinchState.startZoom;
    ctx.state.zoom = Math.round(newZoom * 100) / 100;
    ctx.state.panX = mid.x - left - worldX * ctx.state.zoom;
    ctx.state.panY = mid.y - top - worldY * ctx.state.zoom;
    scheduleApplyTransform();
    return;
  }

  if (!ctx.dragState) return;

  if (ctx.dragState.mode === 'node') {
    // Only the originating pointer drives the node drag.
    if (ctx.dragState.pointerId !== undefined && e.pointerId !== ctx.dragState.pointerId) return;
    // Abort node drag if a second finger lands mid-drag (becomes pinch).
    if (activePointers.size > 1) return;
    const dx = (e.clientX - ctx.dragState.startX) / ctx.state.zoom;
    const dy = (e.clientY - ctx.dragState.startY) / ctx.state.zoom;
    if (Math.abs(e.clientX - ctx.dragState.startX) > 3 || Math.abs(e.clientY - ctx.dragState.startY) > 3) ctx.dragState.moved = true;

    const node = ctx.state.nodes.find(n => n.id === ctx.dragState.nodeId);
    if (node) {
      node.x = Math.round(ctx.dragState.origX + dx);
      node.y = Math.round(ctx.dragState.origY + dy);
      const el = document.querySelector(`.vn-node[data-node-id="${node.id}"]`);
      if (el) {
        el.style.left = `${node.x}px`;
        el.style.top = `${node.y}px`;
      }
      // Vía rápida: solo `d` de los cables de este nodo, sin rebuild ni minimapa.
      scheduleWireRefresh(node.id);
    }
  } else if (ctx.dragState.mode === 'pan' && panState) {
    if (activePointers.size > 1) return;
    const now = performance.now();
    const dt = Math.max(now - panState.lastT, 1);
    const instVx = ((e.clientX - panState.lastX) / dt) * 1000;
    const instVy = ((e.clientY - panState.lastY) / dt) * 1000;
    // Smooth velocity (low-pass) so inertia feels natural, not jumpy.
    panVelocity.x = panVelocity.x * 0.7 + instVx * 0.3;
    panVelocity.y = panVelocity.y * 0.7 + instVy * 0.3;
    panState.lastX = e.clientX;
    panState.lastY = e.clientY;
    panState.lastT = now;
    if (Math.abs(e.clientX - panState.startX) > 3 || Math.abs(e.clientY - panState.startY) > 3) panState.moved = true;
    lastPanMoveT = now;
    ctx.state.panX = ctx.dragState.origPanX + (e.clientX - ctx.dragState.startX);
    ctx.state.panY = ctx.dragState.origPanY + (e.clientY - ctx.dragState.startY);
    scheduleApplyTransform();
  } else if (ctx.dragState.mode === 'wire') {
    if (ctx.dragState.pointerId !== undefined && e.pointerId !== ctx.dragState.pointerId) return;
    const cur = screenToWorld(e.clientX, e.clientY);
    const tempWire = document.getElementById('tempDragWire');
    if (tempWire) tempWire.setAttribute('d', buildBezierPath(ctx.dragState.startX, ctx.dragState.startY, cur.x, cur.y));
  }
}, { passive: true });

// Second finger landing anywhere during a node/wire drag cancels it
// and hands control to the pinch gesture (avoids stuck drags on mobile).
window.addEventListener('pointerdown', (e) => {
  if (!ctx.dragState || (ctx.dragState.mode !== 'node' && ctx.dragState.mode !== 'wire')) return;
  if (ctx.dragState.pointerId !== undefined && e.pointerId === ctx.dragState.pointerId) return;
  if (e.target && e.target.closest && (e.target.closest('button') || e.target.closest('select') || e.target.closest('input'))) return;
  // Hide temp wire if we were connecting.
  if (ctx.dragState.mode === 'wire') {
    const tempWire = document.getElementById('tempDragWire');
    if (tempWire) tempWire.classList.add('hidden');
  }
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  // Register the original drag pointer too so pinch math has both points.
  // Original coords are approximated from the drag start + current pan.
  if (ctx.dragState.pointerId !== undefined) {
    // Use last known position: keep start point as proxy; pinch re-baselines on move.
    activePointers.set(ctx.dragState.pointerId, { x: ctx.dragState.startX, y: ctx.dragState.startY });
  }
  if (activePointers.size >= 2) {
    refreshVpRect();
    setGesturing(true);
    beginPinch();
  }
}, { passive: true });

function endPointer(e) {
  activePointers.delete(e.pointerId);
  try { viewport.releasePointerCapture(e.pointerId); } catch {}

  if (pinchState) {
    if (activePointers.size >= 2) {
      // Still pinching: re-baseline to avoid jumps.
      const mid = pinchMidpoint();
      pinchState = {
        startDist: Math.max(pinchDistance(), 1),
        startZoom: ctx.state.zoom,
        startPanX: ctx.state.panX,
        startPanY: ctx.state.panY,
        startMidX: mid.x,
        startMidY: mid.y
      };
      return;
    }
    // Pinch ended: settle back to single-finger pan if one finger remains.
    pinchState = null;
    applyTransform();
    if (activePointers.size === 1) {
      const remaining = [...activePointers.values()][0];
      panState = {
        startX: remaining.x,
        startY: remaining.y,
        origPanX: ctx.state.panX,
        origPanY: ctx.state.panY,
        lastX: remaining.x,
        lastY: remaining.y,
        lastT: performance.now(),
        moved: false
      };
      ctx.dragState = {
        mode: 'pan',
        startX: remaining.x,
        startY: remaining.y,
        origPanX: ctx.state.panX,
        origPanY: ctx.state.panY
      };
      panVelocity = { x: 0, y: 0 };
      return;
    }
    ctx.dragState = null;
    panState = null;
    vpRectCache = null;
    setGesturing(false);
    // Pan/zoom no mueven nodos: nada que recalcular (ni cables ni minimapa).
    return;
  }

  if (!ctx.dragState) {
    panState = null;
    if (activePointers.size === 0) {
      vpRectCache = null;
      setGesturing(false);
    }
    return;
  }

  // Ignore pointerup from non-driving fingers during node/wire drags.
  if ((ctx.dragState.mode === 'node' || ctx.dragState.mode === 'wire') && ctx.dragState.pointerId !== undefined && e.pointerId !== ctx.dragState.pointerId) {
    return;
  }

  if (ctx.dragState.mode === 'wire') {
    const tempWire = document.getElementById('tempDragWire');
    if (tempWire) tempWire.classList.add('hidden');

    const targetPort = document.elementFromPoint(e.clientX, e.clientY)?.closest('.vn-port');
    if (targetPort && targetPort.dataset.nodeId !== ctx.dragState.fromNode) {
      pushHistory();
      ctx.state.wires.push({
        id: 'w_' + Date.now().toString(36),
        fromNode: ctx.dragState.fromNode,
        fromPort: ctx.dragState.fromPort,
        toNode: targetPort.dataset.nodeId,
        toPort: targetPort.dataset.portId,
        color: ctx.dragState.color
      });
      playSynthSfx('connect');
      renderWires();
      showToast('¡Nodos conectados!');
    }
  } else if (ctx.dragState.mode === 'node' && ctx.dragState.moved) {
    pushHistory();
  } else if (ctx.dragState.mode === 'pan') {
    // Double-tap on empty canvas = quick zoom in (mobile-friendly).
    const now = performance.now();
    const wasTap = panState && !panState.moved && (now - lastPanMoveT < 5000 || true);
    if (wasTap && now - lastTapT < 320) {
      const dx = e.clientX - lastTapX;
      const dy = e.clientY - lastTapY;
      if (Math.hypot(dx, dy) < 40) {
        zoomAtPoint(ctx.state.zoom + 0.2, e.clientX, e.clientY);
        lastTapT = 0;
      } else {
        lastTapT = now;
        lastTapX = e.clientX;
        lastTapY = e.clientY;
      }
    } else if (wasTap) {
      lastTapT = now;
      lastTapX = e.clientX;
      lastTapY = e.clientY;
    }
    // Flick => inertia glide; slow drag => stop dead.
    const idleMs = performance.now() - lastPanMoveT;
    if (idleMs > 90) panVelocity = { x: 0, y: 0 };
    if (panState && panState.moved) {
      startInertia();
      if (!inertiaRaf) setGesturing(false);
      ctx.dragState = null;
      panState = null;
      if (activePointers.size === 0) vpRectCache = null;
      return;
    }
  }

  const endedMode = ctx.dragState.mode;
  const endedNodeId = ctx.dragState.nodeId;
  ctx.dragState = null;
  panState = null;
  if (activePointers.size === 0) {
    vpRectCache = null;
    setGesturing(false);
  }
  if (endedMode === 'node' && endedNodeId) {
    // Sincroniza exacto al soltar y actualiza el minimapa una sola vez.
    updateWirePaths(endedNodeId);
    scheduleMinimap();
  }
}

window.addEventListener('pointerup', endPointer);
window.addEventListener('pointercancel', endPointer);

// Wheel Zoom (anchored at cursor so trackpads feel precise).
// Coalescado en un rAF: el pinch de trackpad emite decenas de eventos por
// segundo y cada uno hacía layout + rebuild de cables.
viewport.addEventListener('wheel', (e) => {
  e.preventDefault();
  stopInertia();
  refreshVpRect();
  const isTrackpadPinch = e.ctrlKey || e.metaKey;
  const step = isTrackpadPinch
    ? ctx.state.zoom * (Math.exp(-e.deltaY * 0.01) - 1)
    : (e.deltaY < 0 ? 0.07 : -0.07);
  if (!wheelPending) wheelPending = { zoom: ctx.state.zoom, x: e.clientX, y: e.clientY };
  wheelPending.zoom = clampZoom(wheelPending.zoom + step);
  wheelPending.x = e.clientX;
  wheelPending.y = e.clientY;
  if (wheelRaf) return;
  wheelRaf = requestAnimationFrame(() => {
    wheelRaf = 0;
    const p = wheelPending;
    wheelPending = null;
    if (!p) return;
    zoomAtPoint(p.zoom, p.x, p.y);
  });
}, { passive: false });
}

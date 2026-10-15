// @ts-nocheck
// Studio module — see src/lib/studio/index.ts barrel and docs/ARCHITECTURE.md.
import { ctx } from '../context';
import { playSynthSfx } from '../domain/audio';
import { buildBezierPath } from '../domain/geometry';
import { pushHistory } from '../domain/history';
import { renderWires } from './render-wires';
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
// rAF-throttled render flags (avoids rebuilding SVG on every pointermove).
let panRaf = 0;
let wiresRaf = 0;
// Double-tap detection (zoom in on empty canvas).
let lastTapT = 0;
let lastTapX = 0;
let lastTapY = 0;

function clampZoom(z) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
}

function screenToWorld(clientX, clientY) {
  const worldEl = document.getElementById('canvasWorld');
  const worldRect = worldEl.getBoundingClientRect();
  return {
    x: (clientX - worldRect.left) / ctx.state.zoom,
    y: (clientY - worldRect.top) / ctx.state.zoom
  };
}

function zoomAtPoint(newZoom, anchorClientX, anchorClientY) {
  const vpRect = viewport.getBoundingClientRect();
  // World point currently under the anchor.
  const worldX = (anchorClientX - vpRect.left - ctx.state.panX) / ctx.state.zoom;
  const worldY = (anchorClientY - vpRect.top - ctx.state.panY) / ctx.state.zoom;
  ctx.state.zoom = Math.round(clampZoom(newZoom) * 100) / 100;
  ctx.state.panX = anchorClientX - vpRect.left - worldX * ctx.state.zoom;
  ctx.state.panY = anchorClientY - vpRect.top - worldY * ctx.state.zoom;
  scheduleApplyTransform();
  scheduleRenderWires();
}

function scheduleApplyTransform() {
  if (panRaf) return;
  panRaf = requestAnimationFrame(() => {
    panRaf = 0;
    applyTransform();
  });
}

function scheduleRenderWires() {
  if (wiresRaf) return;
  wiresRaf = requestAnimationFrame(() => {
    wiresRaf = 0;
    renderWires();
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
  if (speed < 4) return;
  let curVx = vx;
  let curVy = vy;
  const decay = 0.94;
  const step = () => {
    curVx *= decay;
    curVy *= decay;
    if (Math.hypot(curVx, curVy) < 0.4) {
      inertiaRaf = 0;
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

viewport.addEventListener('pointerdown', (e) => {
  // Ignore right-click / pen eraser pans.
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  // Let nodes / ports / controls handle their own gestures.
  if (e.target.closest('.vn-node') || e.target.closest('button') || e.target.closest('select') || e.target.closest('input') || e.target.closest('a')) return;
  e.preventDefault();
  stopInertia();
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
    const vpRect = viewport.getBoundingClientRect();
    const worldX = (pinchState.startMidX - vpRect.left - pinchState.startPanX) / pinchState.startZoom;
    const worldY = (pinchState.startMidY - vpRect.top - pinchState.startPanY) / pinchState.startZoom;
    ctx.state.zoom = Math.round(newZoom * 100) / 100;
    ctx.state.panX = mid.x - vpRect.left - worldX * ctx.state.zoom;
    ctx.state.panY = mid.y - vpRect.top - worldY * ctx.state.zoom;
    scheduleApplyTransform();
    scheduleRenderWires();
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
      scheduleRenderWires();
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
    scheduleRenderWires();
    return;
  }

  if (!ctx.dragState) {
    panState = null;
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
      showToast('Nodes connected!');
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
    if (panState && panState.moved) startInertia();
  }

  ctx.dragState = null;
  panState = null;
}

window.addEventListener('pointerup', endPointer);
window.addEventListener('pointercancel', endPointer);

// Wheel Zoom (anchored at cursor so trackpads feel precise)
viewport.addEventListener('wheel', (e) => {
  e.preventDefault();
  stopInertia();
  // Pinch-to-zoom on trackpads reports ctrlKey + small deltas.
  const isTrackpadPinch = e.ctrlKey || e.metaKey;
  const step = isTrackpadPinch ? -e.deltaY * 0.005 : (e.deltaY < 0 ? 0.07 : -0.07);
  zoomAtPoint(ctx.state.zoom + step, e.clientX, e.clientY);
}, { passive: false });
}

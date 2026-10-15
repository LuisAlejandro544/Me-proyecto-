// Editor por nodos optimizado para 500+ nodos sin lag.
// Técnicas: posiciones por ValueNotifier (mover 1 nodo no reconstruye los demás),
// culling por viewport (solo se construyen los nodos visibles), aristas que solo
// se repintan al soltar un nodo, painters cacheados y tarjetas sin sombras.
// Funciona igual en Android, Linux, Windows y Web.
import 'package:flutter/material.dart';
import '../models/vn_models.dart';
import 'node_widgets.dart';
import '../player/player_screen.dart';
import '../export/html_exporter.dart';

class EditorScreen extends StatefulWidget {
  const EditorScreen({super.key});

  @override
  State<EditorScreen> createState() => _EditorScreenState();
}

class _EditorScreenState extends State<EditorScreen> {
  late VnProject project;
  final TransformationController zoom = TransformationController();
  final ValueNotifier<int> edgeVersion = ValueNotifier(0);
  final ValueNotifier<int> fps = ValueNotifier(0);
  final Map<String, ValueNotifier<Offset>> posOf = {};
  int seq = 100;
  int lastVisible = 0;
  int frames = 0;
  DateTime t0 = DateTime.now();

  @override
  void initState() {
    super.initState();
    project = VnProject.demo();
    _indexPositions();
    _fpsLoop();
  }

  @override
  void dispose() {
    for (final v in posOf.values) {
      v.dispose();
    }
    zoom.dispose();
    edgeVersion.dispose();
    fps.dispose();
    super.dispose();
  }

  // Contador de fps barato: cuenta frames reales por segundo.
  void _fpsLoop() {
    frames++;
    final now = DateTime.now();
    if (now.difference(t0).inMilliseconds >= 1000) {
      fps.value = frames;
      frames = 0;
      t0 = now;
    }
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _fpsLoop();
    });
  }

  void _indexPositions() {
    for (final n in project.nodes) {
      posOf[n.id] = ValueNotifier(Offset(n.x, n.y));
    }
  }

  void _clearPositions() {
    for (final v in posOf.values) {
      v.dispose();
    }
    posOf.clear();
  }

  void _add(VnNodeType t) {
    seq++;
    final id = '${t.name}_$seq';
    final n = VnNode(
      id: id, type: t, title: '${t.name} - $seq',
      x: 300 + (seq % 5) * 40, y: 120 + (seq % 4) * 80,
      speaker: 'Yui', text: 'Nuevo texto...',
      options: t == VnNodeType.choice
          ? [VnOption(label: '1: Sí', nextId: 'dlg_c'), VnOption(label: '2: No', nextId: 'dlg_l', isDanger: true)]
          : [],
    );
    project.nodes.add(n);
    posOf[id] = ValueNotifier(Offset(n.x, n.y));
    setState(() => edgeVersion.value++);
  }

  // Genera 500 nodos de prueba de una sola vez (1 solo rebuild).
  void _stress500() {
    _clearPositions();
    project = VnProject.stress500();
    seq = 1000;
    _indexPositions();
    zoom.value = Matrix4.identity();
    setState(() => edgeVersion.value++);
  }

  void _restoreDemo() {
    _clearPositions();
    project = VnProject.demo();
    seq = 100;
    _indexPositions();
    zoom.value = Matrix4.identity();
    setState(() => edgeVersion.value++);
  }

  void _delete(VnNode n) {
    project.nodes.removeWhere((e) => e.id == n.id);
    project.edges.removeWhere((e) => e.fromId == n.id || e.toId == n.id);
    posOf.remove(n.id)?.dispose();
    setState(() => edgeVersion.value++);
  }

  void _fit() => zoom.value = Matrix4.identity();

  void _zoomBy(double d) {
    final s = (zoom.value.getMaxScaleOnAxis() + d).clamp(0.4, 2.5);
    zoom.value = Matrix4.identity()..scaleByDouble(s, s, s, 1.0);
  }

  // Tamaño del canvas según el nodo más lejano (crece con 500 nodos).
  Size _canvasSize() {
    double mx = 1300, my = 640;
    for (final n in project.nodes) {
      if (n.x + 320 > mx) mx = n.x + 320;
      if (n.y + 260 > my) my = n.y + 260;
    }
    return Size(mx, my);
  }

  // Rect visible en coordenadas de escena, con margen de precarga.
  Rect _visibleRect(Size viewport) {
    final inv = Matrix4.inverted(zoom.value);
    final tl = MatrixUtils.transformPoint(inv, Offset.zero);
    final br = MatrixUtils.transformPoint(inv, Offset(viewport.width, viewport.height));
    return Rect.fromPoints(tl, br).inflate(260);
  }

  static bool _overlaps(VnNode n, Offset p, Rect vis) {
    final w = n.type == VnNodeType.start ? 110.0 : 190.0;
    return vis.overlaps(Rect.fromLTWH(p.dx, p.dy, w, 220));
  }

  void _showHtml() {
    final html = buildPlayableHtml(project);
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text('Web .html generado', style: TextStyle(color: Colors.white)),
        content: SizedBox(
          width: 500, height: 300,
          child: SingleChildScrollView(
            child: SelectableText(html, style: const TextStyle(color: Colors.white70, fontSize: 11)),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cerrar')),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        toolbarHeight: 76,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Project: ${project.title}',
                style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
            ValueListenableBuilder<int>(
              valueListenable: fps,
              builder: (ctx, value, child) => Text('$value fps · $lastVisible/${project.nodes.length} nodos',
                  style: const TextStyle(color: Colors.white54, fontSize: 11)),
            ),
          ],
        ),
        actions: [
          _topBtn(Icons.share, 'Share', () => _showHtml()),
          _topBtn(Icons.window, '.exe', () => _snack('Windows: usa scripts/build.sh --windows')),
          _topBtn(Icons.html, '.html', _showHtml, active: true),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: Colors.white, foregroundColor: Colors.black),
              onPressed: () => Navigator.push(
                context, MaterialPageRoute(builder: (_) => PlayerScreen(project: project))),
              child: const Text('Play'),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: LayoutBuilder(
              builder: (ctx, cons) => AnimatedBuilder(
                // Solo se reconstruye el filtro al mover zoom o cambiar datos,
                // NUNCA durante el arrastre de un nodo (ese usa estado local).
                animation: Listenable.merge([zoom, edgeVersion]),
                builder: (ctx, _) {
                  final vis = _visibleRect(cons.biggest);
                  final size = _canvasSize();
                  final visibles = <VnNode>[];
                  for (final n in project.nodes) {
                    final p = posOf[n.id]?.value ?? Offset(n.x, n.y);
                    if (_overlaps(n, p, vis)) visibles.add(n);
                  }
                  lastVisible = visibles.length;
                  return InteractiveViewer(
                    transformationController: zoom,
                    constrained: false,
                    boundaryMargin: const EdgeInsets.all(400),
                    minScale: 0.4, maxScale: 2.5,
                    // Importante: el hijo NO se reconstruye al hacer pan/zoom,
                    // Flutter solo aplica la matriz (gratis en GPU).
                    child: SizedBox.fromSize(
                      size: size,
                      child: Stack(
                        children: [
                          const Positioned.fill(
                            child: RepaintBoundary(
                              child: CustomPaint(painter: GridPainter()),
                            ),
                          ),
                          RepaintBoundary(
                            child: CustomPaint(
                              size: size, isComplex: true, willChange: false,
                              painter: EdgePainter(project: project, version: edgeVersion.value),
                            ),
                          ),
                          for (final n in visibles)
                            ValueListenableBuilder<Offset>(
                              valueListenable: posOf[n.id]!,
                              builder: (ctx, p, child) => Positioned(
                                left: p.dx, top: p.dy,
                                child: RepaintBoundary(
                                  child: DraggableNode(
                                    key: ValueKey(n.id),
                                    node: n,
                                    onDragEnd: (dx, dy) {
                                      n.x += dx;
                                      n.y += dy;
                                      posOf[n.id]!.value = Offset(n.x, n.y);
                                      edgeVersion.value++;
                                    },
                                    onDelete: () => _delete(n),
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: const BoxDecoration(
              color: Color(0xFF1E293B),
              border: Border(top: BorderSide(color: Color(0xFF334155))),
            ),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _zoomBtn(Icons.add, () => _zoomBy(0.1)),
                  _zoomBtn(Icons.remove, () => _zoomBy(-0.1)),
                  TextButton(onPressed: _fit, child: const Text('Fit', style: TextStyle(color: Colors.white))),
                  const SizedBox(width: 12),
                  _addBtn('+ Dialogue', VnNodeType.dialogue, const Color(0xFF22D3EE)),
                  _addBtn('+ Sprite', VnNodeType.sprite, const Color(0xFF22D3EE)),
                  _addBtn('+ Choice', VnNodeType.choice, const Color(0xFFF87171)),
                  _addBtn('+ Sound', VnNodeType.sound, const Color(0xFFF87171)),
                  _actionBtn('⚡500', _stress500),
                  _actionBtn('Demo', _restoreDemo),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _topBtn(IconData i, String label, VoidCallback fn, {bool active = false}) {
    return Padding(
      padding: const EdgeInsets.only(top: 2),
      child: SizedBox(
        height: 68,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              iconSize: 20,
              constraints: const BoxConstraints(minHeight: 32, minWidth: 32),
              padding: EdgeInsets.zero,
              onPressed: fn,
              icon: Icon(i, color: active ? const Color(0xFF22D3EE) : Colors.white70),
              style: IconButton.styleFrom(
                backgroundColor: active ? const Color(0x2222D3EE) : null,
                side: active ? const BorderSide(color: Color(0xFF22D3EE)) : null,
              ),
            ),
            Text(label, style: const TextStyle(color: Colors.white54, fontSize: 9)),
          ],
        ),
      ),
    );
  }

  Widget _zoomBtn(IconData i, VoidCallback fn) {
    return IconButton(onPressed: fn, icon: Icon(i, color: Colors.white));
  }

  Widget _addBtn(String label, VnNodeType t, Color c) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: OutlinedButton(
        onPressed: () => _add(t),
        style: OutlinedButton.styleFrom(
          foregroundColor: Colors.white,
          side: BorderSide(color: c),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        ),
        child: Text(label),
      ),
    );
  }

  Widget _actionBtn(String label, VoidCallback fn) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: OutlinedButton(
        onPressed: fn,
        style: OutlinedButton.styleFrom(
          foregroundColor: const Color(0xFFFACC15),
          side: const BorderSide(color: Color(0xFFFACC15)),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        ),
        child: Text(label),
      ),
    );
  }

  void _snack(String m) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m)));
}

// Nodos y painters del canvas en node_widgets.dart.


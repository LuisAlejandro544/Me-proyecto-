// Editor por nodos estilo imagen: grid, conexiones cyan/rojo, drag, zoom Fit.
// Barra inferior + Dialogue/Sprite/Choice/Sound. Igual en Android y PC.
import 'package:flutter/material.dart';
import '../models/vn_models.dart';
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
  int seq = 100;

  @override
  void initState() {
    super.initState();
    project = VnProject.demo();
  }

  void _add(VnNodeType t) {
    setState(() {
      seq++;
      final id = '${t.name}_$seq';
      project.nodes.add(VnNode(
        id: id, type: t, title: '${t.name} - $seq',
        x: 300 + (seq % 5) * 40, y: 120 + (seq % 4) * 80,
        speaker: 'Yui', text: 'Nuevo texto...',
        options: t == VnNodeType.choice
            ? [VnOption(label: '1: Sí', nextId: 'dlg_c'), VnOption(label: '2: No', nextId: 'dlg_l', isDanger: true)]
            : [],
      ));
    });
  }

  void _fit() => setState(() => zoom.value = Matrix4.identity());

  void _zoomBy(double d) {
    final m = zoom.value.clone();
    final s = (m.getMaxScaleOnAxis() + d).clamp(0.4, 2.5);
    zoom.value = Matrix4.identity()..scaleByDouble(s, s, s, 1.0);
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
        title: Text('Project: ${project.title}',
            style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        actions: [
          _topBtn(Icons.share, 'Share', () => _showHtml()),
          _topBtn(Icons.window, '.exe', () => _snack('Windows: usa flutter build windows')),
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
            child: InteractiveViewer(
              transformationController: zoom,
              constrained: false,
              boundaryMargin: const EdgeInsets.all(400),
              minScale: 0.4, maxScale: 2.5,
              child: SizedBox(
                width: 1300, height: 640,
                child: Stack(
                  children: [
                    const Positioned.fill(child: CustomPaint(painter: _GridPainter())),
                    CustomPaint(size: const Size(1300, 640), painter: _EdgePainter(project: project)),
                    for (final n in project.nodes)
                      Positioned(
                        left: n.x, top: n.y,
                        child: DraggableNode(
                          node: n,
                          onMove: (dx, dy) => setState(() { n.x += dx; n.y += dy; }),
                          onDelete: () => setState(() {
                            project.nodes.removeWhere((e) => e.id == n.id);
                            project.edges.removeWhere((e) => e.fromId == n.id || e.toId == n.id);
                          }),
                        ),
                      ),
                  ],
                ),
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

  void _snack(String m) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m)));
}

class DraggableNode extends StatelessWidget {
  final VnNode node;
  final void Function(double dx, double dy) onMove;
  final VoidCallback onDelete;
  const DraggableNode({super.key, required this.node, required this.onMove, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    final isDangerTarget = node.id == 'dlg_l';
    final border = node.type == VnNodeType.start
        ? const Color(0xFF4ADE80)
        : isDangerTarget
            ? const Color(0xFFF87171)
            : const Color(0xFF22D3EE);
    return GestureDetector(
      onPanUpdate: (d) => onMove(d.delta.dx, d.delta.dy),
      onLongPress: onDelete,
      child: Container(
        width: node.type == VnNodeType.start ? 110 : 190,
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B).withValues(alpha: 0.95),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: border, width: 1.4),
          boxShadow: [BoxShadow(color: border.withValues(alpha: 0.25), blurRadius: 12)],
        ),
        child: _inner(),
      ),
    );
  }

  Widget _inner() {
    const tWhite = TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13);
    const tBody = TextStyle(color: Colors.white, fontSize: 13);
    const tDim = TextStyle(color: Colors.white54, fontSize: 12);
    switch (node.type) {
      case VnNodeType.start:
        return const Center(child: Text('Start', style: TextStyle(color: Color(0xFF4ADE80), fontWeight: FontWeight.bold)));
      case VnNodeType.sprite:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min,
          children: [
            Text(node.title, style: tWhite),
            const SizedBox(height: 8),
            const Center(
              child: CircleAvatar(
                radius: 24, backgroundColor: Color(0xFFF9A8D4),
                child: Text('Y', style: TextStyle(color: Colors.black, fontSize: 22)),
              ),
            ),
            const SizedBox(height: 8),
            Text(node.enterFrom, style: tDim),
            Text('Pose: ${node.pose}', style: tDim),
          ],
        );
      case VnNodeType.dialogue:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min,
          children: [
            Text(node.title, style: tWhite),
            const SizedBox(height: 6),
            Text('${node.speaker}: "${node.text}"', style: tBody),
          ],
        );
      case VnNodeType.choice:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch, mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Choices', style: tWhite),
            const SizedBox(height: 6),
            for (final o in node.options)
              Container(
                margin: const EdgeInsets.only(bottom: 6),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                decoration: BoxDecoration(
                  color: o.isDanger ? const Color(0x55F87171) : const Color(0x3322D3EE),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: o.isDanger ? const Color(0xFFF87171) : const Color(0xFF22D3EE)),
                ),
                child: Text(o.label, style: const TextStyle(color: Colors.white, fontSize: 12)),
              ),
          ],
        );
      case VnNodeType.sound:
        return const Column(
          crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min,
          children: [Text('Sound', style: tWhite), Text('bgm.mp3', style: tDim)],
        );
    }
  }
}

class _GridPainter extends CustomPainter {
  const _GridPainter();
  @override
  void paint(Canvas c, Size s) {
    final p = Paint()..color = const Color(0xFF1E293B)..strokeWidth = 1;
    for (double x = 0; x < s.width; x += 28) {
      c.drawLine(Offset(x, 0), Offset(x, s.height), p);
    }
    for (double y = 0; y < s.height; y += 28) {
      c.drawLine(Offset(0, y), Offset(s.width, y), p);
    }
  }
  @override
  bool shouldRepaint(covariant CustomPainter old) => false;
}

class _EdgePainter extends CustomPainter {
  final VnProject project;
  _EdgePainter({required this.project});

  Offset _out(VnNode n) => Offset(n.x + (n.type == VnNodeType.start ? 110 : 190), n.y + 40);
  Offset _inp(VnNode n) => Offset(n.x, n.y + 40);

  @override
  void paint(Canvas canvas, Size size) {
    for (final e in project.edges) {
      VnNode? a, b;
      try { a = project.byId(e.fromId); b = project.byId(e.toId); } catch (_) { continue; }
      final p1 = _out(a);
      final p2 = _inp(b);
      final mid = (p1.dx + p2.dx) / 2;
      final path = Path()
        ..moveTo(p1.dx, p1.dy)
        ..cubicTo(mid, p1.dy, mid, p2.dy, p2.dx, p2.dy);
      final color = e.isDanger ? const Color(0xFFF87171) : const Color(0xFF22D3EE);
      canvas.drawPath(path, Paint()..color = color..strokeWidth = 3..style = PaintingStyle.stroke);
      canvas.drawCircle(p2, 5, Paint()..color = color);
    }
  }

  @override
  bool shouldRepaint(covariant _EdgePainter old) => true;
}

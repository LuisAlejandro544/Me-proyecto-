// Tarjetas de nodo y painters del canvas.
// Todo Stateless/state-local para no reconstruir el canvas al arrastrar.
import 'package:flutter/material.dart';
import '../models/vn_models.dart';

class DraggableNode extends StatefulWidget {
  final VnNode node;
  final void Function(double dx, double dy) onDragEnd;
  final VoidCallback onDelete;
  const DraggableNode({super.key, required this.node, required this.onDragEnd, required this.onDelete});

  @override
  State<DraggableNode> createState() => _DraggableNodeState();
}

class _DraggableNodeState extends State<DraggableNode> {
  Offset drag = Offset.zero;

  @override
  Widget build(BuildContext context) {
    final node = widget.node;
    final border = node.type == VnNodeType.start
        ? const Color(0xFF4ADE80)
        : node.id == 'dlg_l'
            ? const Color(0xFFF87171)
            : const Color(0xFF22D3EE);
    return GestureDetector(
      // Solo repinta ESTE nodo durante el arrastre; el resto y las
      // aristas se actualizan una vez al soltar (onPanEnd).
      onPanUpdate: (d) => setState(() => drag += d.delta),
      onPanEnd: (_) {
        final dx = drag.dx;
        final dy = drag.dy;
        setState(() => drag = Offset.zero);
        if (dx != 0 || dy != 0) widget.onDragEnd(dx, dy);
      },
      onLongPress: widget.onDelete,
      child: Transform.translate(
        offset: drag,
        child: Container(
          width: node.type == VnNodeType.start ? 110 : 190,
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: const Color(0xFF1E293B),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: border, width: 1.4),
          ),
          child: _NodeBody(node: node),
        ),
      ),
    );
  }
}

// Cuerpo puro (Stateless): no guarda estado, se cachea por Flutter.
class _NodeBody extends StatelessWidget {
  final VnNode node;
  const _NodeBody({required this.node});

  @override
  Widget build(BuildContext context) {
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
            Center(
              child: Container(
                width: 48, height: 48,
                decoration: const BoxDecoration(color: Color(0xFFF9A8D4), shape: BoxShape.circle),
                alignment: Alignment.center,
                child: const Text('Y', style: TextStyle(color: Colors.black, fontSize: 22)),
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

class GridPainter extends CustomPainter {
  const GridPainter();
  @override
  void paint(Canvas c, Size s) {
    final p = Paint()..color = const Color(0xFF1E293B)..strokeWidth = 1;
    for (double x = 0; x < s.width; x += 40) {
      c.drawLine(Offset(x, 0), Offset(x, s.height), p);
    }
    for (double y = 0; y < s.height; y += 40) {
      c.drawLine(Offset(0, y), Offset(s.width, y), p);
    }
  }
  @override
  bool shouldRepaint(covariant CustomPainter old) => false;
}

class EdgePainter extends CustomPainter {
  final VnProject project;
  final int version;
  // La versión se sube solo al soltar un nodo / agregar / borrar:
  // las aristas se repintan 1 vez por gesto, nunca durante el arrastre
  // ni por pan/zoom (eso lo aplica la GPU como matriz).
  EdgePainter({required this.project, required this.version});

  Offset _out(VnNode n) => Offset(n.x + (n.type == VnNodeType.start ? 110 : 190), n.y + 40);
  Offset _inp(VnNode n) => Offset(n.x, n.y + 40);

  @override
  void paint(Canvas canvas, Size size) {
    // Índice O(1): con 500 nodos evita 500×500 búsquedas por repintado.
    final idx = <String, VnNode>{for (final n in project.nodes) n.id: n};
    final cyan = Paint()..color = const Color(0xFF22D3EE)..strokeWidth = 3..style = PaintingStyle.stroke;
    final red = Paint()..color = const Color(0xFFF87171)..strokeWidth = 3..style = PaintingStyle.stroke;
    final cyanDot = Paint()..color = const Color(0xFF22D3EE);
    final redDot = Paint()..color = const Color(0xFFF87171);
    for (final e in project.edges) {
      final a = idx[e.fromId];
      final b = idx[e.toId];
      if (a == null || b == null) continue;
      final p1 = _out(a);
      final p2 = _inp(b);
      final mid = (p1.dx + p2.dx) / 2;
      final path = Path()
        ..moveTo(p1.dx, p1.dy)
        ..cubicTo(mid, p1.dy, mid, p2.dy, p2.dx, p2.dy);
      final line = e.isDanger ? red : cyan;
      canvas.drawPath(path, line);
      canvas.drawCircle(p2, 5, e.isDanger ? redDot : cyanDot);
    }
  }

  @override
  bool shouldRepaint(covariant EdgePainter old) => old.version != version;
}

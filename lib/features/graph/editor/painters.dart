// Painters del canvas: grid estático (se pinta 1 vez) y aristas
// versionadas (1 repintado por gesto, nunca por pan/zoom).
import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../models/vn_models.dart';

class GridPainter extends CustomPainter {
  const GridPainter();
  @override
  void paint(Canvas c, Size s) {
    final p = Paint()
      ..color = AppColors.surface
      ..strokeWidth = 1;
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
  EdgePainter({required this.project, required this.version});

  Offset _out(VnNode n) =>
      Offset(n.x + (n.type == VnNodeType.start ? 110 : 190), n.y + 40);
  Offset _inp(VnNode n) => Offset(n.x, n.y + 40);

  @override
  void paint(Canvas canvas, Size size) {
    // Índice O(1): con 500 nodos evita 500×500 búsquedas por repintado.
    final idx = <String, VnNode>{for (final n in project.nodes) n.id: n};
    final cyan = Paint()
      ..color = AppColors.cyan
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;
    final red = Paint()
      ..color = AppColors.danger
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;
    final cyanDot = Paint()..color = AppColors.cyan;
    final redDot = Paint()..color = AppColors.danger;
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
      canvas.drawPath(path, e.isDanger ? red : cyan);
      canvas.drawCircle(p2, 5, e.isDanger ? redDot : cyanDot);
    }
  }

  @override
  bool shouldRepaint(covariant EdgePainter old) => old.version != version;
}

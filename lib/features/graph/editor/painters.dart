// Painters del canvas.
// Aristas en lote (2 paths + puntos, no 500+500 llamadas) y grid por tiles
// de 512px con memoria constante (nunca una imagen gigante del canvas).
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../models/vn_models.dart';

class GridTilePainter extends CustomPainter {
  final int tx;
  final int ty;
  static const double tile = 512;
  static const double step = 40;
  const GridTilePainter({required this.tx, required this.ty});

  @override
  void paint(Canvas c, Size s) {
    final p = Paint()
      ..color = AppColors.surface
      ..strokeWidth = 1;
    final ox = tx * tile;
    final oy = ty * tile;
    // Alineado al grid global para que las líneas no se corten entre tiles.
    var startX = ox - (ox % step);
    for (var x = startX; x <= ox + tile; x += step) {
      c.drawLine(Offset(x - ox, 0), Offset(x - ox, tile), p);
    }
    var startY = oy - (oy % step);
    for (var y = startY; y <= oy + tile; y += step) {
      c.drawLine(Offset(0, y - oy), Offset(tile, y - oy), p);
    }
  }

  @override
  bool shouldRepaint(covariant GridTilePainter old) =>
      old.tx != tx || old.ty != ty;
}

class EdgePainter extends CustomPainter {
  final VnProject project;
  final int version;
  // La versión se sube solo al soltar un nodo / agregar / borrar:
  // las aristas se repintan 1 vez por gesto, nunca durante el arrastre
  // ni por pan/zoom (eso lo aplica la GPU como matriz).
  EdgePainter({required this.project, required this.version});

  Offset _out(VnNode n) =>
      Offset(n.x + (n.type == VnNodeType.start ? 110 : 190), n.y + 40);
  Offset _inp(VnNode n) => Offset(n.x, n.y + 40);

  @override
  void paint(Canvas canvas, Size size) {
    // Índice O(1): con 500 nodos evita 500×500 búsquedas por repintado.
    final idx = <String, VnNode>{for (final n in project.nodes) n.id: n};
    // Loteo: 2 paths + 2 nubes de puntos en vez de 500 drawPath + 500 círculos.
    final cyanPath = Path();
    final redPath = Path();
    final cyanPts = <double>[];
    final redPts = <double>[];
    for (final e in project.edges) {
      final a = idx[e.fromId];
      final b = idx[e.toId];
      if (a == null || b == null) continue;
      final p1 = _out(a);
      final p2 = _inp(b);
      final mid = (p1.dx + p2.dx) / 2;
      final path = e.isDanger ? redPath : cyanPath;
      path.moveTo(p1.dx, p1.dy);
      path.cubicTo(mid, p1.dy, mid, p2.dy, p2.dx, p2.dy);
      final pts = e.isDanger ? redPts : cyanPts;
      pts.add(p2.dx);
      pts.add(p2.dy);
    }
    final cyanLine = Paint()
      ..color = AppColors.cyan
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;
    final redLine = Paint()
      ..color = AppColors.danger
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;
    canvas.drawPath(cyanPath, cyanLine);
    canvas.drawPath(redPath, redLine);
    _dots(canvas, cyanPts, AppColors.cyan);
    _dots(canvas, redPts, AppColors.danger);
  }

  // Un drawRawPoints dibuja todos los dots de un color de una vez.
  // strokeWidth 10 + round = círculos de radio 5 como antes.
  void _dots(Canvas canvas, List<double> pts, Color color) {
    if (pts.isEmpty) return;
    canvas.drawRawPoints(
      ui.PointMode.points,
      Float32List.fromList(pts),
      Paint()
        ..color = color
        ..strokeWidth = 10
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(covariant EdgePainter old) => old.version != version;
}

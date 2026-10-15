// Painters del canvas.
// Aristas en lote (2 paths + puntos, no 500+500 llamadas) y grid por tiles
// de 512px con memoria constante (nunca una imagen gigante del canvas).
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';

import 'package:me_proyecto/core/theme/app_theme.dart';
import 'package:me_proyecto/features/graph/models/vn_models.dart';

/// Pinta un tile del grid. Los tiles son fijos: memoria constante.
class GridTilePainter extends CustomPainter {
  /// Crea el painter del tile ([tx], [ty]) con lado [size].
  const new({required this.tx, required this.ty, this.size = tile});

  /// Columna del tile en la rejilla.
  final int tx;

  /// Fila del tile en la rejilla.
  final int ty;

  /// Lado del tile en píxeles de escena.
  final double size;

  /// Lado base del tile; se duplica con zoom bajo para dar menos capas.
  static const double tile = 512;

  /// Separación de líneas del grid.
  static const double step = 40;

  @override
  void paint(Canvas c, Size s) {
    final p = Paint()
      ..color = AppColors.surface
      ..strokeWidth = 1;
    final ox = tx * size;
    final oy = ty * size;
    // Alineado al grid global para que las líneas no se corten entre tiles.
    final startX = ox - (ox % step);
    for (var x = startX; x <= ox + size; x += step) {
      c.drawLine(Offset(x - ox, 0), Offset(x - ox, size), p);
    }
    final startY = oy - (oy % step);
    for (var y = startY; y <= oy + size; y += step) {
      c.drawLine(Offset(0, y - oy), Offset(size, y - oy), p);
    }
  }

  @override
  bool shouldRepaint(covariant GridTilePainter old) =>
      old.tx != tx || old.ty != ty || old.size != size;
}

/// Pinta todas las aristas en lote (2 paths + puntos).
class EdgePainter extends CustomPainter {
  /// Crea el painter para [project]; repinta solo si cambia [version].
  new({required this.project, required this.version});

  /// Proyecto cuyas aristas se dibujan.
  final VnProject project;

  /// Versión de datos; [shouldRepaint] compara contra la anterior.
  final int version;

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
      (e.isDanger ? redPath : cyanPath)
        ..moveTo(p1.dx, p1.dy)
        ..cubicTo(mid, p1.dy, mid, p2.dy, p2.dx, p2.dy);
      (e.isDanger ? redPts : cyanPts)
        ..add(p2.dx)
        ..add(p2.dy);
    }
    final cyanLine = Paint()
      ..color = AppColors.cyan
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;
    final redLine = Paint()
      ..color = AppColors.danger
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;
    canvas
      ..drawPath(cyanPath, cyanLine)
      ..drawPath(redPath, redLine);
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

/// Pinta en lote solo las aristas que cruzan un tile.
/// Comparte la rejilla de [GridTilePainter] para alinear capas y
/// evita la textura gigante del canvas completo que ahoga a las iGPU.
class EdgeTilePainter extends CustomPainter {
  /// Crea el painter del tile ([tx], [ty]) para [project] y [version].
  new({
    required this.project,
    required this.version,
    required this.tx,
    required this.ty,
    this.size = GridTilePainter.tile,
  });

  /// Proyecto cuyas aristas se dibujan.
  final VnProject project;

  /// Versión de datos; repinta solo si cambia.
  final int version;

  /// Columna del tile.
  final int tx;

  /// Fila del tile.
  final int ty;

  /// Lado del tile en píxeles de escena.
  final double size;

  static Offset _out(VnNode n) =>
      Offset(n.x + (n.type == VnNodeType.start ? 110 : 190), n.y + 40);
  static Offset _inp(VnNode n) => Offset(n.x, n.y + 40);

  @override
  void paint(Canvas canvas, Size s) {
    // Margen para grosor de línea y dots en el borde del tile.
    final bounds = Rect.fromLTWH(
      tx * size - 12,
      ty * size - 12,
      size + 24,
      size + 24,
    );
    final idx = <String, VnNode>{for (final n in project.nodes) n.id: n};
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
      // La curva vive dentro del bbox de sus extremos: si no toca el
      // tile se salta sin pintar nada.
      if (!Rect.fromPoints(p1, p2).overlaps(bounds)) continue;
      final mid = (p1.dx + p2.dx) / 2;
      (e.isDanger ? redPath : cyanPath)
        ..moveTo(p1.dx - tx * size, p1.dy - ty * size)
        ..cubicTo(
          mid - tx * size,
          p1.dy - ty * size,
          mid - tx * size,
          p2.dy - ty * size,
          p2.dx - tx * size,
          p2.dy - ty * size,
        );
      (e.isDanger ? redPts : cyanPts)
        ..add(p2.dx - tx * size)
        ..add(p2.dy - ty * size);
    }
    final cyanLine = Paint()
      ..color = AppColors.cyan
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;
    final redLine = Paint()
      ..color = AppColors.danger
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;
    canvas
      ..drawPath(cyanPath, cyanLine)
      ..drawPath(redPath, redLine);
    _dots(canvas, cyanPts, AppColors.cyan);
    _dots(canvas, redPts, AppColors.danger);
  }

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
  bool shouldRepaint(covariant EdgeTilePainter old) =>
      old.version != version ||
      old.tx != tx ||
      old.ty != ty ||
      old.size != size;
}

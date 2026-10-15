// Micro-benchmarks de pintado (CPU-side, sin GPU).
// Mismo método que el baseline (5.14 ms aristas, 0.72 ms grid-full).
// La prueba real de fps sigue siendo el FpsChip en release.
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:me_proyecto/features/graph/editor/painters.dart';
import 'package:me_proyecto/features/graph/models/vn_models.dart';

void paintOnce(CustomPainter painter, Size size) {
  final r = ui.PictureRecorder();
  final c = ui.Canvas(r);
  painter.paint(c, size);
  r.endRecording().dispose();
}

void bench(String name, void Function() fn, {int iters = 30}) {
  fn(); // calentamiento
  final sw = Stopwatch()..start();
  for (var i = 0; i < iters; i++) {
    fn();
  }
  sw.stop();
  final avg = sw.elapsedMicroseconds / iters / 1000;
  debugPrint('BENCH $name: ${avg.toStringAsFixed(2)} ms/op');
}

void main() {
  test('bench_aristas_estres_500', () {
    final p = VnProject.stress500();
    final painter = EdgePainter(project: p, version: 1);
    bench(
      'edges-500-batched',
      () => paintOnce(painter, const Size(8000, 4000)),
    );
  });

  test('bench_grid_tiles_visibles', () {
    // Ventana típica 1400x900 -> ~4x3 tiles de 512 con margen.
    const tile = Size(GridTilePainter.tile, GridTilePainter.tile);
    bench('grid-tiled-12', () {
      for (var tx = 0; tx < 4; tx++) {
        for (var ty = 0; ty < 3; ty++) {
          paintOnce(GridTilePainter(tx: tx, ty: ty), tile);
        }
      }
    });
  });
}

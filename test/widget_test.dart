// Test humo del editor: verifica que el canvas demo carga.
// Cubre Happy path mínimo sin integraciones externas.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:me_proyecto/main.dart';
import 'package:me_proyecto/models/vn_models.dart';
import 'package:me_proyecto/export/html_exporter.dart';

void main() {
  testWidgets('deberia_mostrar_proyecto_demo_en_editor', (tester) async {
    tester.view.physicalSize = const Size(1400, 900);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });
    await tester.pumpWidget(const MyNovelApp());
    await tester.pumpAndSettle();
    expect(find.textContaining('Project: My Novel'), findsOneWidget);
    expect(find.text('Start'), findsOneWidget);
    expect(find.textContaining('Dialogue - 01'), findsOneWidget);
  });

  test('deberia_generar_html_jugable', () {
    final p = VnProject.demo();
    final html = buildPlayableHtml(p);
    expect(html.contains('My Novel'), true);
    expect(html.contains('choice_01'), true);
    expect(html.contains('Believe her'), true);
  });

  test('deberia_tener_aristas_cyan_y_roja', () {
    final p = VnProject.demo();
    expect(p.edges.length, 5);
    expect(p.edges.where((e) => e.isDanger).length, 1);
  });
}

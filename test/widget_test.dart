// Tests de widget del editor y del exportador HTML.
// Sin integraciones externas: corren offline en CI y en local.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:me_proyecto/app/app.dart';
import 'package:me_proyecto/features/graph/export/html_exporter.dart';
import 'package:me_proyecto/features/graph/models/vn_models.dart';

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
    expect(html.contains('My Novel'), isTrue);
    expect(html.contains('choice_01'), isTrue);
    expect(html.contains('Believe her'), isTrue);
  });

  test('deberia_exportar_proyecto_vacio_sin_fallar', () {
    const p = VnProject(title: 'Vacio', nodes: [], edges: []);
    final html = buildPlayableHtml(p);
    expect(html.contains('Vacio'), isTrue);
  });

  testWidgets('deberia_animar_fit_y_agregar_nodo', (tester) async {
    tester.view.physicalSize = const Size(1400, 900);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });
    await tester.pumpWidget(const MyNovelApp());
    await tester.pumpAndSettle();
    await tester.tap(find.text('Fit'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('+ Dialogue'));
    await tester.pumpAndSettle();
    expect(find.textContaining('dialogue -'), findsWidgets);
  });
}

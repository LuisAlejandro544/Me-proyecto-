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

  testWidgets('deberia_arrastrar_nodo_con_sus_conexiones', (tester) async {
    tester.view.physicalSize = const Size(1400, 900);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });
    await tester.pumpWidget(const MyNovelApp());
    await tester.pumpAndSettle();
    final before = tester.getTopLeft(find.text('Start'));
    final dlgBefore = tester.getTopLeft(find.textContaining('Dialogue - 01'));
    await tester.timedDrag(
      find.text('Start'),
      const Offset(120, 80),
      const Duration(milliseconds: 300),
    );
    await tester.pumpAndSettle();
    final after = tester.getTopLeft(find.text('Start'));
    final dlgAfter = tester.getTopLeft(find.textContaining('Dialogue - 01'));
    // El canvas no debe moverse al arrastrar un nodo.
    expect((dlgAfter - dlgBefore).distance, lessThan(1));
    // El nodo sigue al dedo (menos el slop inicial del gesto).
    expect((after - before).dx, greaterThan(60));
    expect((after - before).dy, greaterThan(40));
  });
}

// Tests de widget del home, editor y exportador HTML.
// Sin integraciones externas: corren offline en CI y en local.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:me_proyecto/app/app.dart';
import 'package:me_proyecto/features/graph/editor/editor_screen.dart';
import 'package:me_proyecto/features/graph/export/html_exporter.dart';
import 'package:me_proyecto/features/graph/models/vn_models.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues(const {});
  });

  testWidgets('deberia_mostrar_menu_principal_con_3_botones', (tester) async {
    tester.view.physicalSize = const Size(1400, 900);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });
    await tester.pumpWidget(const MyNovelApp());
    await tester.pumpAndSettle();
    expect(find.text('Manga Maker'), findsOneWidget);
    expect(find.text('Continuar'), findsOneWidget);
    expect(find.text('Abrir proyecto'), findsOneWidget);
    expect(find.text('Opciones'), findsOneWidget);
  });

  testWidgets('deberia_abrir_slots_y_mostrar_opciones_bloqueadas',
      (tester) async {
    tester.view.physicalSize = const Size(1400, 900);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });
    await tester.pumpWidget(const MyNovelApp());
    await tester.pumpAndSettle();

    await tester.tap(find.text('Abrir proyecto'));
    await tester.pumpAndSettle();
    expect(find.text('Proyectos guardados'), findsOneWidget);
    expect(find.text('Slot vacío'), findsWidgets);
    await tester.tap(find.text('Nuevo').first);
    await tester.pumpAndSettle();
    expect(find.text('Nuevo proyecto'), findsOneWidget);
    await tester.tap(find.text('Cancelar'));
    await tester.pumpAndSettle();

    // Cierra la hoja para probar Opciones.
    await tester.tapAt(const Offset(700, 100));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Opciones'));
    await tester.pumpAndSettle();
    expect(
      find.text('Esta sección estará disponible en una próxima versión.'),
      findsOneWidget,
    );
  });

  testWidgets('deberia_abrir_editor_con_slot_y_guardar', (tester) async {
    tester.view.physicalSize = const Size(1400, 900);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });
    await tester.pumpWidget(
      MaterialApp(
        home: EditorScreen(
          initialProject: VnProject.demo(),
          slotIndex: 0,
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.textContaining('Project: My Novel'), findsOneWidget);
    expect(find.text('Start'), findsOneWidget);
    expect(find.text('Save'), findsOneWidget);
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();
    expect(find.textContaining('Slot 1'), findsWidgets);
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
    await tester.pumpWidget(
      MaterialApp(
        home: EditorScreen(
          initialProject: VnProject.demo(),
          slotIndex: 0,
        ),
      ),
    );
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
    await tester.pumpWidget(
      MaterialApp(
        home: EditorScreen(
          initialProject: VnProject.demo(),
          slotIndex: 0,
        ),
      ),
    );
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

// Tests: widget del editor + unidad del modelo y del controlador.
// Sin integraciones externas: corren offline en CI y en local.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:me_proyecto/app/app.dart';
import 'package:me_proyecto/features/graph/models/vn_models.dart';
import 'package:me_proyecto/features/graph/state/graph_controller.dart';
import 'package:me_proyecto/features/graph/export/html_exporter.dart';

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

  test('deberia_generar_estres_500_nodos_validos', () {
    final p = VnProject.stress500();
    expect(p.nodes.length, 500);
    expect(p.edges.length, 499);
    final ids = {for (final n in p.nodes) n.id};
    for (final e in p.edges) {
      expect(ids.contains(e.fromId), true);
      expect(ids.contains(e.toId), true);
    }
  });

  group('GraphController', () {
    test('deberia_indexar_demo_y_mover_nodo', () {
      final c = GraphController.demo();
      addTearDown(c.dispose);
      expect(c.index.length, 6);
      final n = c.index['dlg_01']!;
      c.moveNode(n, 10, 20);
      expect(n.x, 490);
      expect(c.posOf['dlg_01']!.value, const Offset(490, 220));
    });

    test('deberia_agregar_y_borrar_sin_huerfanos', () {
      final c = GraphController.demo();
      addTearDown(c.dispose);
      c.addNode(VnNodeType.dialogue);
      expect(c.index.length, 7);
      final n = c.project.nodes.last;
      c.deleteNode(n);
      expect(c.index.length, 6);
      expect(c.posOf.containsKey(n.id), false);
    });

    test('deberia_cargar_estres_500_de_una_vez', () {
      final c = GraphController.demo();
      addTearDown(c.dispose);
      c.stress500();
      expect(c.project.nodes.length, 500);
      expect(c.index.length, 500);
      expect(c.posOf.length, 500);
    });
  });
}

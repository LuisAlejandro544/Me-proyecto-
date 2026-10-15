// Tests de unidad del modelo y del controlador.
// Incluyen casos borde: ids inexistentes, igualdad y proyecto vacío.
import 'package:flutter_test/flutter_test.dart';
import 'package:me_proyecto/features/graph/models/vn_models.dart';
import 'package:me_proyecto/features/graph/state/graph_controller.dart';

void main() {
  group('VnProject', () {
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
        expect(ids.contains(e.fromId), isTrue);
        expect(ids.contains(e.toId), isTrue);
      }
    });

    test('deberia_lanzar_StateError_con_id_inexistente', () {
      expect(() => VnProject.demo().byId('no-existe'), throwsStateError);
    });

    test('deberia_comparar_nodos_por_valor', () {
      const a = VnNode(
        id: 'x',
        type: VnNodeType.start,
        title: 'Start',
        x: 1,
        y: 2,
      );
      const b = VnNode(
        id: 'x',
        type: VnNodeType.start,
        title: 'Start',
        x: 1,
        y: 2,
      );
      expect(a, b);
      expect(a.copyWith(x: 9), isNot(b));
    });
  });

  group('GraphController', () {
    test('deberia_indexar_demo_y_mover_sin_mutar_original', () {
      final c = GraphController.demo();
      addTearDown(c.dispose);
      expect(c.index.length, 6);
      final before = c.index['dlg_01']!;
      c.moveNode(before, 10, 20);
      final after = c.index['dlg_01']!;
      expect(after.x, 490);
      expect(after.y, 220);
      expect(before.x, 480);
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
      expect(c.posOf.containsKey(n.id), isFalse);
    });

    test('deberia_ignorar_borrado_de_nodo_inexistente', () {
      final c = GraphController.demo();
      addTearDown(c.dispose);
      const ghost = VnNode(
        id: 'fantasma',
        type: VnNodeType.sound,
        title: 'x',
        x: 0,
        y: 0,
      );
      c.deleteNode(ghost);
      expect(c.index.length, 6);
      expect(c.project.nodes.length, 6);
    });

    test('deberia_ignorar_movimiento_de_nodo_inexistente', () {
      final c = GraphController.demo();
      addTearDown(c.dispose);
      const ghost = VnNode(
        id: 'fantasma',
        type: VnNodeType.sound,
        title: 'x',
        x: 0,
        y: 0,
      );
      c.moveNode(ghost, 5, 5);
      expect(c.edgeVersion.value, 0);
    });

    test('deberia_cargar_estres_500_de_una_vez', () {
      final c = GraphController.demo();
      addTearDown(c.dispose);
      c.stress500();
      expect(c.project.nodes.length, 500);
      expect(c.index.length, 500);
      expect(c.posOf.length, 500);
    });

    test('deberia_mover_en_vivo_y_confirmar_al_soltar', () {
      final c = GraphController.demo();
      addTearDown(c.dispose);
      final before = c.index['dlg_01']!;
      c.previewMove(before, 10, 20);
      // La posición sigue en vivo sin esperar al drop...
      expect(c.posOf['dlg_01']!.value, const Offset(490, 220));
      // ...y el commit garantiza el repintado final.
      c.commitMove();
      expect(c.edgeVersion.value, greaterThan(0));
      expect(c.index['dlg_01']!.x, 490);
    });
  });
}

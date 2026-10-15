// Tests de persistencia local: slots, JSON y último proyecto.
// Usan SharedPreferences mock: corren offline en CI y en local.
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:me_proyecto/features/graph/models/vn_models.dart';
import 'package:me_proyecto/features/graph/state/graph_controller.dart';
import 'package:me_proyecto/features/projects/data/project_storage.dart';

void main() {
  group('VnProject JSON', () {
    test('deberia_serializar_demo_round_trip', () {
      final p = VnProject.demo();
      final back = VnProject.fromJson(Map<String, dynamic>.from(p.toJson()));
      expect(back.title, p.title);
      expect(back.nodes.length, p.nodes.length);
      expect(back.edges.length, p.edges.length);
      expect(back.nodes.first.id, p.nodes.first.id);
    });

    test('deberia_tolerar_json_parcial', () {
      final p = VnProject.fromJson(const {'title': 'Roto'});
      expect(p.title, 'Roto');
      expect(p.nodes, isEmpty);
      expect(p.edges, isEmpty);
    });

    test('deberia_crear_blank_con_start', () {
      final p = VnProject.blank(title: 'Mi historia');
      expect(p.title, 'Mi historia');
      expect(p.nodes.length, 1);
      expect(p.nodes.single.type, VnNodeType.start);
      expect(p.edges, isEmpty);
    });
  });

  group('GraphController.fromProject', () {
    test('deberia_indexar_proyecto_dado', () {
      final c = GraphController.fromProject(VnProject.blank());
      addTearDown(c.dispose);
      expect(c.index.length, 1);
      expect(c.project.nodes.single.id, 'start');
    });
  });

  group('ProjectStorage', () {
    test('deberia_guardar_cargar_y_marcar_ultimo', () async {
      SharedPreferences.setMockInitialValues(const {});
      final s = await ProjectStorage.load();
      expect(await s.loadAll(), everyElement(isNull));
      expect(await s.lastSlot(), isNull);

      await s.saveSlot(1, VnProject.demo());
      expect(await s.lastSlot(), 1);
      final loaded = await s.loadSlot(1);
      expect(loaded, isNotNull);
      expect(loaded!.project.title, 'My Novel');
      expect(loaded.project.nodes.length, 6);

      final last = await s.loadLast();
      expect(last, isNotNull);
      expect(last!.slotIndex, 1);
    });

    test('deberia_borrar_slot_sin_tocar_otros', () async {
      SharedPreferences.setMockInitialValues(const {});
      final s = await ProjectStorage.load();
      await s.saveSlot(0, VnProject.blank(title: 'A'));
      await s.saveSlot(2, VnProject.blank(title: 'C'));
      await s.deleteSlot(0);
      expect(await s.loadSlot(0), isNull);
      expect((await s.loadSlot(2))!.project.title, 'C');
    });

    test('deberia_lanzar_RangeError_con_slot_invalido', () async {
      SharedPreferences.setMockInitialValues(const {});
      final s = await ProjectStorage.load();
      expect(() => s.loadSlot(3), throwsRangeError);
      expect(
        () => s.saveSlot(-1, VnProject.demo()),
        throwsA(anything),
      );
    });
  });
}

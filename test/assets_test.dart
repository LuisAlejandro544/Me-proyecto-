// Tests del apartado Assets: modelo + controlador.
// Sin integraciones externas: corren offline en CI y en local.
import 'package:flutter_test/flutter_test.dart';
import 'package:me_proyecto/features/assets/models/asset_models.dart';
import 'package:me_proyecto/features/assets/state/asset_controller.dart';

void main() {
  group('UserAsset', () {
    test('deberia_comparar_por_valor_y_copiar', () {
      const a = UserAsset(id: 'a1', name: 'Bosque', tags: {AssetTag.fondo});
      const b = UserAsset(id: 'a1', name: 'Bosque', tags: {AssetTag.fondo});
      expect(a, b);
      expect(a.copyWith(name: 'Otro'), isNot(b));
    });

    test('deberia_serializar_round_trip', () {
      const a = UserAsset(
        id: 'a1',
        name: 'Yui',
        tags: {AssetTag.personaje, AssetTag.objeto},
        note: 'demo',
      );
      final back = UserAsset.fromJson(a.toJson());
      expect(back, a);
    });

    test('deberia_tolerar_tags_desconocidos', () {
      final a = UserAsset.fromJson(const {
        'id': 'x',
        'name': 'Raro',
        'tags': ['fondo', 'inexistente'],
      });
      expect(a.tags, contains(AssetTag.fondo));
      expect(a.tags, contains(AssetTag.otro));
    });
  });

  group('AssetController', () {
    test('deberia_agregar_renombrar_etiquetar_y_borrar', () {
      final c = AssetController();
      addTearDown(c.dispose);
      final created = c.addAsset('Fondo 1', {AssetTag.fondo});
      expect(created, isNotNull);
      expect(c.all.length, 1);
      expect(c.rename(created!.id, 'Fondo noche'), isTrue);
      expect(c.setTags(created.id, {AssetTag.fondo, AssetTag.otro}), isTrue);
      expect(c.setNote(created.id, 'nota'), isTrue);
      expect(c.all.single.name, 'Fondo noche');
      expect(c.remove(created.id), isTrue);
      expect(c.all, isEmpty);
    });

    test('deberia_ignorar_nombre_vacio_e_ids_fantasma', () {
      final c = AssetController();
      addTearDown(c.dispose);
      expect(c.addAsset('   ', {AssetTag.fondo}), isNull);
      expect(c.rename('fantasma', 'x'), isFalse);
      expect(c.setTags('fantasma', {}), isFalse);
      expect(c.remove('fantasma'), isFalse);
    });

    test('deberia_filtrar_por_etiqueta_y_busqueda', () {
      final c = AssetController.demo();
      addTearDown(c.dispose);
      c.setFilter(AssetTag.fondo);
      expect(c.visible.length, 1);
      expect(c.visible.single.name, 'Bosque noche');
      c
        ..setFilter(null)
        ..setQuery('yui');
      expect(c.visible.length, 1);
      c.setQuery('');
      expect(c.visible.length, 3);
    });

    test('deberia_exportar_e_importar_json', () {
      final c = AssetController.demo();
      addTearDown(c.dispose);
      final json = c.exportJson();
      final d = AssetController();
      addTearDown(d.dispose);
      expect(d.importJson(json), isTrue);
      expect(d.all.length, 3);
      expect(d.importJson('no-json'), isFalse);
      expect(d.importJson('{"a":1}'), isFalse);
    });
  });
}

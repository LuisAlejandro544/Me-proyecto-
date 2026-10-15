// Estado de la librería de assets: CRUD + filtro + export/import JSON.
// Sin dependencias externas: todo en memoria, offline y testeable.
// La colocación en nodos llegará en una fase posterior usando el id.
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:me_proyecto/features/assets/models/asset_models.dart';

/// Único dueño mutable de los assets del usuario.
class AssetController extends ChangeNotifier {
  /// Crea el controlador con los [initial] dados.
  new([List<UserAsset>? initial]) : _assets = List.of(initial ?? const []);

  /// Librería de ejemplo para estrenar el apartado.
  factory demo() => AssetController([
    const UserAsset(
      id: 'asset_bosque',
      name: 'Bosque noche',
      tags: {AssetTag.fondo},
      note: 'Fondo demo',
    ),
    const UserAsset(
      id: 'asset_yui',
      name: 'Yui base',
      tags: {AssetTag.personaje},
      note: 'Placeholder sin copyright',
    ),
    const UserAsset(
      id: 'asset_espada',
      name: 'Espada rota',
      tags: {AssetTag.objeto},
    ),
  ]);

  final List<UserAsset> _assets;

  /// Contador para ids generados.
  int seq = 100;

  /// Filtro activo por etiqueta. Null = todas.
  AssetTag? filter;

  /// Búsqueda por nombre (minúsculas, sin espacios de más).
  String query = '';

  /// Assets visibles según [filter] + [query], en orden de alta.
  List<UserAsset> get visible {
    final q = query.trim().toLowerCase();
    return [
      for (final a in _assets)
        if ((filter == null || a.tags.contains(filter)) &&
            (q.isEmpty || a.name.toLowerCase().contains(q)))
          a,
    ];
  }

  /// Todos los assets sin filtrar (para exportar).
  List<UserAsset> get all => List.unmodifiable(_assets);

  /// Agrega un asset con nombre y etiquetas. Ignora nombres vacíos.
  UserAsset? addAsset(String name, Set<AssetTag> tags, {String note = ''}) {
    final clean = name.trim();
    if (clean.isEmpty) return null;
    seq++;
    final asset = UserAsset(
      id: 'asset_$seq',
      name: clean,
      tags: Set.of(tags),
      note: note.trim(),
    );
    _assets.add(asset);
    notifyListeners();
    return asset;
  }

  /// Renombra el asset con [id]. Devuelve false si no existe o vacío.
  bool rename(String id, String name) {
    final clean = name.trim();
    if (clean.isEmpty) return false;
    final i = _assets.indexWhere((e) => e.id == id);
    if (i < 0) return false;
    _assets[i] = _assets[i].copyWith(name: clean);
    notifyListeners();
    return true;
  }

  /// Reemplaza las etiquetas del asset con [id].
  bool setTags(String id, Set<AssetTag> tags) {
    final i = _assets.indexWhere((e) => e.id == id);
    if (i < 0) return false;
    _assets[i] = _assets[i].copyWith(tags: Set.of(tags));
    notifyListeners();
    return true;
  }

  /// Reemplaza la nota del asset con [id].
  bool setNote(String id, String note) {
    final i = _assets.indexWhere((e) => e.id == id);
    if (i < 0) return false;
    _assets[i] = _assets[i].copyWith(note: note.trim());
    notifyListeners();
    return true;
  }

  /// Borra el asset con [id]. No falla si no existe.
  bool remove(String id) {
    final before = _assets.length;
    _assets.removeWhere((e) => e.id == id);
    if (_assets.length == before) return false;
    notifyListeners();
    return true;
  }

  /// Cambia el filtro por etiqueta (null = todas).
  void setFilter(AssetTag? tag) {
    filter = tag;
    notifyListeners();
  }

  /// Cambia la búsqueda por nombre.
  void setQuery(String q) {
    query = q;
    notifyListeners();
  }

  /// Exporta la librería como JSON (para compartir/guardar).
  String exportJson() => jsonEncode([for (final a in _assets) a.toJson()]);

  /// Reemplaza la librería desde un JSON de [exportJson].
  /// Devuelve false si el texto no es una lista válida.
  bool importJson(String raw) {
    try {
      final decoded = jsonDecode(raw);
      if (decoded is! List) return false;
      final next = <UserAsset>[];
      for (final e in decoded) {
        if (e is Map<String, Object?>) {
          next.add(UserAsset.fromJson(e));
        } else if (e is Map) {
          next.add(UserAsset.fromJson(e.map((k, v) => MapEntry('$k', v))));
        } else {
          return false;
        }
      }
      _assets
        ..clear()
        ..addAll(next);
      notifyListeners();
      return true;
    } on FormatException {
      return false;
    }
  }
}

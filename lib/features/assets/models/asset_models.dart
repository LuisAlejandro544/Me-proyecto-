// Modelos del administrador de Assets: asset de usuario + etiquetas.
// Sin dependencias de Flutter: testeable en puro Dart.
// Fase 1: solo librería (CRUD + etiquetas + export JSON).
// Fase 2 (futura): placement en nodos referenciando [UserAsset.id].
import 'package:flutter/foundation.dart';
import 'package:me_proyecto/features/graph/graph.dart' show VnNode;
import 'package:me_proyecto/features/graph/models/vn_models.dart' show VnNode;

/// Etiqueta de un asset. Sirve para filtrar y para el futuro placement
/// en nodos (ej. fondo -> escena, personaje -> sprite).
enum AssetTag {
  /// Imagen de fondo de escena.
  fondo,

  /// Personaje / sprite.
  personaje,

  /// Objeto / prop.
  objeto,

  /// Música o efecto (reservado, sin audio aún).
  musica,

  /// Cualquier otro uso.
  otro,
}

/// Etiqueta visible en español para cada valor de la enumeración.
extension AssetTagLabel on AssetTag {
  /// Texto corto para chips y diálogos.
  String get label => switch (this) {
    AssetTag.fondo => 'fondo',
    AssetTag.personaje => 'personaje',
    AssetTag.objeto => 'objeto',
    AssetTag.musica => 'música',
    AssetTag.otro => 'otro',
  };
}

/// Parsea una etiqueta desde texto. Devuelve otro si no coincide
/// (migración tolerante).
AssetTag assetTagFromString(String s) {
  final v = s.trim().toLowerCase();
  for (final t in AssetTag.values) {
    if (t.name == v || t.label == v) return t;
  }
  return AssetTag.otro;
}

/// Asset de usuario: referencia lógica sin bytes ni paths.
///
/// No guarda `Uint8List`/`File` a propósito: en esta fase el asset es un
/// registro (nombre + etiquetas) listo para que la fase 2 le cuelgue
/// bytes en disco/web y `AssetPlacement` en [VnNode].
/// La colocación en nodos llegará más adelante y usará este [id].
@immutable
class UserAsset {
  /// Crea un asset inmutable.
  const new({
    required this.id,
    required this.name,
    this.tags = const {},
    this.note = '',
  });

  /// Reconstruye desde JSON. Tolerante: tags desconocidos -> [AssetTag.otro],
  /// campos ausentes -> valores por defecto.
  factory fromJson(Map<String, Object?> json) {
    final rawTags = json['tags'];
    final tags = <AssetTag>{};
    if (rawTags is List) {
      for (final e in rawTags) {
        if (e is String) tags.add(assetTagFromString(e));
      }
    }
    return UserAsset(
      id: '${json['id'] ?? 'asset_x'}',
      name: '${json['name'] ?? 'Sin nombre'}',
      tags: tags,
      note: '${json['note'] ?? ''}',
    );
  }

  /// Identificador único estable (futura clave de placement en nodos).
  final String id;

  /// Nombre visible en la galería.
  final String name;

  /// Etiquetas como "fondo" o "personaje". Vacío = sin etiquetar.
  final Set<AssetTag> tags;

  /// Nota opcional (origen, autor, licencia...).
  final String note;

  /// Copia con los campos indicados reemplazados.
  UserAsset copyWith({
    String? id,
    String? name,
    Set<AssetTag>? tags,
    String? note,
  }) {
    return UserAsset(
      id: id ?? this.id,
      name: name ?? this.name,
      tags: tags ?? this.tags,
      note: note ?? this.note,
    );
  }

  /// Serializa a JSON (para exportar la librería).
  Map<String, Object?> toJson() => {
    'id': id,
    'name': name,
    'tags': [for (final t in tags) t.name],
    'note': note,
  };

  @override
  bool operator ==(Object other) =>
      other is UserAsset &&
      other.id == id &&
      other.name == name &&
      other.note == note &&
      setEquals(other.tags, tags);

  @override
  int get hashCode =>
      Object.hash(id, name, note, Object.hashAllUnordered(tags));
}

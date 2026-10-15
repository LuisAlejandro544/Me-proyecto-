// Slot guardado: proyecto + metadatos para la pantalla de inicio.
// Sin dependencias de Flutter: testeable en puro Dart.
import 'package:me_proyecto/features/graph/models/vn_models.dart';

/// Un hueco de guardado local (0..2) con su proyecto y fecha.
class SavedSlot {
  /// Crea un slot con su proyecto.
  const new({
    required this.slotIndex,
    required this.project,
    required this.updatedAt,
  });

  /// Índice del slot (0, 1 o 2).
  final int slotIndex;

  /// Proyecto guardado.
  final VnProject project;

  /// Última vez que se guardó.
  final DateTime updatedAt;

  /// Serializa para SharedPreferences.
  Map<String, Object?> toJson() => {
    'slotIndex': slotIndex,
    'updatedAt': updatedAt.toIso8601String(),
    'project': project.toJson(),
  };

  /// Reconstruye desde JSON. Devuelve null si el payload es inválido.
  static SavedSlot? tryFromJson(int slotIndex, Map<String, dynamic> json) {
    try {
      final rawProject = json['project'] as Map<String, dynamic>?;
      if (rawProject == null) return null;
      final rawDate = json['updatedAt'] as String?;
      return SavedSlot(
        slotIndex: slotIndex,
        project: VnProject.fromJson(rawProject),
        updatedAt: rawDate == null
            ? DateTime.fromMillisecondsSinceEpoch(0)
            : DateTime.tryParse(rawDate) ??
                  DateTime.fromMillisecondsSinceEpoch(0),
      );
    } catch (_) {
      return null;
    }
  }
}

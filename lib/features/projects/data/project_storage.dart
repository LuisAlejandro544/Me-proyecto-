// Persistencia local de proyectos en 3 slots (SharedPreferences).
// Claves versionadas: si el formato cambia, se bumpéa _kVersion.
import 'dart:convert';

import 'package:me_proyecto/features/graph/models/vn_models.dart';
import 'package:me_proyecto/features/projects/models/saved_slot.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Guarda/carga hasta 3 proyectos en el almacenamiento local.
///
/// Esquema de claves:
/// - `vn_slot_v1_<i>` : JSON del [SavedSlot] del slot `i`.
/// - `vn_last_slot_v1` : último slot abierto para "Continuar".
class ProjectStorage {
  /// Crea el storage con las prefs ya resueltas (inyectable en tests).
  const new(this._prefs);

  /// Resuelve SharedPreferences y construye el storage.
  static Future<ProjectStorage> load() async {
    final prefs = await SharedPreferences.getInstance();
    return ProjectStorage(prefs);
  }

  /// Número de slots disponibles (fijo a 3 por ahora).
  static const int slotCount = 3;

  static String _slotKey(int slot) => 'vn_slot_v1_$slot';
  static const String _lastKey = 'vn_last_slot_v1';

  final SharedPreferences _prefs;

  /// Lee un slot. Devuelve null si está vacío o corrupto.
  Future<SavedSlot?> loadSlot(int slot) async {
    _checkRange(slot);
    final raw = _prefs.getString(_slotKey(slot));
    if (raw == null || raw.isEmpty) return null;
    try {
      final json = jsonDecode(raw) as Map<String, dynamic>;
      return SavedSlot.tryFromJson(slot, json);
    } on Object catch (_) {
      return null;
    }
  }

  /// Lee los 3 slots en orden (null = vacío).
  Future<List<SavedSlot?>> loadAll() async {
    final out = <SavedSlot?>[];
    for (var i = 0; i < slotCount; i++) {
      out.add(await loadSlot(i));
    }
    return out;
  }

  /// Guarda [project] en [slot] y lo marca como último abierto.
  Future<void> saveSlot(int slot, VnProject project) async {
    _checkRange(slot);
    final saved = SavedSlot(
      slotIndex: slot,
      project: project,
      updatedAt: DateTime.now(),
    );
    await _prefs.setString(_slotKey(slot), jsonEncode(saved.toJson()));
    await setLastSlot(slot);
  }

  /// Vacía un slot sin tocar el resto.
  Future<void> deleteSlot(int slot) async {
    _checkRange(slot);
    await _prefs.remove(_slotKey(slot));
  }

  /// Último slot abierto (para el botón Continuar). Null si nunca se abrió.
  Future<int?> lastSlot() async {
    final v = _prefs.getInt(_lastKey);
    if (v == null || v < 0 || v >= slotCount) return null;
    return v;
  }

  /// Marca [slot] como último abierto.
  Future<void> setLastSlot(int slot) async {
    _checkRange(slot);
    await _prefs.setInt(_lastKey, slot);
  }

  /// Carga el proyecto del último slot, o null si está vacío.
  Future<SavedSlot?> loadLast() async {
    final last = await lastSlot();
    if (last == null) return null;
    return await loadSlot(last);
  }

  void _checkRange(int slot) {
    assert(slot >= 0 && slot < slotCount, 'Slot fuera de rango: $slot');
    if (slot < 0 || slot >= slotCount) {
      throw RangeError('Slot fuera de rango (0..${slotCount - 1}): $slot');
    }
  }
}

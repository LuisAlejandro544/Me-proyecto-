// Menú principal: Continuar / Abrir proyecto / Opciones (bloqueado).
// Orquesta ProjectStorage + navegación al editor. UI en widgets aparte.
import 'dart:async';

import 'package:flutter/material.dart';

import 'package:me_proyecto/core/theme/app_theme.dart';
import 'package:me_proyecto/features/graph/editor/editor_screen.dart';
import 'package:me_proyecto/features/graph/models/vn_models.dart';
import 'package:me_proyecto/features/home/widgets/home_menu_button.dart';
import 'package:me_proyecto/features/home/widgets/options_sheet.dart';
import 'package:me_proyecto/features/home/widgets/slot_picker_sheet.dart';
import 'package:me_proyecto/features/projects/data/project_storage.dart';
import 'package:me_proyecto/features/projects/models/saved_slot.dart';

/// Pantalla de inicio de Manga Maker / My Novel.
class HomeScreen extends StatefulWidget {
  /// Crea el menú principal.
  const new({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  ProjectStorage? _storage;
  List<SavedSlot?> _slots = List.filled(ProjectStorage.slotCount, null);
  int? _lastSlot;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    unawaited(_reload());
  }

  Future<void> _reload() async {
    final storage = _storage ?? await ProjectStorage.load();
    final slots = await storage.loadAll();
    final last = await storage.lastSlot();
    // Si el último slot se borró, el Continuar se deshabilita.
    final lastValid = last != null && slots[last] != null ? last : null;
    if (!mounted) return;
    setState(() {
      _storage = storage;
      _slots = slots;
      _lastSlot = lastValid;
      _loading = false;
    });
  }

  SavedSlot? get _lastSaved =>
      _lastSlot == null ? null : _slots[_lastSlot!];

  Future<void> _continueLast() async {
    final saved = _lastSaved;
    if (saved == null) return;
    await _openEditor(saved.slotIndex, saved.project);
  }

  Future<void> _openSlots() async {
    await showSlotPickerSheet(
      context: context,
      slots: _slots,
      onOpen: (slot) async {
        final saved = _slots[slot];
        if (saved == null) return;
        await _storage?.setLastSlot(slot);
        await _openEditor(slot, saved.project);
      },
      onCreate: (slot, title) async {
        final project = VnProject.blank(title: title);
        await _storage?.saveSlot(slot, project);
        await _openEditor(slot, project);
      },
      onDelete: (slot) {
        // Borrado optimista: la hoja actualiza su UI al instante,
        // el home se recarga al cerrar la hoja (ver _reload de abajo).
        unawaited(_storage?.deleteSlot(slot));
      },
    );
    await _reload();
  }

  Future<void> _openEditor(int slot, VnProject project) async {
    await Navigator.push<void>(
      context,
      MaterialPageRoute(
        builder: (_) => EditorScreen(initialProject: project, slotIndex: slot),
      ),
    );
    // Al volver del editor refrescamos (pudo guardar o crear otro).
    await _reload();
  }

  @override
  Widget build(BuildContext context) {
    final canContinue = _lastSaved != null && !_loading;
    final used = _slots.where((s) => s != null).length;
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF1A2B4A), AppColors.bg],
            stops: [0, 0.45],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 16,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 24),
                    _Header(usedSlots: used),
                    const SizedBox(height: 32),
                    if (_loading)
                      const Center(
                        child: Padding(
                          padding: EdgeInsets.all(24),
                          child: CircularProgressIndicator(
                            color: AppColors.cyan,
                          ),
                        ),
                      )
                    else ...[
                      HomeMenuButton(
                        icon: Icons.play_arrow,
                        title: 'Continuar',
                        subtitle: canContinue
                            ? '"${_lastSaved!.project.title}"'
                                ' · Slot ${_lastSaved!.slotIndex + 1}'
                            : 'Aún no hay proyecto en curso',
                        accent: AppColors.ok,
                        enabled: canContinue,
                        onTap: canContinue ? _continueLast : null,
                      ),
                      const SizedBox(height: 14),
                      HomeMenuButton(
                        icon: Icons.folder_open_outlined,
                        title: 'Abrir proyecto',
                        subtitle:
                            '$used de ${ProjectStorage.slotCount}'
                            ' slots en uso',
                        onTap: _openSlots,
                        trailing: _SlotDots(slots: _slots),
                      ),
                      const SizedBox(height: 14),
                      HomeMenuButton(
                        icon: Icons.settings_outlined,
                        title: 'Opciones',
                        subtitle: 'Bloqueado por ahora',
                        accent: Colors.white54,
                        locked: true,
                        onTap: () => showOptionsSheet(context),
                      ),
                    ],
                    const Spacer(),
                    const Text(
                      'Guardado local · 3 slots · v1.0.0',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.white30, fontSize: 12),
                    ),
                    const SizedBox(height: 8),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const new({required this.usedSlots});

  final int usedSlots;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 84,
          height: 84,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [AppColors.cyan, Color(0xFF818CF8)],
            ),
            borderRadius: BorderRadius.circular(28),
            boxShadow: [
              BoxShadow(
                color: AppColors.cyan.withValues(alpha: 0.35),
                blurRadius: 32,
                spreadRadius: 2,
              ),
            ],
          ),
          child: const Icon(
            Icons.auto_stories_outlined,
            color: Colors.white,
            size: 44,
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          'Manga Maker',
          style: TextStyle(
            color: Colors.white,
            fontSize: 34,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.5,
          ),
        ),
        const Text(
          'MY NOVEL · editor visual por nodos',
          style: TextStyle(
            color: AppColors.cyan,
            fontSize: 12,
            fontWeight: FontWeight.w600,
            letterSpacing: 1.6,
          ),
        ),
        const SizedBox(height: 10),
        Text(
          usedSlots == 0
              ? 'Crea tu primera historia visual'
              : 'Tienes $usedSlots '
                  '${usedSlots == 1
                      ? 'proyecto guardado'
                      : 'proyectos guardados'}',
          style: const TextStyle(color: Colors.white54, fontSize: 13),
        ),
      ],
    );
  }
}

class _SlotDots extends StatelessWidget {
  const new({required this.slots});

  final List<SavedSlot?> slots;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (var i = 0; i < slots.length; i++)
          Container(
            width: 10,
            height: 10,
            margin: const EdgeInsets.only(left: 4),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: slots[i] != null ? AppColors.cyan : Colors.white12,
              border: Border.all(
                color: slots[i] != null ? AppColors.cyan : AppColors.line,
              ),
            ),
          ),
      ],
    );
  }
}

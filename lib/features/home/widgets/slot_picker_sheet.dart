// Hoja inferior para elegir slot: abrir, crear o borrar proyectos.
// Separada del home para mantener cada archivo pequeño y legible.
import 'dart:async';

import 'package:flutter/material.dart';
import 'package:me_proyecto/core/theme/app_theme.dart';
import 'package:me_proyecto/features/projects/models/saved_slot.dart';

/// Resultado de pedir el título de un proyecto nuevo.
Future<String?> showNewProjectDialog(
  BuildContext context, {
  String initial = 'Mi historia',
}) {
  final ctrl = TextEditingController(text: initial);
  return showDialog<String>(
    context: context,
    builder: (ctx) => AlertDialog(
      backgroundColor: AppColors.surface,
      title: const Text(
        'Nuevo proyecto',
        style: TextStyle(color: Colors.white),
      ),
      content: TextField(
        controller: ctrl,
        autofocus: true,
        maxLength: 40,
        style: const TextStyle(color: Colors.white),
        decoration: const InputDecoration(
          hintText: 'Nombre de tu historia',
          hintStyle: TextStyle(color: Colors.white38),
          enabledBorder: UnderlineInputBorder(
            borderSide: BorderSide(color: AppColors.cyan),
          ),
          focusedBorder: UnderlineInputBorder(
            borderSide: BorderSide(color: AppColors.cyan, width: 2),
          ),
        ),
        onSubmitted: (_) => Navigator.pop(ctx, ctrl.text.trim()),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(ctx),
          child: const Text('Cancelar'),
        ),
        ElevatedButton(
          onPressed: () => Navigator.pop(ctx, ctrl.text.trim()),
          child: const Text('Crear'),
        ),
      ],
    ),
  );
}

/// Muestra la hoja de 3 slots y delega las acciones al home.
Future<void> showSlotPickerSheet({
  required BuildContext context,
  required List<SavedSlot?> slots,
  required ValueChanged<int> onOpen,
  required void Function(int slot, String title) onCreate,
  required ValueChanged<int> onDelete,
}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.surface,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (ctx) => _SlotPickerBody(
      slots: slots,
      onOpen: (s) {
        Navigator.pop(ctx);
        onOpen(s);
      },
      onCreate: (s) async {
        final title = await showNewProjectDialog(ctx);
        if (title == null || title.trim().isEmpty) return;
        if (!ctx.mounted) return;
        Navigator.pop(ctx);
        onCreate(s, title.trim());
      },
      onDelete: onDelete,
    ),
  );
}

class _SlotPickerBody extends StatefulWidget {
  const new({
    required this.slots,
    required this.onOpen,
    required this.onCreate,
    required this.onDelete,
  });

  final List<SavedSlot?> slots;
  final ValueChanged<int> onOpen;
  final ValueChanged<int> onCreate;
  final ValueChanged<int> onDelete;

  @override
  State<_SlotPickerBody> createState() => _SlotPickerBodyState();
}

class _SlotPickerBodyState extends State<_SlotPickerBody> {
  late List<SavedSlot?> _local;

  @override
  void initState() {
    super.initState();
    _local = List.of(widget.slots);
  }

  void _handleDelete(int slot) {
    widget.onDelete(slot);
    setState(() => _local[slot] = null);
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.line,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Proyectos guardados',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              '3 slots en este dispositivo. '
              'Toca un slot para abrirlo o crear uno nuevo.',
              style: TextStyle(color: Colors.white54, fontSize: 13),
            ),
            const SizedBox(height: 16),
            for (var i = 0; i < _local.length; i++) ...[
              _SlotCard(
                index: i,
                saved: _local[i],
                onOpen: () => widget.onOpen(i),
                onCreate: () => widget.onCreate(i),
                onDelete: () => _handleDelete(i),
              ),
              if (i < _local.length - 1) const SizedBox(height: 10),
            ],
          ],
        ),
      ),
    );
  }
}

class _SlotCard extends StatelessWidget {
  const new({
    required this.index,
    required this.saved,
    required this.onOpen,
    required this.onCreate,
    required this.onDelete,
  });

  final int index;
  final SavedSlot? saved;
  final VoidCallback onOpen;
  final VoidCallback onCreate;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final hasData = saved != null;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.bg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: hasData ? AppColors.cyan : AppColors.line,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: hasData ? AppColors.cyanSoft : Colors.white10,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              '${index + 1}',
              style: TextStyle(
                color: hasData ? AppColors.cyan : Colors.white54,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: hasData
                ? Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        saved!.project.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${saved!.project.nodes.length} '
                        'nodos · ${_fmtDate(saved!.updatedAt)}',
                        style: const TextStyle(
                          color: Colors.white54,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  )
                : const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Slot vacío',
                        style: TextStyle(
                          color: Colors.white54,
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                      Text(
                        'Crea aquí tu próxima historia',
                        style: TextStyle(
                          color: Colors.white30,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
          ),
          const SizedBox(width: 8),
          if (hasData) ...[
            IconButton(
              tooltip: 'Abrir',
              onPressed: onOpen,
              icon: const Icon(Icons.play_arrow, color: AppColors.cyan),
            ),
            IconButton(
              tooltip: 'Borrar',
              onPressed: () => _confirmDelete(context),
              icon: const Icon(Icons.delete_outline, color: AppColors.danger),
            ),
          ] else
            OutlinedButton.icon(
              onPressed: onCreate,
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Nuevo'),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.white,
                side: const BorderSide(color: AppColors.cyan),
              ),
            ),
        ],
      ),
    );
  }

  void _confirmDelete(BuildContext context) {
    unawaited(
      showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: AppColors.surface,
          title: const Text(
            'Borrar proyecto',
            style: TextStyle(color: Colors.white),
          ),
          content: Text(
            '¿Borrar el proyecto '
            '"${saved?.project.title}" del slot ${index + 1}?',
            style: const TextStyle(color: Colors.white70),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancelar'),
            ),
            TextButton(
              onPressed: () {
                Navigator.pop(ctx);
                onDelete();
              },
              style: TextButton.styleFrom(
                foregroundColor: AppColors.danger,
              ),
              child: const Text('Borrar'),
            ),
          ],
        ),
      ),
    );
  }

  static String _fmtDate(DateTime d) {
    final dd = d.day.toString().padLeft(2, '0');
    final mm = d.month.toString().padLeft(2, '0');
    final hh = d.hour.toString().padLeft(2, '0');
    final mi = d.minute.toString().padLeft(2, '0');
    return '$dd/$mm $hh:$mi';
  }
}

// Hoja de opciones (bloqueada por ahora): muestra ajustes futuros.
// Separada para no ensuciar el home_screen.dart.
import 'package:flutter/material.dart';

import 'package:me_proyecto/core/theme/app_theme.dart';

/// Muestra la hoja inferior de Opciones (aún bloqueada).
Future<void> showOptionsSheet(BuildContext context) {
  return showModalBottomSheet<void>(
    context: context,
    backgroundColor: AppColors.surface,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (_) => const _OptionsSheetBody(),
  );
}

class _OptionsSheetBody extends StatelessWidget {
  const new();

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
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
            const SizedBox(height: 16),
            const Row(
              children: [
                Icon(Icons.lock_outline, color: AppColors.warn, size: 22),
                SizedBox(width: 8),
                Text(
                  'Opciones',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(width: 8),
                Text(
                  '· Bloqueado',
                  style: TextStyle(color: Colors.white54, fontSize: 13),
                ),
              ],
            ),
            const SizedBox(height: 8),
            const Text(
              'Esta sección estará disponible en una próxima versión.',
              style: TextStyle(color: Colors.white54, fontSize: 13),
            ),
            const SizedBox(height: 16),
            _lockedRow(Icons.dark_mode_outlined, 'Tema oscuro / claro'),
            _lockedRow(Icons.volume_up_outlined, 'Sonido y música'),
            _lockedRow(Icons.language_outlined, 'Idioma'),
            _lockedRow(Icons.folder_outlined, 'Carpeta de guardado'),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => Navigator.pop(context),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white,
                  side: const BorderSide(color: AppColors.line),
                ),
                child: const Text('Cerrar'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  static Widget _lockedRow(IconData icon, String label) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.line),
      ),
      child: Row(
        children: [
          Icon(icon, color: Colors.white38, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(color: Colors.white38, fontSize: 14),
            ),
          ),
          const Icon(Icons.lock_outline, color: Colors.white24, size: 16),
        ],
      ),
    );
  }
}

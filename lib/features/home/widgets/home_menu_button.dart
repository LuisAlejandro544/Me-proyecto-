// Botón grande del menú principal: icono + título + subtítulo.
// Soporta estado bloqueado (candado) y deshabilitado.
import 'package:flutter/material.dart';

import 'package:me_proyecto/core/theme/app_theme.dart';

/// Botón principal del home (Continuar / Abrir / Opciones).
class HomeMenuButton extends StatelessWidget {
  /// Crea un botón del menú.
  const new({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.accent = AppColors.cyan,
    this.enabled = true,
    this.locked = false,
    this.trailing,
    super.key,
  });

  /// Icono principal.
  final IconData icon;

  /// Título grande.
  final String title;

  /// Descripción pequeña.
  final String subtitle;

  /// Acción al pulsar. Null = deshabilitado.
  final VoidCallback? onTap;

  /// Color de acento del borde e icono.
  final Color accent;

  /// Si es false se atenúa y no responde.
  final bool enabled;

  /// Si es true muestra candado y chip "Próximamente".
  final bool locked;

  /// Widget extra a la derecha (ej. estado del slot).
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final isActive = enabled && onTap != null;
    return Opacity(
      opacity: isActive ? 1 : 0.55,
      child: Material(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: isActive ? onTap : null,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: accent.withValues(alpha: 0.45)),
            ),
            child: Row(
              children: [
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: accent.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: accent.withValues(alpha: 0.5),
                    ),
                  ),
                  child: Icon(
                    locked ? Icons.lock_outline : icon,
                    color: accent,
                    size: 28,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              title,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 17,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          if (locked) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.white10,
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: AppColors.line,
                                ),
                              ),
                              child: const Text(
                                'Próximamente',
                                style: TextStyle(
                                  color: Colors.white54,
                                  fontSize: 10,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        subtitle,
                        style: const TextStyle(
                          color: Colors.white54,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
                if (trailing != null) ...[
                  const SizedBox(width: 12),
                  trailing!,
                ] else
                  Icon(
                    Icons.chevron_right,
                    color: isActive ? Colors.white38 : Colors.white12,
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

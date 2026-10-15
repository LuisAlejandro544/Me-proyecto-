// Tarjetas de nodo con estado de arrastre local.
// Mover un nodo repinta solo ese nodo; usa AppColors, cero hex.
import 'package:flutter/material.dart';

import 'package:me_proyecto/core/theme/app_theme.dart';
import 'package:me_proyecto/features/graph/models/vn_models.dart';

/// Tarjeta arrastrable de un nodo del canvas.
/// Sin estado propio: la posición la publica el controlador y las
/// conexiones siguen en vivo durante el arrastre.
class DraggableNode extends StatelessWidget {
  /// Crea la tarjeta con sus callbacks de gesto.
  const new({
    required this.node,
    required this.onMove,
    required this.onDragEnd,
    required this.onDelete,
    super.key,
  });

  /// Nodo a dibujar (contenido; la posición la publica el controlador).
  final VnNode node;

  /// Se llama en cada tick del arrastre; las aristas siguen en vivo.
  final void Function(double dx, double dy) onMove;

  /// Se llama al soltar el arrastre (repintado final de aristas).
  final VoidCallback onDragEnd;

  /// Se llama con long-press para borrar el nodo.
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final border = node.type == VnNodeType.start
        ? AppColors.ok
        : node.id == 'dlg_l'
        ? AppColors.danger
        : AppColors.cyan;
    return GestureDetector(
      onPanUpdate: (d) => onMove(d.delta.dx, d.delta.dy),
      onPanEnd: (_) => onDragEnd(),
      onLongPress: onDelete,
      child: Container(
        width: node.type == VnNodeType.start ? 110 : 190,
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: border, width: 1.4),
        ),
        child: _NodeBody(node: node),
      ),
    );
  }
}

// Cuerpo puro (Stateless): no guarda estado, se cachea por Flutter.
class _NodeBody extends StatelessWidget {
  const new({required this.node});
  final VnNode node;

  @override
  Widget build(BuildContext context) {
    const tWhite = TextStyle(
      color: Colors.white,
      fontWeight: FontWeight.bold,
      fontSize: 13,
    );
    const tBody = TextStyle(color: Colors.white, fontSize: 13);
    const tDim = TextStyle(color: Colors.white54, fontSize: 12);
    switch (node.type) {
      case VnNodeType.start:
        return const Center(
          child: Text(
            'Start',
            style: TextStyle(color: AppColors.ok, fontWeight: FontWeight.bold),
          ),
        );
      case VnNodeType.sprite:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(node.title, style: tWhite),
            const SizedBox(height: 8),
            Center(
              child: Container(
                width: 48,
                height: 48,
                decoration: const BoxDecoration(
                  color: AppColors.pink,
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: const Text(
                  'Y',
                  style: TextStyle(color: Colors.black, fontSize: 22),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(node.enterFrom, style: tDim),
            Text('Pose: ${node.pose}', style: tDim),
          ],
        );
      case VnNodeType.dialogue:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(node.title, style: tWhite),
            const SizedBox(height: 6),
            Text('${node.speaker}: "${node.text}"', style: tBody),
          ],
        );
      case VnNodeType.choice:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Choices', style: tWhite),
            const SizedBox(height: 6),
            for (final o in node.options)
              Container(
                margin: const EdgeInsets.only(bottom: 6),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                decoration: BoxDecoration(
                  color: o.isDanger ? AppColors.dangerChip : AppColors.cyanChip,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: o.isDanger ? AppColors.danger : AppColors.cyan,
                  ),
                ),
                child: Text(
                  o.label,
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                ),
              ),
          ],
        );
      case VnNodeType.sound:
        return const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Sound', style: tWhite),
            Text('bgm.mp3', style: tDim),
          ],
        );
    }
  }
}

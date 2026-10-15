// Tarjetas de nodo con estado de arrastre local.
// Mover un nodo repinta solo ese nodo; usa AppColors, cero hex.
import 'package:flutter/material.dart';

import 'package:me_proyecto/core/theme/app_theme.dart';
import 'package:me_proyecto/features/graph/models/vn_models.dart';

/// Tarjeta arrastrable de un nodo del canvas.
class DraggableNode extends StatefulWidget {
  /// Crea la tarjeta con sus callbacks de gesto.
  const new({
    required this.node,
    required this.onDragEnd,
    required this.onDelete,
    super.key,
  });

  /// Nodo a dibujar (contenido; la posición la publica el controlador).
  final VnNode node;

  /// Se llama UNA vez al soltar el arrastre con el delta total.
  final void Function(double dx, double dy) onDragEnd;

  /// Se llama con long-press para borrar el nodo.
  final VoidCallback onDelete;

  @override
  State<DraggableNode> createState() => _DraggableNodeState();
}

class _DraggableNodeState extends State<DraggableNode> {
  Offset drag = Offset.zero;

  @override
  Widget build(BuildContext context) {
    final node = widget.node;
    final border = node.type == VnNodeType.start
        ? AppColors.ok
        : node.id == 'dlg_l'
        ? AppColors.danger
        : AppColors.cyan;
    return GestureDetector(
      // Solo repinta ESTE nodo durante el arrastre; el resto y las
      // aristas se actualizan una vez al soltar (onPanEnd).
      onPanUpdate: (d) => setState(() => drag += d.delta),
      onPanEnd: (_) {
        final dx = drag.dx;
        final dy = drag.dy;
        setState(() => drag = Offset.zero);
        if (dx != 0 || dy != 0) widget.onDragEnd(dx, dy);
      },
      onLongPress: widget.onDelete,
      child: Transform.translate(
        offset: drag,
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

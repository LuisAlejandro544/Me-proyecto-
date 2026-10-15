// Pantalla Play Preview: recorre el grafo como novela visual jugable.
// Funciona igual en Android y PC (Linux/Windows/Web). Usa AppColors.
import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../models/vn_models.dart';

class PlayerScreen extends StatefulWidget {
  final VnProject project;
  const PlayerScreen({super.key, required this.project});

  @override
  State<PlayerScreen> createState() => _PlayerScreenState();
}

class _PlayerScreenState extends State<PlayerScreen> {
  String curId = 'start';

  VnNode get cur => widget.project.byId(curId);

  void _go(String next) => setState(() => curId = next);

  String _nextOf(String id) {
    final e = widget.project.edges.where((e) => e.fromId == id);
    if (e.isEmpty) return id;
    return e.first.toId;
  }

  @override
  Widget build(BuildContext context) {
    final n = cur;
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(title: Text('Play - ${widget.project.title}')),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 560),
          child: Card(
            color: AppColors.surface,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: const BorderSide(color: AppColors.cyan),
            ),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: _bodyFor(n),
            ),
          ),
        ),
      ),
    );
  }

  Widget _bodyFor(VnNode n) {
    switch (n.type) {
      case VnNodeType.choice:
        return Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Elige:',
              style: TextStyle(color: Colors.white, fontSize: 18),
            ),
            const SizedBox(height: 12),
            for (final o in n.options)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: o.isDanger
                        ? AppColors.danger
                        : AppColors.cyan,
                    foregroundColor: AppColors.bg,
                  ),
                  onPressed: () => _go(o.nextId),
                  child: Text(o.label),
                ),
              ),
          ],
        );
      case VnNodeType.dialogue:
        return Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Avatar placeholder estilo Yui sin assets con copyright.
            Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: const BoxDecoration(
                    color: AppColors.pink,
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: const Text('Y', style: TextStyle(color: Colors.black)),
                ),
                const SizedBox(width: 12),
                Text(
                  n.speaker,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              '"${n.text}"',
              style: const TextStyle(color: Colors.white, fontSize: 17),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => _go(_nextOf(n.id)),
              child: const Text('Siguiente'),
            ),
          ],
        );
      case VnNodeType.sprite:
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.person, size: 72, color: AppColors.pink),
            Text(
              'Sprite: ${n.speaker} (${n.pose})',
              style: const TextStyle(color: Colors.white),
            ),
            Text(n.enterFrom, style: const TextStyle(color: Colors.white54)),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () => _go(_nextOf(n.id)),
              child: const Text('Continuar'),
            ),
          ],
        );
      case VnNodeType.start:
      case VnNodeType.sound:
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              n.type == VnNodeType.start ? 'Inicio' : 'Sonido',
              style: const TextStyle(color: Colors.white, fontSize: 18),
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () => _go(_nextOf(n.id)),
              child: const Text('Comenzar'),
            ),
          ],
        );
    }
  }
}

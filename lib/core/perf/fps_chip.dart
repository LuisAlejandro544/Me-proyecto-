// Chip de rendimiento autocontenido: cuenta frames reales y se
// repinta solo 1 vez por segundo. Cuesta ~0 en el frame budget.
import 'package:flutter/material.dart';

class FpsChip extends StatefulWidget {
  final int Function() visibleOf;
  final int Function() totalOf;
  const FpsChip({super.key, required this.visibleOf, required this.totalOf});

  @override
  State<FpsChip> createState() => _FpsChipState();
}

class _FpsChipState extends State<FpsChip> {
  int fps = 0;
  int frames = 0;
  DateTime t0 = DateTime.now();

  @override
  void initState() {
    super.initState();
    _loop();
  }

  void _loop() {
    frames++;
    final now = DateTime.now();
    if (now.difference(t0).inMilliseconds >= 1000) {
      if (mounted) setState(() => fps = frames);
      frames = 0;
      t0 = now;
    }
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _loop();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Text(
      '$fps fps · ${widget.visibleOf()}/${widget.totalOf()} nodos',
      style: const TextStyle(color: Colors.white54, fontSize: 11),
    );
  }
}

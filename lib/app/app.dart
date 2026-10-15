// Raíz visual de la app: tema + menú principal.
// El main.dart solo hace bootstrap para probes y testing.
import 'package:flutter/material.dart';
import 'package:me_proyecto/core/theme/app_theme.dart';
import 'package:me_proyecto/features/home/home_screen.dart';

/// Widget raíz de Manga Maker / My Novel.
class MyNovelApp extends StatelessWidget {
  /// Crea la app con el tema oscuro corporativo.
  const new({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Manga Maker - My Novel',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      home: const HomeScreen(),
    );
  }
}

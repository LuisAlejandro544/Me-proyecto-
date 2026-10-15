// Raíz visual de la app: tema + pantalla del editor.
// El main.dart solo hace bootstrap para probes y testing.
import 'package:flutter/material.dart';

import '../core/theme/app_theme.dart';
import '../features/graph/editor/editor_screen.dart';

class MyNovelApp extends StatelessWidget {
  const MyNovelApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Manga Maker - My Novel',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      home: const EditorScreen(),
    );
  }
}

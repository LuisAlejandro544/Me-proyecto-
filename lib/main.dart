// Punto de entrada multiplataforma: Android, Linux, Windows y Web.
// Tema oscuro como la imagen de referencia, sin dependencias externas.
import 'package:flutter/material.dart';
import 'editor/editor_screen.dart';

void main() {
  runApp(const MyNovelApp());
}

class MyNovelApp extends StatelessWidget {
  const MyNovelApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Manga Maker - My Novel',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF0F172A),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF22D3EE),
          secondary: Color(0xFFF87171),
          surface: Color(0xFF1E293B),
        ),
      ),
      home: const EditorScreen(),
    );
  }
}

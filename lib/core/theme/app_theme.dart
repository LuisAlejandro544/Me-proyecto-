// Tokens de diseño y tema oscuro de la app.
// Un solo lugar para colores: la UI nunca usa hex literales.
import 'package:flutter/material.dart';

/// Paleta corporativa de Manga Maker / My Novel.
abstract final class AppColors {
  /// Fondo del canvas y pantallas.
  static const bg = Color(0xFF0F172A);

  /// Superficie de tarjetas y barras.
  static const surface = Color(0xFF1E293B);

  /// Bordes sutiles de contenedores.
  static const line = Color(0xFF334155);

  /// Acento principal (aristas y botones normales).
  static const cyan = Color(0xFF22D3EE);

  /// Fondo translúcido para botones activos.
  static const cyanSoft = Color(0x2222D3EE);

  /// Fondo translúcido para opciones normales.
  static const cyanChip = Color(0x3322D3EE);

  /// Acento de peligro (rama "reírse" y sus aristas).
  static const danger = Color(0xFFF87171);

  /// Fondo translúcido para opciones peligrosas.
  static const dangerChip = Color(0x55F87171);

  /// Verde del nodo Start.
  static const ok = Color(0xFF4ADE80);

  /// Amarillo de acciones especiales (estrés, demo).
  static const warn = Color(0xFFFACC15);

  /// Rosa del avatar placeholder de Yui.
  static const pink = Color(0xFFF9A8D4);
}

/// Construye el [ThemeData] oscuro a partir de [AppColors].
ThemeData buildAppTheme() {
  return ThemeData.dark().copyWith(
    scaffoldBackgroundColor: AppColors.bg,
    colorScheme: const ColorScheme.dark(
      primary: AppColors.cyan,
      secondary: AppColors.danger,
      surface: AppColors.surface,
    ),
    appBarTheme: const AppBarTheme(backgroundColor: AppColors.bg),
  );
}

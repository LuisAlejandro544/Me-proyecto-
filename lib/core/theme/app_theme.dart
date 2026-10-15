// Tokens de diseño y tema oscuro de la app.
// Un solo lugar para colores: la UI nunca usa hex literales.
import 'package:flutter/material.dart';

abstract final class AppColors {
  static const bg = Color(0xFF0F172A);
  static const surface = Color(0xFF1E293B);
  static const line = Color(0xFF334155);
  static const cyan = Color(0xFF22D3EE);
  static const cyanSoft = Color(0x2222D3EE);
  static const cyanChip = Color(0x3322D3EE);
  static const danger = Color(0xFFF87171);
  static const dangerChip = Color(0x55F87171);
  static const ok = Color(0xFF4ADE80);
  static const warn = Color(0xFFFACC15);
  static const pink = Color(0xFFF9A8D4);
}

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

// ── grove_theme.dart — Grove design tokens ported to Flutter ─────────
// Hex values come from css/grove/tokens/colors.css (the oklch comments);
// dark-theme values without hex references are close approximations.
import 'package:flutter/material.dart';

class GroveColors extends ThemeExtension<GroveColors> {
  final Color paper, paperSunk, surface, surface2;
  final Color ink, ink2, ink3, inkInverse;
  final Color line, line2;
  final Color sage, sageDeep, sageSoft;
  final Color clay, clayDeep, claySoft;
  final Color lavender, lavenderDeep, lavenderSoft;
  final Color sky, skyDeep, skySoft;
  final Color honey, honeyDeep, honeySoft;
  final Color rose, roseDeep, roseSoft;
  final List<Color> mood; // index 0..4 → mood score 1..5

  const GroveColors({
    required this.paper,
    required this.paperSunk,
    required this.surface,
    required this.surface2,
    required this.ink,
    required this.ink2,
    required this.ink3,
    required this.inkInverse,
    required this.line,
    required this.line2,
    required this.sage,
    required this.sageDeep,
    required this.sageSoft,
    required this.clay,
    required this.clayDeep,
    required this.claySoft,
    required this.lavender,
    required this.lavenderDeep,
    required this.lavenderSoft,
    required this.sky,
    required this.skyDeep,
    required this.skySoft,
    required this.honey,
    required this.honeyDeep,
    required this.honeySoft,
    required this.rose,
    required this.roseDeep,
    required this.roseSoft,
    required this.mood,
  });

  static const light = GroveColors(
    paper: Color(0xFFFAF8F3),
    paperSunk: Color(0xFFF0ECE3),
    surface: Color(0xFFFFFFFF),
    surface2: Color(0xFFF6F2EA),
    ink: Color(0xFF34302A),
    ink2: Color(0xFF6C665C),
    ink3: Color(0xFF9A948A),
    inkInverse: Color(0xFFFAF8F3),
    line: Color(0xFFE7E1D8),
    line2: Color(0xFFD2CABD),
    sage: Color(0xFF729A7C),
    sageDeep: Color(0xFF54755D),
    sageSoft: Color(0xFFE7F0E7),
    clay: Color(0xFFC4886A),
    clayDeep: Color(0xFF9C6044),
    claySoft: Color(0xFFF6EBE1),
    lavender: Color(0xFF9892BD),
    lavenderDeep: Color(0xFF6F679A),
    lavenderSoft: Color(0xFFECE9F3),
    sky: Color(0xFF7F9BC0),
    skyDeep: Color(0xFF56759C),
    skySoft: Color(0xFFE6EDF4),
    honey: Color(0xFFD6A85F),
    honeyDeep: Color(0xFF9C7536),
    honeySoft: Color(0xFFF7EEDB),
    rose: Color(0xFFBF6A5A),
    roseDeep: Color(0xFF9B4D3F),
    roseSoft: Color(0xFFF6E8E4),
    mood: [
      Color(0xFF7B96C4), // 1 heavy — muted blue
      Color(0xFF9892BD), // 2 low — lavender
      Color(0xFFB3AA97), // 3 neutral — soft taupe
      Color(0xFF97BA79), // 4 good — fresh green
      Color(0xFFD3B25E), // 5 bright — warm honey
    ],
  );

  static const dark = GroveColors(
    paper: Color(0xFF2A2723),
    paperSunk: Color(0xFF211E1B),
    surface: Color(0xFF332F2A),
    surface2: Color(0xFF3C372F),
    ink: Color(0xFFECE6DB),
    ink2: Color(0xFFAAA298),
    ink3: Color(0xFF7C756B),
    inkInverse: Color(0xFF2A2723),
    line: Color(0xFF453F37),
    line2: Color(0xFF5A5347),
    sage: Color(0xFF8FB897),
    sageDeep: Color(0xFFB2D4B8),
    sageSoft: Color(0xFF35443A),
    clay: Color(0xFFD19B78),
    clayDeep: Color(0xFFE0B091),
    claySoft: Color(0xFF46362C),
    lavender: Color(0xFFABA5D0),
    lavenderDeep: Color(0xFFC2BCE0),
    lavenderSoft: Color(0xFF3B3748),
    sky: Color(0xFF92B1D6),
    skyDeep: Color(0xFFABC4E2),
    skySoft: Color(0xFF333E4A),
    honey: Color(0xFFDDB878),
    honeyDeep: Color(0xFFE7C68E),
    honeySoft: Color(0xFF4A3E2B),
    rose: Color(0xFFD08A79),
    roseDeep: Color(0xFFDFA695),
    roseSoft: Color(0xFF483230),
    mood: [
      Color(0xFF8FA9D4),
      Color(0xFFABA5D0),
      Color(0xFFB5AC9C),
      Color(0xFFA3C287),
      Color(0xFFD9C077),
    ],
  );

  @override
  GroveColors copyWith() => this;

  @override
  GroveColors lerp(ThemeExtension<GroveColors>? other, double t) =>
      t < 0.5 ? this : (other is GroveColors ? other : this);
}

/// Shorthand: `gc(context).sage`
GroveColors gc(BuildContext context) =>
    Theme.of(context).extension<GroveColors>()!;

ThemeData groveTheme(GroveColors g, Brightness brightness) {
  final base = ColorScheme.fromSeed(seedColor: g.sage, brightness: brightness);
  return ThemeData(
    useMaterial3: true,
    brightness: brightness,
    scaffoldBackgroundColor: g.paper,
    colorScheme: base.copyWith(
      primary: g.sage,
      secondary: g.clay,
      surface: g.surface,
      error: g.roseDeep,
    ),
    extensions: [g],
    dividerColor: g.line,
    splashFactory: InkRipple.splashFactory,
    textTheme: Typography.blackMountainView.apply(
      bodyColor: g.ink,
      displayColor: g.ink,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: g.surface2,
      contentPadding:
          const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: g.line),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: g.line),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: g.sage, width: 1.6),
      ),
      hintStyle: TextStyle(color: g.ink3),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: g.surface,
      indicatorColor: g.sageSoft,
      surfaceTintColor: Colors.transparent,
      labelTextStyle: WidgetStatePropertyAll(
        TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: g.ink2),
      ),
      iconTheme: WidgetStateProperty.resolveWith(
        (states) => IconThemeData(
          color: states.contains(WidgetState.selected) ? g.sageDeep : g.ink3,
          size: 24,
        ),
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: g.ink,
      contentTextStyle: TextStyle(color: g.inkInverse, fontSize: 14),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ),
    timePickerTheme: TimePickerThemeData(backgroundColor: g.surface),
    dialogTheme: DialogThemeData(
      backgroundColor: g.surface,
      surfaceTintColor: Colors.transparent,
    ),
    bottomSheetTheme: BottomSheetThemeData(
      backgroundColor: g.surface,
      surfaceTintColor: Colors.transparent,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
    ),
  );
}

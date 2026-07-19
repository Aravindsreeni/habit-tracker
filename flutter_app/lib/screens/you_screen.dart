// ── you_screen.dart — You destination: Stats · Settings ──────────────
import 'package:flutter/material.dart';

import '../core/i18n.dart';
import '../widgets/grove.dart';
import 'settings_view.dart';
import 'stats_view.dart';

class YouScreen extends StatefulWidget {
  const YouScreen({super.key});

  @override
  State<YouScreen> createState() => _YouScreenState();
}

class _YouScreenState extends State<YouScreen> {
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
        children: [
          ScreenHeader(eyebrow: t('you.title'), title: t('you.subtitle')),
          const SizedBox(height: 16),
          GroveSeg(
            options: [t('you.tab_stats'), t('you.tab_settings')],
            value: _tab,
            onChanged: (i) => setState(() => _tab = i),
          ),
          const SizedBox(height: 18),
          // Non-const on purpose: sub-views must rebuild on store changes.
          if (_tab == 0) StatsView() else SettingsView(),
        ],
      ),
    );
  }
}

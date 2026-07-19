// ── reflect_screen.dart — Reflect destination wrapper ────────────────
// Sub-views: Mood · Journal · Thoughts (CBT) · Inbox.
import 'package:flutter/material.dart';

import '../core/i18n.dart';
import '../widgets/grove.dart';
import 'cbt_view.dart';
import 'inbox_view.dart';
import 'journal_view.dart';
import 'mood_view.dart';

class ReflectScreen extends StatefulWidget {
  const ReflectScreen({super.key});

  @override
  State<ReflectScreen> createState() => _ReflectScreenState();
}

class _ReflectScreenState extends State<ReflectScreen> {
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
        children: [
          ScreenHeader(
            eyebrow: t('reflect.title'),
            title: t('reflect.subtitle'),
          ),
          const SizedBox(height: 16),
          GroveSeg(
            options: [
              t('reflect.tab_mood'),
              t('reflect.tab_journal'),
              t('reflect.tab_thoughts'),
              t('reflect.tab_inbox'),
            ],
            value: _tab,
            onChanged: (i) => setState(() => _tab = i),
          ),
          const SizedBox(height: 18),
          // Non-const on purpose: sub-views must rebuild on store changes.
          switch (_tab) {
            1 => JournalView(),
            2 => CbtView(),
            3 => InboxView(),
            _ => MoodView(),
          },
        ],
      ),
    );
  }
}

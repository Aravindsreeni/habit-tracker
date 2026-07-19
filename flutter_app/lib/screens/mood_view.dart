// ── mood_view.dart — daily mood check-in (port of views/mood.js) ─────
import 'package:flutter/material.dart';

import '../core/i18n.dart';
import '../core/store.dart';
import '../theme/grove_theme.dart';
import '../widgets/grove.dart';

const _emoji = ['😞', '😕', '😐', '🙂', '😄'];
const _trendDays = 14;

class MoodView extends StatefulWidget {
  const MoodView({super.key});

  @override
  State<MoodView> createState() => _MoodViewState();
}

class _MoodViewState extends State<MoodView> {
  late final TextEditingController _noteCtl;

  @override
  void initState() {
    super.initState();
    final today = store.mood(ymd(DateTime.now()));
    _noteCtl = TextEditingController(text: today?['note'] as String? ?? '');
  }

  @override
  void dispose() {
    _noteCtl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final g = gc(context);
    final day = ymd(DateTime.now());
    final entry = store.mood(day);
    final score = entry?['score'] is num ? (entry!['score'] as num).toInt() : 0;

    final header = score >= 1 && score <= 5
        ? t('mood.header_scored', {'label': t('mood.label_$score')})
        : t('mood.header_base');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Eyebrow(header),
        const SizedBox(height: 10),
        Text(t('mood.intro'), style: TextStyle(color: g.ink2, fontSize: 13.5)),
        const SizedBox(height: 14),
        GroveCard(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              for (var i = 1; i <= 5; i++)
                _moodBtn(g, i, selected: score == i, onTap: () {
                  store.saveMood(day, i, _noteCtl.text);
                }),
            ],
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _noteCtl,
          minLines: 2,
          maxLines: 4,
          decoration: InputDecoration(hintText: t('mood.note_ph')),
          onChanged: (v) {
            if (score > 0) store.saveMood(day, score, v);
          },
        ),
        const SizedBox(height: 22),
        _trend(g),
        const SizedBox(height: 22),
        _disclaimer(g),
      ],
    );
  }

  Widget _moodBtn(GroveColors g, int score,
      {required bool selected, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? g.sageSoft : Colors.transparent,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: selected ? g.sage : Colors.transparent),
        ),
        child: Column(
          children: [
            Text(_emoji[score - 1], style: const TextStyle(fontSize: 26)),
            const SizedBox(height: 4),
            Text(
              t('mood.label_$score'),
              style: TextStyle(
                fontSize: 11,
                fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                color: selected ? g.sageDeep : g.ink3,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _trend(GroveColors g) {
    final now = DateTime.now();
    final scores = <int?>[];
    for (var i = _trendDays - 1; i >= 0; i--) {
      final e = store.mood(ymd(now.subtract(Duration(days: i))));
      final s = e?['score'];
      scores.add(s is num && s >= 1 && s <= 5 ? s.toInt() : null);
    }
    final logged = scores.whereType<int>().toList();
    final avg = logged.isEmpty
        ? 0.0
        : logged.reduce((a, b) => a + b) / logged.length;

    final String message;
    if (logged.isEmpty) {
      message = t('mood.trend_none');
    } else if (avg <= 2.4) {
      message = t('mood.trend_low');
    } else if (avg >= 3.6) {
      message = t('mood.trend_high');
    } else {
      message = t('mood.trend_mid');
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Eyebrow(
          t('mood.trend_header', {'n': _trendDays}),
          trailing: logged.isEmpty
              ? null
              : Text(
                  '${avg.toStringAsFixed(1)} ${t('mood.trend_avg_suffix')}',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: g.ink3,
                  ),
                ),
        ),
        const SizedBox(height: 10),
        GroveCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                height: 64,
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    for (final s in scores)
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 2),
                          child: Container(
                            height: s == null ? 4 : 10.0 + s * 10,
                            decoration: BoxDecoration(
                              color: s == null
                                  ? g.paperSunk
                                  : g.mood[s - 1],
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              Text(
                t('mood.trend_logged',
                    {'logged': logged.length, 'total': _trendDays}),
                style: TextStyle(fontSize: 12, color: g.ink3),
              ),
              const SizedBox(height: 6),
              Text(message,
                  style: TextStyle(fontSize: 13, color: g.ink2, height: 1.4)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _disclaimer(GroveColors g) => GroveCard(
        child: Text(
          t('mood.disclaimer'),
          style: TextStyle(fontSize: 11.5, color: g.ink3, height: 1.5),
        ),
      );
}

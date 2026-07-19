// ── stats_view.dart — streaks, consistency, heatmap ──────────────────
// Port of views/stats.js (areas grouping arrives in a later build).
import 'package:flutter/material.dart';

import '../core/i18n.dart';
import '../core/store.dart';
import '../theme/grove_theme.dart';
import '../widgets/grove.dart';

const _heatmapWeeks = 26;

class StatsView extends StatefulWidget {
  const StatsView({super.key});

  @override
  State<StatsView> createState() => _StatsViewState();
}

class _StatsViewState extends State<StatsView> {
  int _windowDays = 30;

  @override
  Widget build(BuildContext context) {
    final g = gc(context);
    final daily = store.habitsOf('daily');
    if (daily.isEmpty) return EmptyState(t('stats.empty'));

    final sets = store.completedDaySets();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Eyebrow(t('stats.section_streaks')),
        const SizedBox(height: 10),
        for (final h in daily) ...[
          _streakCard(g, (h as Map).cast<String, dynamic>(), sets),
          const SizedBox(height: 8),
        ],
        const SizedBox(height: 16),
        Eyebrow(
          t('stats.section_consistency'),
          trailing: SizedBox(
            width: 150,
            child: GroveSeg(
              options: [t('stats.window_30'), t('stats.window_90')],
              value: _windowDays == 30 ? 0 : 1,
              onChanged: (i) =>
                  setState(() => _windowDays = i == 0 ? 30 : 90),
            ),
          ),
        ),
        const SizedBox(height: 10),
        GroveCard(
          child: Column(
            children: [
              for (final h in daily)
                _rateRow(g, (h as Map).cast<String, dynamic>(), sets),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Eyebrow(
          t('stats.section_heatmap'),
          trailing: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(t('stats.legend_less'),
                  style: TextStyle(fontSize: 11, color: g.ink3)),
              const SizedBox(width: 4),
              _legendCell(g.paperSunk),
              _legendCell(g.sageSoft),
              _legendCell(g.sage),
              const SizedBox(width: 4),
              Text(t('stats.legend_more'),
                  style: TextStyle(fontSize: 11, color: g.ink3)),
            ],
          ),
        ),
        const SizedBox(height: 10),
        _heatmap(g, daily, sets),
      ],
    );
  }

  Widget _legendCell(Color c) => Container(
        width: 10,
        height: 10,
        margin: const EdgeInsets.symmetric(horizontal: 1.5),
        decoration:
            BoxDecoration(color: c, borderRadius: BorderRadius.circular(2)),
      );

  Widget _streakCard(
      GroveColors g, Map<String, dynamic> h, Map<String, Set<String>> sets) {
    final days = sets[h['id']] ?? <String>{};
    final s = store.streakOf(days);
    final String msg;
    if (s.current == 0 && s.best > 0) {
      msg = t('stats.msg_begin', {'n': s.best});
    } else if (s.current == 0) {
      msg = t('stats.msg_first');
    } else if (s.current >= s.best && s.current >= 3) {
      msg = t('stats.msg_best');
    } else if (s.current <= 2) {
      msg = t('stats.msg_start');
    } else {
      msg = t('stats.msg_keep');
    }
    return GroveCard(
      child: Row(
        children: [
          Text(
            s.current > 0 ? t('stats.fire_icon_on') : t('stats.fire_icon_off'),
            style: const TextStyle(fontSize: 24),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(h['label'] as String? ?? '',
                    style: TextStyle(
                      fontSize: 14.5,
                      fontWeight: FontWeight.w600,
                      color: g.ink,
                    )),
                const SizedBox(height: 2),
                Text(msg, style: TextStyle(fontSize: 12, color: g.ink3)),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${s.current} ${plural(s.current, t('common.day_one'), t('common.day_other'))}',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: g.ink,
                ),
              ),
              Text(t('stats.best', {'n': s.best}),
                  style: TextStyle(fontSize: 11.5, color: g.ink3)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _rateRow(
      GroveColors g, Map<String, dynamic> h, Map<String, Set<String>> sets) {
    final days = sets[h['id']] ?? <String>{};
    final now = DateTime.now();
    var done = 0;
    for (var i = 0; i < _windowDays; i++) {
      if (days.contains(ymd(now.subtract(Duration(days: i))))) done++;
    }
    final pct = (done / _windowDays * 100).round();
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(h['label'] as String? ?? '',
                  style: TextStyle(fontSize: 13, color: g.ink2)),
              Text('$pct%',
                  style: TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                    color: g.ink2,
                  )),
            ],
          ),
          const SizedBox(height: 5),
          GroveProgressBar(fraction: done / _windowDays),
        ],
      ),
    );
  }

  Widget _heatmap(
      GroveColors g, List<dynamic> daily, Map<String, Set<String>> sets) {
    // One overall grid: cell tone = fraction of daily habits done that day.
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    // Start on the Monday _heatmapWeeks ago.
    final start = today.subtract(
        Duration(days: (_heatmapWeeks - 1) * 7 + today.weekday - 1));
    final total = daily.length;

    final columns = <Widget>[];
    for (var wk = 0; wk < _heatmapWeeks; wk++) {
      final cells = <Widget>[];
      for (var wd = 0; wd < 7; wd++) {
        final day = start.add(Duration(days: wk * 7 + wd));
        if (day.isAfter(today)) {
          cells.add(const SizedBox(width: 12, height: 12));
          continue;
        }
        final key = ymd(day);
        var done = 0;
        for (final h in daily) {
          if ((sets[h['id']] ?? const <String>{}).contains(key)) done++;
        }
        final frac = total > 0 ? done / total : 0.0;
        final Color c;
        if (frac >= 1) {
          c = g.sage;
        } else if (frac >= 0.5) {
          c = g.sageSoft;
        } else if (frac > 0) {
          c = g.honeySoft;
        } else {
          c = g.paperSunk;
        }
        cells.add(Container(
          width: 12,
          height: 12,
          margin: const EdgeInsets.all(1),
          decoration:
              BoxDecoration(color: c, borderRadius: BorderRadius.circular(3)),
        ));
      }
      columns.add(Column(mainAxisSize: MainAxisSize.min, children: cells));
    }

    return GroveCard(
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        reverse: true,
        child: Row(children: columns),
      ),
    );
  }
}

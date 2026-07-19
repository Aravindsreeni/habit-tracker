// ── habits_screen.dart — Habits destination (port of views/habits.js) ─
// All five horizons: Daily · Weekly · Monthly · Quarterly · Yearly.
import 'package:flutter/material.dart';

import '../core/i18n.dart';
import '../core/store.dart';
import '../theme/grove_theme.dart';
import '../widgets/grove.dart';

class HabitsScreen extends StatefulWidget {
  const HabitsScreen({super.key});

  @override
  State<HabitsScreen> createState() => _HabitsScreenState();
}

class _HabitsScreenState extends State<HabitsScreen> {
  int _hz = 0;

  String get _horizon => horizons[_hz];

  String get _unit => t('habits.unit_$_horizon');

  @override
  Widget build(BuildContext context) {
    store.rollover();
    final g = gc(context);
    final list = store.habitsOf(_horizon);
    final done = list.where((h) => _isDone(_m(h))).length;

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
        children: [
          ScreenHeader(eyebrow: t('habits.title'), title: t('habits.subtitle')),
          const SizedBox(height: 16),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                for (var i = 0; i < horizons.length; i++)
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(t('habits.tab_${horizons[i]}')),
                      selected: _hz == i,
                      selectedColor: g.sageSoft,
                      onSelected: (_) => setState(() => _hz = i),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Eyebrow(
            t('habits.tab_$_horizon'),
            trailing: list.isEmpty
                ? null
                : Text(
                    t('habits.summary', {'done': done, 'total': list.length}),
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: g.ink3,
                    ),
                  ),
          ),
          const SizedBox(height: 10),
          if (list.isEmpty)
            EmptyState(t('habits.no_habits', {
              'horizon': t('habits.tab_$_horizon').toLowerCase(),
            })),
          for (final h in list) ...[
            _habitCard(g, _m(h)),
            const SizedBox(height: 8),
          ],
          const SizedBox(height: 8),
          GroveButton(
            _hz >= 3 ? t('habits.add_goal') : t('habits.add_habit'),
            subtle: true,
            onTap: _openAddSheet,
          ),
        ],
      ),
    );
  }

  Map<String, dynamic> _m(dynamic v) => (v as Map).cast<String, dynamic>();

  bool _isDone(Map<String, dynamic> h) {
    if (_horizon == 'daily') return store.isDailyDone(h);
    final target = h['target'] is num ? (h['target'] as num).toInt() : 1;
    return store.countOf(_horizon, h['id'] as String) >= target;
  }

  Widget _habitCard(GroveColors g, Map<String, dynamic> h) {
    final id = h['id'] as String;
    final done = _isDone(h);

    if (_horizon == 'daily') {
      final isWater = h['type'] == 'w';
      final max = h['max'] is num ? (h['max'] as num).toInt() : 8;
      final n = store.countOf('daily', id);
      return GroveCard(
        done: done,
        onTap: isWater ? null : () => store.toggleDaily(id),
        onLongPress: () => _confirmDelete(id),
        child: Row(
          children: [
            if (!isWater) ...[
              RoundCheck(on: done, onTap: () => store.toggleDaily(id)),
              const SizedBox(width: 12),
            ],
            Expanded(
              child: Text(
                h['label'] as String? ?? '',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: done ? g.sageDeep : g.ink,
                ),
              ),
            ),
            if (isWater) ...[
              StepBtn(Icons.remove,
                  onTap: () => store.bump('daily', id, -1, maxValue: max)),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: Text('$n/$max',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: done ? g.sageDeep : g.ink2,
                    )),
              ),
              StepBtn(Icons.add,
                  onTap: () => store.bump('daily', id, 1, maxValue: max)),
            ],
            _deleteBtn(g, id),
          ],
        ),
      );
    }

    final target = h['target'] is num ? (h['target'] as num).toInt() : 1;
    final n = store.countOf(_horizon, id);
    final remaining = target - n;
    final link = h['link'];
    final caption = done
        ? t('habits.cap_done', {'unit': _unit})
        : t('habits.cap_remaining', {'remaining': remaining, 'unit': _unit});

    return GroveCard(
      done: done,
      onLongPress: () => _confirmDelete(id),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  h['label'] as String? ?? '',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: done ? g.sageDeep : g.ink,
                  ),
                ),
              ),
              StepBtn(Icons.remove, onTap: () => store.bump(_horizon, id, -1)),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: Text('$n/$target',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: done ? g.sageDeep : g.ink2,
                    )),
              ),
              StepBtn(Icons.add, onTap: () => store.bump(_horizon, id, 1)),
              _deleteBtn(g, id),
            ],
          ),
          const SizedBox(height: 10),
          GroveProgressBar(
            fraction: target > 0 ? n / target : 0,
            honey: !done,
          ),
          const SizedBox(height: 7),
          Text(caption,
              style: TextStyle(
                fontSize: 12.5,
                color: done ? g.sageDeep : g.ink2,
              )),
          if (link is Map)
            Padding(
              padding: const EdgeInsets.only(top: 3),
              child: Text(
                t('habits.link_fed', {
                  'label': _linkedLabel(link.cast<String, dynamic>()),
                }),
                style: TextStyle(fontSize: 11.5, color: g.skyDeep),
              ),
            ),
        ],
      ),
    );
  }

  String _linkedLabel(Map<String, dynamic> link) {
    final period = link['period'] as String? ?? '';
    for (final h in (store.habits[period] is List
        ? store.habits[period] as List
        : const [])) {
      if (h['id'] == link['habitId']) return h['label'] as String? ?? '';
    }
    return '';
  }

  Widget _deleteBtn(GroveColors g, String id) => IconButton(
        visualDensity: VisualDensity.compact,
        tooltip: t('common.remove'),
        icon: Icon(Icons.close, size: 17, color: g.ink3),
        onPressed: () => _confirmDelete(id),
      );

  void _confirmDelete(String id) {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        content: Text(t('common.delete_confirm')),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(t('common.cancel')),
          ),
          TextButton(
            onPressed: () {
              store.deleteHabit(_horizon, id);
              Navigator.pop(ctx);
            },
            child: Text(t('common.remove')),
          ),
        ],
      ),
    );
  }

  void _openAddSheet() {
    final nameCtl = TextEditingController();
    final numCtl = TextEditingController(
      text: switch (_horizon) {
        'daily' => '8',
        'weekly' => '3',
        'monthly' => '7',
        _ => '1',
      },
    );
    var type = 'c'; // daily only: checkbox vs counter
    final horizon = _horizon;
    final targetLabel = switch (horizon) {
      'weekly' => t('habits.target_week'),
      'monthly' => t('habits.target_month'),
      'quarterly' => t('habits.target_quarter'),
      'yearly' => t('habits.target_year'),
      _ => t('habits.max_label'),
    };

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) {
        final g = gc(ctx);
        return StatefulBuilder(
          builder: (ctx, setSheet) => Padding(
            padding: EdgeInsets.fromLTRB(
                20, 20, 20, 20 + MediaQuery.of(ctx).viewInsets.bottom),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Eyebrow(t('habits.tab_$horizon')),
                const SizedBox(height: 12),
                TextField(
                  controller: nameCtl,
                  autofocus: true,
                  decoration: InputDecoration(
                    hintText: horizon == 'quarterly' || horizon == 'yearly'
                        ? t('habits.goal_name')
                        : t('habits.habit_name'),
                  ),
                ),
                const SizedBox(height: 12),
                if (horizon == 'daily')
                  Wrap(
                    spacing: 8,
                    children: [
                      ChoiceChip(
                        label: Text(t('habits.type_checkbox')),
                        selected: type == 'c',
                        selectedColor: g.sageSoft,
                        onSelected: (_) => setSheet(() => type = 'c'),
                      ),
                      ChoiceChip(
                        label: Text(t('habits.type_counter')),
                        selected: type == 'w',
                        selectedColor: g.sageSoft,
                        onSelected: (_) => setSheet(() => type = 'w'),
                      ),
                    ],
                  ),
                if (horizon != 'daily' || type == 'w') ...[
                  const SizedBox(height: 12),
                  TextField(
                    controller: numCtl,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(labelText: targetLabel),
                  ),
                ],
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    GroveButton(t('common.cancel'), subtle: true,
                        onTap: () => Navigator.pop(ctx)),
                    const SizedBox(width: 8),
                    GroveButton(t('common.add'), onTap: () {
                      final name = nameCtl.text.trim();
                      if (name.isEmpty) return;
                      final id = 'h${DateTime.now().millisecondsSinceEpoch}';
                      final num0 = int.tryParse(numCtl.text.trim());
                      if (horizon == 'daily') {
                        store.addHabit('daily', {
                          'id': id,
                          'label': name,
                          'type': type,
                          if (type == 'w') 'max': num0 ?? 8,
                        });
                      } else {
                        store.addHabit(horizon, {
                          'id': id,
                          'label': name,
                          'target': num0 ?? 1,
                        });
                      }
                      Navigator.pop(ctx);
                    }),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

// ── today_screen.dart — Today destination (port of views/today.js) ───
// Hero ring · daily habits · routine blocks · quick wins.
import 'package:flutter/material.dart';

import '../core/i18n.dart';
import '../core/store.dart';
import '../theme/grove_theme.dart';
import '../widgets/grove.dart';
import '../widgets/progress_ring.dart';

const _weekdays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const _months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

class TodayScreen extends StatefulWidget {
  const TodayScreen({super.key});

  @override
  State<TodayScreen> createState() => _TodayScreenState();
}

class _TodayScreenState extends State<TodayScreen> {
  final _habitCtl = TextEditingController();
  final _blockCtl = TextEditingController();
  String _winsFilter = 'all';
  TimeOfDay _blockStart = const TimeOfDay(hour: 10, minute: 0);
  TimeOfDay _blockEnd = const TimeOfDay(hour: 10, minute: 30);

  @override
  void dispose() {
    _habitCtl.dispose();
    _blockCtl.dispose();
    super.dispose();
  }

  String _greetingKey() {
    final h = DateTime.now().hour;
    if (h < 12) return 'today.greeting_morning';
    if (h < 17) return 'today.greeting_afternoon';
    return 'today.greeting_evening';
  }

  @override
  Widget build(BuildContext context) {
    store.rollover();
    final g = gc(context);
    final daily = store.habitsOf('daily');
    final done = daily.where((h) => store.isDailyDone(_m(h))).length;
    final total = daily.length;
    final now = DateTime.now();
    final dateLine =
        '${_weekdays[now.weekday - 1]}, ${now.day} ${_months[now.month - 1].toUpperCase()}';

    final String affirmation;
    if (total > 0 && done == total) {
      affirmation = t('today.affirm_all_done');
    } else if (done == 0) {
      affirmation = t('today.affirm_none');
    } else {
      affirmation = t('today.affirm_progress');
    }

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
        children: [
          Eyebrow(dateLine),
          const SizedBox(height: 8),
          Text(
            '${t(_greetingKey())}.',
            style: TextStyle(
              fontFamily: 'serif',
              fontSize: 32,
              height: 1.1,
              fontWeight: FontWeight.w500,
              color: g.ink,
            ),
          ),
          const SizedBox(height: 6),
          Text(affirmation, style: TextStyle(color: g.ink2, fontSize: 14.5)),
          const SizedBox(height: 20),
          _hero(g, done, total),
          const SizedBox(height: 26),
          _habitsSection(g, daily, done, total),
          const SizedBox(height: 26),
          _routineSection(g),
          const SizedBox(height: 26),
          _winsSection(g),
        ],
      ),
    );
  }

  Map<String, dynamic> _m(dynamic v) => (v as Map).cast<String, dynamic>();

  // ── Hero ring ──────────────────────────────────────────────────────
  Widget _hero(GroveColors g, int done, int total) {
    final waiting = total - done;
    final summary = '${t('today.habits_tended', {
          'done': done,
          'total': total,
        })} ${waiting > 0 ? t('today.habits_waiting', {
            'n': waiting,
          }) : t('today.all_done')}';
    return GroveCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          ProgressRing(
            fraction: total > 0 ? done / total : 0,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '$done',
                  style: TextStyle(
                    fontSize: 34,
                    fontWeight: FontWeight.w700,
                    height: 1.0,
                    color: g.ink,
                  ),
                ),
                Text(
                  '${t('today.ring_of').toUpperCase()} $total',
                  style: TextStyle(
                    fontSize: 11,
                    letterSpacing: 1.2,
                    fontWeight: FontWeight.w600,
                    color: g.ink3,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Text(
            summary,
            textAlign: TextAlign.center,
            style: TextStyle(color: g.ink2, fontSize: 13.5),
          ),
        ],
      ),
    );
  }

  // ── Daily habits ───────────────────────────────────────────────────
  Widget _habitsSection(GroveColors g, List<dynamic> daily, int done, int total) {
    final sets = daily.isEmpty ? null : store.completedDaySets();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Eyebrow(
          t('today.section_habits'),
          trailing: Text(
            '$done/$total',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: g.ink3,
            ),
          ),
        ),
        const SizedBox(height: 10),
        if (daily.isEmpty) EmptyState(t('today.no_habits')),
        for (final h in daily) ...[
          _habitCard(g, _m(h), sets),
          const SizedBox(height: 8),
        ],
        const SizedBox(height: 4),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _habitCtl,
                decoration: InputDecoration(hintText: t('today.quickadd_ph')),
                onSubmitted: (_) => _addHabit(),
              ),
            ),
            const SizedBox(width: 8),
            GroveButton(t('common.add'), onTap: _addHabit),
          ],
        ),
      ],
    );
  }

  void _addHabit() {
    final name = _habitCtl.text.trim();
    if (name.isEmpty) return;
    store.addHabit('daily', {
      'id': 'h${DateTime.now().millisecondsSinceEpoch}',
      'label': name,
      'type': 'c',
    });
    _habitCtl.clear();
  }

  Widget _habitCard(GroveColors g, Map<String, dynamic> h, Map<String, Set<String>>? sets) {
    final id = h['id'] as String;
    final isWater = h['type'] == 'w';
    final done = store.isDailyDone(h);
    final streak = sets != null ? store.streakOf(sets[id] ?? {}).current : 0;

    return GroveCard(
      done: done,
      onTap: isWater ? null : () => store.toggleDaily(id),
      child: Row(
        children: [
          if (!isWater) ...[
            RoundCheck(on: done, onTap: () => store.toggleDaily(id)),
            const SizedBox(width: 12),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  h['label'] as String? ?? '',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: done ? g.sageDeep : g.ink,
                  ),
                ),
                if (streak >= 2)
                  Padding(
                    padding: const EdgeInsets.only(top: 3),
                    child: Text(
                      t('today.streak_badge', {'n': streak}),
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w600,
                        color: g.honeyDeep,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          if (isWater) _waterCounter(g, h, id),
        ],
      ),
    );
  }

  Widget _waterCounter(GroveColors g, Map<String, dynamic> h, String id) {
    final max = h['max'] is num ? (h['max'] as num).toInt() : 8;
    final n = store.countOf('daily', id);
    return Row(
      children: [
        StepBtn(Icons.remove, onTap: () => store.bump('daily', id, -1, maxValue: max)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10),
          child: Text(
            '$n/$max',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: n >= max ? g.sageDeep : g.ink2,
            ),
          ),
        ),
        StepBtn(Icons.add, onTap: () => store.bump('daily', id, 1, maxValue: max)),
      ],
    );
  }

  // ── Routine ────────────────────────────────────────────────────────
  Widget _routineSection(GroveColors g) {
    final blocks = List<dynamic>.from(store.routine)
      ..sort((a, b) => '${a['start']}'.compareTo('${b['start']}'));
    final done = blocks.where((b) => b['done'] == true).length;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Eyebrow(
          t('today.section_routine'),
          trailing: Text(
            blocks.isEmpty ? '–' : '$done/${blocks.length}',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: g.ink3,
            ),
          ),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            _timeChip(g, _blockStart, (v) => setState(() => _blockStart = v)),
            const SizedBox(width: 6),
            _timeChip(g, _blockEnd, (v) => setState(() => _blockEnd = v)),
            const SizedBox(width: 8),
            Expanded(
              child: TextField(
                controller: _blockCtl,
                decoration: InputDecoration(hintText: t('today.routine_ph')),
                onSubmitted: (_) => _addBlock(),
              ),
            ),
            const SizedBox(width: 8),
            GroveButton(t('common.add'), onTap: _addBlock),
          ],
        ),
        const SizedBox(height: 10),
        if (blocks.isEmpty) EmptyState(t('today.no_blocks')),
        for (final b in blocks) ...[
          _blockCard(g, _m(b)),
          const SizedBox(height: 8),
        ],
      ],
    );
  }

  String _fmtTime(TimeOfDay v) => '${p2(v.hour)}:${p2(v.minute)}';

  Widget _timeChip(GroveColors g, TimeOfDay v, ValueChanged<TimeOfDay> onPick) {
    return InkWell(
      borderRadius: BorderRadius.circular(10),
      onTap: () async {
        final picked = await showTimePicker(context: context, initialTime: v);
        if (picked != null) onPick(picked);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
        decoration: BoxDecoration(
          color: g.surface2,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: g.line),
        ),
        child: Text(
          _fmtTime(v),
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: g.ink2,
          ),
        ),
      ),
    );
  }

  void _addBlock() {
    final label = _blockCtl.text.trim();
    if (label.isEmpty) return;
    store.addBlock(_fmtTime(_blockStart), _fmtTime(_blockEnd), label);
    _blockCtl.clear();
  }

  Widget _blockCard(GroveColors g, Map<String, dynamic> b) {
    final done = b['done'] == true;
    final id = b['id'] as String;
    return GroveCard(
      done: done,
      onTap: () => store.toggleBlock(id),
      child: Row(
        children: [
          Text(
            '${b['start']}–${b['end']}',
            style: TextStyle(
              fontSize: 12.5,
              fontWeight: FontWeight.w700,
              color: g.ink3,
              fontFeatures: const [FontFeature.tabularFigures()],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              b['label'] as String? ?? '',
              style: TextStyle(
                fontSize: 14.5,
                fontWeight: FontWeight.w600,
                color: done ? g.sageDeep : g.ink,
                decoration: done ? TextDecoration.lineThrough : null,
              ),
            ),
          ),
          RoundCheck(on: done, onTap: () => store.toggleBlock(id), size: 26),
          const SizedBox(width: 6),
          IconButton(
            visualDensity: VisualDensity.compact,
            tooltip: t('today.delete_block'),
            icon: Icon(Icons.close, size: 17, color: g.ink3),
            onPressed: () => store.deleteBlock(id),
          ),
        ],
      ),
    );
  }

  // ── Quick wins ─────────────────────────────────────────────────────
  Widget _winsSection(GroveColors g) {
    var list = List<dynamic>.from(store.qw);
    if (_winsFilter == 'pending') {
      list = list.where((q) => q['status'] == 'pending').toList();
    } else if (_winsFilter == 'done') {
      list = list.where((q) => q['status'] == 'done').toList();
    }
    int score(dynamic q) {
      const priW = {'high': 0, 'med': 1, 'low': 2};
      final pw = priW[q['priority']] ?? 1;
      final eff = int.tryParse('${q['effort']}') ?? 10;
      return pw * 100 + eff;
    }

    list.sort((a, b) {
      if (a['status'] != b['status']) {
        return a['status'] == 'pending' ? -1 : 1;
      }
      return score(a) - score(b);
    });

    final filters = ['all', 'pending', 'done'];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Eyebrow(t('today.section_wins')),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: GroveSeg(
                options: [
                  t('today.filter_all'),
                  t('today.filter_pending'),
                  t('today.filter_done'),
                ],
                value: filters.indexOf(_winsFilter),
                onChanged: (i) => setState(() => _winsFilter = filters[i]),
              ),
            ),
            const SizedBox(width: 8),
            GroveButton(t('today.add_task'), subtle: true, onTap: _openTaskSheet),
          ],
        ),
        const SizedBox(height: 10),
        if (list.isEmpty)
          EmptyState(_winsFilter == 'done'
              ? t('today.no_tasks_done')
              : t('today.no_tasks_pending')),
        for (final q in list) ...[
          _taskCard(g, _m(q)),
          const SizedBox(height: 8),
        ],
      ],
    );
  }

  Widget _taskCard(GroveColors g, Map<String, dynamic> q) {
    final done = q['status'] == 'done';
    final id = q['id'] as String;
    final pri = q['priority'] as String? ?? 'med';
    final priColor = switch (pri) {
      'high' => g.rose,
      'low' => g.sage,
      _ => g.honey,
    };
    return GroveCard(
      done: done,
      onTap: () => store.toggleQuickWin(id),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: g.surface2,
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              '${q['effort']}m',
              style: TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w700,
                color: g.ink2,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(shape: BoxShape.circle, color: priColor),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              q['task'] as String? ?? '',
              style: TextStyle(
                fontSize: 14.5,
                fontWeight: FontWeight.w600,
                color: done ? g.sageDeep : g.ink,
                decoration: done ? TextDecoration.lineThrough : null,
              ),
            ),
          ),
          RoundCheck(on: done, onTap: () => store.toggleQuickWin(id), size: 26),
          const SizedBox(width: 6),
          IconButton(
            visualDensity: VisualDensity.compact,
            tooltip: t('today.delete_task'),
            icon: Icon(Icons.close, size: 17, color: g.ink3),
            onPressed: () => store.deleteQuickWin(id),
          ),
        ],
      ),
    );
  }

  void _openTaskSheet() {
    final taskCtl = TextEditingController();
    var priority = 'med';
    var effort = '10';
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
                Eyebrow(t('today.section_wins')),
                const SizedBox(height: 12),
                TextField(
                  controller: taskCtl,
                  autofocus: true,
                  decoration: InputDecoration(hintText: t('today.task_ph')),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  children: [
                    for (final p in ['high', 'med', 'low'])
                      ChoiceChip(
                        label: Text(t('today.priority_$p')),
                        selected: priority == p,
                        selectedColor: g.sageSoft,
                        onSelected: (_) => setSheet(() => priority = p),
                      ),
                  ],
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  children: [
                    for (final e in ['5', '10', '15', '30', '60'])
                      ChoiceChip(
                        label: Text(t('today.effort_min', {'n': e})),
                        selected: effort == e,
                        selectedColor: g.sageSoft,
                        onSelected: (_) => setSheet(() => effort = e),
                      ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    GroveButton(t('common.cancel'), subtle: true,
                        onTap: () => Navigator.pop(ctx)),
                    const SizedBox(width: 8),
                    GroveButton(t('common.add'), onTap: () {
                      final task = taskCtl.text.trim();
                      if (task.isEmpty) return;
                      store.addQuickWin(task, effort, priority);
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

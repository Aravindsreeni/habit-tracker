// ── journal_view.dart — Three Good Things (port of views/journal.js) ─
import 'package:flutter/material.dart';

import '../core/i18n.dart';
import '../core/store.dart';
import '../theme/grove_theme.dart';
import '../widgets/grove.dart';

const _caps = {'wins': 3, 'lows': 1, 'growth': 3};

class JournalView extends StatefulWidget {
  const JournalView({super.key});

  @override
  State<JournalView> createState() => _JournalViewState();
}

class _JournalViewState extends State<JournalView> {
  final _ctls = {
    'wins': TextEditingController(),
    'lows': TextEditingController(),
    'growth': TextEditingController(),
  };
  String? _openDay;

  @override
  void dispose() {
    for (final c in _ctls.values) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final g = gc(context);
    final day = ymd(DateTime.now());
    final entry = store.journal(day);
    final n = (entry['wins'] as List).length +
        (entry['lows'] as List).length +
        (entry['growth'] as List).length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Eyebrow(n > 0
            ? t('journal.header_count', {'n': n})
            : t('journal.header_base')),
        const SizedBox(height: 10),
        Text(t('journal.intro'),
            style: TextStyle(color: g.ink2, fontSize: 13.5)),
        const SizedBox(height: 16),
        _section(g, day, entry, 'wins', t('journal.wins_title'),
            t('journal.wins_ph'), t('journal.wins_hint')),
        const SizedBox(height: 18),
        _section(g, day, entry, 'lows', t('journal.lows_title'),
            t('journal.lows_ph'), t('journal.lows_hint')),
        const SizedBox(height: 18),
        _section(g, day, entry, 'growth', t('journal.growth_title'),
            t('journal.growth_ph'), null),
        const SizedBox(height: 24),
        _history(g),
        const SizedBox(height: 22),
        GroveCard(
          child: Text(
            t('journal.disclaimer'),
            style: TextStyle(fontSize: 11.5, color: g.ink3, height: 1.5),
          ),
        ),
      ],
    );
  }

  Widget _section(GroveColors g, String day, Map<String, dynamic> entry,
      String kind, String title, String hintPh, String? hint) {
    final items = entry[kind] as List;
    final full = items.length >= _caps[kind]!;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title,
            style: TextStyle(
              fontSize: 14.5,
              fontWeight: FontWeight.w700,
              color: g.ink,
            )),
        if (hint != null)
          Padding(
            padding: const EdgeInsets.only(top: 2),
            child: Text(hint, style: TextStyle(fontSize: 12, color: g.ink3)),
          ),
        const SizedBox(height: 8),
        if (items.isEmpty)
          Text(t('journal.blank'),
              style: TextStyle(
                fontSize: 12.5,
                fontStyle: FontStyle.italic,
                color: g.ink3,
              )),
        for (var i = 0; i < items.length; i++)
          Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: GroveCard(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: Row(
                children: [
                  Expanded(
                    child: Text('${items[i]}',
                        style: TextStyle(fontSize: 13.5, color: g.ink)),
                  ),
                  IconButton(
                    visualDensity: VisualDensity.compact,
                    icon: Icon(Icons.close, size: 16, color: g.ink3),
                    onPressed: () {
                      items.removeAt(i);
                      store.saveJournal(day, entry);
                    },
                  ),
                ],
              ),
            ),
          ),
        const SizedBox(height: 4),
        if (full)
          Text(t('journal.full'),
              style: TextStyle(fontSize: 12.5, color: g.sageDeep))
        else
          TextField(
            controller: _ctls[kind],
            decoration: InputDecoration(hintText: hintPh),
            onSubmitted: (v) {
              final text = v.trim();
              if (text.isEmpty) return;
              items.add(text);
              store.saveJournal(day, entry);
              _ctls[kind]!.clear();
            },
          ),
      ],
    );
  }

  Widget _history(GroveColors g) {
    final today = ymd(DateTime.now());
    final rows =
        store.journalHistory().where((r) => r.key != today).take(14).toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Eyebrow(t('journal.past_days')),
        const SizedBox(height: 10),
        if (rows.isEmpty) EmptyState(t('journal.history_empty')),
        for (final r in rows)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: GroveCard(
              onTap: () => setState(
                  () => _openDay = _openDay == r.key ? null : r.key),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(r.key,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: g.ink2,
                          )),
                      Text(
                        '🌟 ${(r.value['wins'] as List).length}',
                        style: TextStyle(fontSize: 12, color: g.ink3),
                      ),
                    ],
                  ),
                  if (_openDay == r.key) ...[
                    const SizedBox(height: 8),
                    for (final kind in ['wins', 'lows', 'growth'])
                      for (final item in r.value[kind] as List)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 4),
                          child: Text(
                            '${kind == 'wins' ? '🌟' : kind == 'lows' ? '🌧' : '🌱'} $item',
                            style: TextStyle(fontSize: 13, color: g.ink2),
                          ),
                        ),
                  ],
                ],
              ),
            ),
          ),
      ],
    );
  }
}

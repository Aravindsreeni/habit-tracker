// ── cbt_view.dart — thought records: Beck CBT + Ellis ABC(DE) ────────
// Port of views/cbt.js. Records share the web app's shape:
// { id, createdAt, model, situation, thoughts, emotion, before,
//   evidenceFor, evidenceAgainst, disputation, balanced, after,
//   distortions[] }
import 'package:flutter/material.dart';

import '../core/i18n.dart';
import '../core/store.dart';
import '../theme/grove_theme.dart';
import '../widgets/grove.dart';

const distortionIds = [
  'all_or_nothing',
  'catastrophizing',
  'overgeneralization',
  'mental_filter',
  'mind_reading',
  'labeling',
  'emotional_reasoning',
  'discounting_positive',
  'fortune_telling',
  'personalization',
  'should_statements',
  'magnification',
  'blaming',
];

class CbtView extends StatefulWidget {
  const CbtView({super.key});

  @override
  State<CbtView> createState() => _CbtViewState();
}

class _CbtViewState extends State<CbtView> {
  String? _openId;

  @override
  Widget build(BuildContext context) {
    final g = gc(context);
    final records = store.cbt;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Eyebrow(
          records.isEmpty
              ? t('cbt.header_base')
              : t('cbt.header_count', {'n': records.length}),
          trailing: GestureDetector(
            onTap: _openForm,
            child: Text(
              t('cbt.btn_new'),
              style: TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w700,
                color: g.sageDeep,
              ),
            ),
          ),
        ),
        const SizedBox(height: 10),
        Text(t('cbt.intro'), style: TextStyle(color: g.ink2, fontSize: 13.5)),
        const SizedBox(height: 14),
        if (records.isEmpty) EmptyState(t('cbt.empty')),
        for (final r in records)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: _recordCard(g, (r as Map).cast<String, dynamic>()),
          ),
        const SizedBox(height: 14),
        GroveCard(
          child: Text(
            t('cbt.disclaimer'),
            style: TextStyle(fontSize: 11.5, color: g.ink3, height: 1.5),
          ),
        ),
      ],
    );
  }

  int? _pct(dynamic v) {
    if (v is num) return v.toInt().clamp(0, 100);
    return null;
  }

  Widget _recordCard(GroveColors g, Map<String, dynamic> r) {
    final id = r['id'] as String? ?? '';
    final abcde = r['model'] == 'abcde';
    final open = _openId == id;
    final before = _pct(r['before']);
    final after = _pct(r['after']);
    final createdAt = r['createdAt'] as String? ?? '';
    final date = createdAt.length >= 10 ? createdAt.substring(0, 10) : '';

    String s(String k) => r[k] is String ? r[k] as String : '';

    final rows = <MapEntry<String, String>>[];
    if (open) {
      if (abcde) {
        rows.add(MapEntry(t('cbt.row_a'), s('situation')));
        rows.add(MapEntry(t('cbt.row_b'), s('thoughts')));
        rows.add(MapEntry(t('cbt.row_c'),
            '${s('emotion')}${before != null ? ' · $before%' : ''}'));
        rows.add(MapEntry(t('cbt.row_d'), s('disputation')));
        rows.add(MapEntry(t('cbt.row_e'), s('balanced')));
      } else {
        rows.add(MapEntry(t('cbt.row_situation'), s('situation')));
        rows.add(MapEntry(t('cbt.row_thoughts'), s('thoughts')));
        rows.add(MapEntry(t('cbt.row_emotion_before'),
            '${s('emotion')}${before != null ? ' · $before%' : ''}'));
        rows.add(MapEntry(t('cbt.row_evidence_for'), s('evidenceFor')));
        rows.add(MapEntry(t('cbt.row_evidence_against'), s('evidenceAgainst')));
        rows.add(MapEntry(t('cbt.row_balanced'), s('balanced')));
      }
      final dists = r['distortions'];
      if (dists is List && dists.isNotEmpty) {
        rows.add(MapEntry(
          t('cbt.row_thinking'),
          dists
              .whereType<String>()
              .where(distortionIds.contains)
              .map((d) => t('cbt.dist_${d}_label'))
              .join(' · '),
        ));
      }
      if (after != null) {
        rows.add(MapEntry(t('cbt.row_emotion_after'), '$after%'));
      }
    }

    String? foot;
    if (before != null && after != null) {
      final delta = before - after;
      if (delta > 0) {
        foot = t('cbt.foot_eased', {'before': before, 'after': after});
      } else if (delta < 0) {
        foot = t('cbt.foot_rose', {'before': before, 'after': after});
      } else {
        foot = t('cbt.foot_steady', {'before': before});
      }
    }

    return GroveCard(
      onTap: () => setState(() => _openId = open ? null : id),
      onLongPress: () => _confirmDelete(id),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: abcde ? g.lavenderSoft : g.skySoft,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  abcde ? 'ABC(DE)' : 'CBT',
                  style: TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w700,
                    color: abcde ? g.lavenderDeep : g.skyDeep,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  s('situation').isNotEmpty ? s('situation') : s('thoughts'),
                  maxLines: open ? null : 1,
                  overflow: open ? null : TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: g.ink,
                  ),
                ),
              ),
              if (date.isNotEmpty)
                Text(date,
                    style: TextStyle(fontSize: 11, color: g.ink3)),
            ],
          ),
          for (final row in rows)
            if (row.value.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(row.key,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.4,
                          color: g.ink3,
                        )),
                    const SizedBox(height: 2),
                    Text(row.value,
                        style: TextStyle(
                          fontSize: 13.5,
                          color: g.ink2,
                          height: 1.35,
                        )),
                  ],
                ),
              ),
          if (open && foot != null)
            Padding(
              padding: const EdgeInsets.only(top: 10),
              child: Text(foot,
                  style: TextStyle(fontSize: 12.5, color: g.sageDeep)),
            ),
        ],
      ),
    );
  }

  void _confirmDelete(String id) {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        content: Text(t('common.delete')),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text(t('common.cancel'))),
          TextButton(
            onPressed: () {
              store.deleteCbt(id);
              Navigator.pop(ctx);
            },
            child: Text(t('common.delete')),
          ),
        ],
      ),
    );
  }

  void _openForm() {
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const CbtFormPage()),
    );
  }
}

// ── Full-screen new-record form ──────────────────────────────────────
class CbtFormPage extends StatefulWidget {
  const CbtFormPage({super.key});

  @override
  State<CbtFormPage> createState() => _CbtFormPageState();
}

class _CbtFormPageState extends State<CbtFormPage> {
  String _model = 'beck';
  final _situation = TextEditingController();
  final _thoughts = TextEditingController();
  final _emotion = TextEditingController();
  final _evidenceFor = TextEditingController();
  final _evidenceAgainst = TextEditingController();
  final _disputation = TextEditingController();
  final _balanced = TextEditingController();
  double _before = 50;
  double _after = 50;
  bool _beforeSet = false;
  bool _afterSet = false;
  final Set<String> _dists = {};

  @override
  void dispose() {
    for (final c in [
      _situation, _thoughts, _emotion, _evidenceFor,
      _evidenceAgainst, _disputation, _balanced,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final g = gc(context);
    final beck = _model == 'beck';
    return Scaffold(
      backgroundColor: g.paper,
      appBar: AppBar(
        backgroundColor: g.paper,
        surfaceTintColor: Colors.transparent,
        foregroundColor: g.ink,
        title: Text(t('cbt.btn_new').replaceFirst('+ ', '')),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
          children: [
            GroveSeg(
              options: [t('cbt.mode_beck'), t('cbt.mode_abcde')],
              value: beck ? 0 : 1,
              onChanged: (i) =>
                  setState(() => _model = i == 0 ? 'beck' : 'abcde'),
            ),
            const SizedBox(height: 8),
            Text(
              beck ? t('cbt.hint_beck') : t('cbt.hint_abcde'),
              style: TextStyle(fontSize: 12.5, color: g.ink3),
            ),
            const SizedBox(height: 16),
            _field(
              beck
                  ? t('cbt.beck_situation_label')
                  : t('cbt.abcde_situation_label'),
              beck ? t('cbt.beck_situation_ph') : t('cbt.abcde_situation_ph'),
              _situation,
            ),
            _field(
              beck
                  ? t('cbt.beck_thoughts_label')
                  : t('cbt.abcde_thoughts_label'),
              beck ? t('cbt.beck_thoughts_ph') : t('cbt.abcde_thoughts_ph'),
              _thoughts,
            ),
            _label(g,
                beck ? t('cbt.beck_emotion_label') : t('cbt.abcde_emotion_label')),
            TextField(
              controller: _emotion,
              decoration: const InputDecoration(),
            ),
            _slider(g, _before, _beforeSet, (v) {
              setState(() {
                _before = v;
                _beforeSet = true;
              });
            }),
            const SizedBox(height: 14),
            _distortions(g),
            const SizedBox(height: 14),
            if (beck) ...[
              _field(t('cbt.beck_evidence_for_label'),
                  t('cbt.beck_evidence_for_ph'), _evidenceFor),
              _field(t('cbt.beck_evidence_against_label'),
                  t('cbt.beck_evidence_against_ph'), _evidenceAgainst),
              _field(t('cbt.beck_balanced_label'), t('cbt.beck_balanced_ph'),
                  _balanced),
            ] else ...[
              _field(t('cbt.abcde_disp_label'), t('cbt.abcde_disp_ph'),
                  _disputation),
              _field(t('cbt.abcde_balanced_label'), t('cbt.abcde_balanced_ph'),
                  _balanced),
            ],
            _label(g,
                beck ? t('cbt.beck_after_label') : t('cbt.abcde_after_label')),
            _slider(g, _after, _afterSet, (v) {
              setState(() {
                _after = v;
                _afterSet = true;
              });
            }),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                GroveButton(t('cbt.btn_close'), subtle: true,
                    onTap: () => Navigator.pop(context)),
                const SizedBox(width: 8),
                GroveButton(t('cbt.btn_save'), onTap: _save),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _label(GroveColors g, String text) => Padding(
        padding: const EdgeInsets.only(top: 12, bottom: 6),
        child: Text(text,
            style: TextStyle(
              fontSize: 12.5,
              fontWeight: FontWeight.w700,
              color: g.ink2,
            )),
      );

  Widget _field(String label, String hint, TextEditingController ctl) {
    final g = gc(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _label(g, label),
        TextField(
          controller: ctl,
          minLines: 2,
          maxLines: 5,
          decoration: InputDecoration(hintText: hint),
        ),
      ],
    );
  }

  Widget _slider(GroveColors g, double value, bool set, ValueChanged<double> onChanged) {
    return Row(
      children: [
        Expanded(
          child: Slider(
            value: value,
            min: 0,
            max: 100,
            divisions: 20,
            activeColor: g.sage,
            onChanged: onChanged,
          ),
        ),
        SizedBox(
          width: 44,
          child: Text(
            set ? '${value.round()}%' : '—',
            textAlign: TextAlign.right,
            style: TextStyle(fontSize: 13, color: g.ink2),
          ),
        ),
      ],
    );
  }

  Widget _distortions(GroveColors g) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(t('cbt.dist_header'),
                style: TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w700,
                  color: g.ink2,
                )),
            const SizedBox(width: 4),
            Expanded(
              child: Text(t('cbt.dist_hint'),
                  style: TextStyle(fontSize: 11.5, color: g.ink3)),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 6,
          runSpacing: 6,
          children: [
            for (final id in distortionIds)
              Tooltip(
                message: t('cbt.dist_${id}_ex'),
                triggerMode: TooltipTriggerMode.longPress,
                child: FilterChip(
                  label: Text(t('cbt.dist_${id}_label'),
                      style: const TextStyle(fontSize: 12)),
                  selected: _dists.contains(id),
                  selectedColor: g.lavenderSoft,
                  onSelected: (on) => setState(() {
                    if (on) {
                      _dists.add(id);
                    } else {
                      _dists.remove(id);
                    }
                  }),
                ),
              ),
          ],
        ),
      ],
    );
  }

  void _save() {
    if (_situation.text.trim().isEmpty && _thoughts.text.trim().isEmpty) {
      toast(context, t('cbt.toast_empty'));
      return;
    }
    final messenger = ScaffoldMessenger.of(context);
    store.addCbt({
      'id': 'c${DateTime.now().millisecondsSinceEpoch}',
      'createdAt': DateTime.now().toIso8601String(),
      'model': _model,
      'situation': _situation.text.trim(),
      'thoughts': _thoughts.text.trim(),
      'emotion': _emotion.text.trim(),
      'before': _beforeSet ? _before.round() : null,
      'evidenceFor': _model == 'beck' ? _evidenceFor.text.trim() : '',
      'evidenceAgainst': _model == 'beck' ? _evidenceAgainst.text.trim() : '',
      'disputation': _model == 'abcde' ? _disputation.text.trim() : '',
      'balanced': _balanced.text.trim(),
      'after': _afterSet ? _after.round() : null,
      'distortions': _dists.toList(),
    });
    Navigator.pop(context);
    messenger
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(t('cbt.toast_saved'))));
  }
}

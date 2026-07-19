// ── inbox_view.dart — brain-dump capture (port of views/inbox.js) ────
import 'package:flutter/material.dart';

import '../core/i18n.dart';
import '../core/store.dart';
import '../theme/grove_theme.dart';
import '../widgets/grove.dart';

class InboxView extends StatefulWidget {
  const InboxView({super.key});

  @override
  State<InboxView> createState() => _InboxViewState();
}

class _InboxViewState extends State<InboxView> {
  final _ctl = TextEditingController();

  @override
  void dispose() {
    _ctl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final g = gc(context);
    final items = store.inbox;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Eyebrow(items.isEmpty
            ? t('inbox.header_base')
            : t('inbox.header_count', {'count': items.length})),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _ctl,
                decoration: InputDecoration(hintText: t('inbox.ph')),
                onSubmitted: (_) => _add(),
              ),
            ),
            const SizedBox(width: 8),
            GroveButton(t('common.add'), onTap: _add),
          ],
        ),
        const SizedBox(height: 12),
        if (items.isEmpty) EmptyState(t('inbox.empty')),
        for (final item in items.reversed)
          Padding(
            // Keyed: the note TextFormField below is stateful, and must stay
            // attached to its item when new captures shift list positions.
            key: ValueKey((item as Map)['id']),
            padding: const EdgeInsets.only(bottom: 8),
            child: _card(g, item.cast<String, dynamic>()),
          ),
      ],
    );
  }

  void _add() {
    final text = _ctl.text.trim();
    if (text.isEmpty) return;
    store.addInboxItem(text);
    _ctl.clear();
  }

  Widget _card(GroveColors g, Map<String, dynamic> item) {
    final id = item['id'] as String;
    return GroveCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  item['text'] as String? ?? '',
                  style: TextStyle(
                    fontSize: 14.5,
                    fontWeight: FontWeight.w600,
                    color: g.ink,
                  ),
                ),
              ),
              TextButton(
                onPressed: () {
                  store.convertInboxToTask(id);
                  toast(context, t('inbox.converted'));
                },
                child: Text(
                  t('inbox.convert'),
                  style: TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                    color: g.skyDeep,
                  ),
                ),
              ),
              IconButton(
                visualDensity: VisualDensity.compact,
                icon: Icon(Icons.close, size: 17, color: g.ink3),
                onPressed: () => store.deleteInboxItem(id),
              ),
            ],
          ),
          TextFormField(
            initialValue: item['note'] as String? ?? '',
            style: TextStyle(fontSize: 13, color: g.ink2),
            decoration: InputDecoration(
              hintText: t('inbox.note_ph'),
              filled: false,
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              contentPadding: EdgeInsets.zero,
              isDense: true,
            ),
            onChanged: (v) => store.setInboxNote(id, v),
          ),
        ],
      ),
    );
  }
}

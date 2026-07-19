// ── settings_view.dart — theme · language · backup ───────────────────
// Port of views/settings.js (reminders arrive in a later build; Drive
// sync is replaced by JSON backup/restore for now).
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../core/i18n.dart';
import '../core/store.dart';
import '../theme/grove_theme.dart';
import '../widgets/grove.dart';

class SettingsView extends StatelessWidget {
  const SettingsView({super.key});

  @override
  Widget build(BuildContext context) {
    final g = gc(context);
    final themes = ['system', 'light', 'dark'];
    final langs = ['en', 'ml'];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Eyebrow(t('settings.section_theme')),
        const SizedBox(height: 10),
        GroveSeg(
          options: [
            t('settings.theme_system'),
            t('settings.theme_light'),
            t('settings.theme_dark'),
          ],
          value: themes.indexOf(store.theme).clamp(0, 2),
          onChanged: (i) => store.setTheme(themes[i]),
        ),
        const SizedBox(height: 22),
        Eyebrow(t('settings.section_language')),
        const SizedBox(height: 10),
        GroveSeg(
          options: [t('settings.lang_en'), t('settings.lang_ml')],
          value: langs.indexOf(store.lang).clamp(0, 1),
          onChanged: (i) => store.setLang(langs[i]),
        ),
        const SizedBox(height: 22),
        Eyebrow(t('you.section_backup')),
        const SizedBox(height: 10),
        GroveCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(t('you.backup_hint'),
                  style: TextStyle(fontSize: 12.5, color: g.ink2, height: 1.4)),
              const SizedBox(height: 12),
              Row(
                children: [
                  GroveButton(t('you.btn_export'), subtle: true, onTap: () {
                    Clipboard.setData(
                        ClipboardData(text: store.exportJson()));
                    toast(context, t('you.backup_copied'));
                  }),
                  const SizedBox(width: 8),
                  GroveButton(t('you.btn_import'), subtle: true,
                      onTap: () => _openRestore(context)),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 22),
        GroveCard(
          child: Text(
            t('settings.reminders_note'),
            style: TextStyle(fontSize: 12, color: g.ink3, height: 1.4),
          ),
        ),
      ],
    );
  }

  void _openRestore(BuildContext context) {
    final ctl = TextEditingController();
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(t('you.btn_import')),
        content: TextField(
          controller: ctl,
          minLines: 4,
          maxLines: 8,
          decoration: InputDecoration(hintText: t('you.restore_ph')),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(t('common.cancel')),
          ),
          TextButton(
            onPressed: () {
              final ok = store.importJson(ctl.text);
              Navigator.pop(ctx);
              toast(context,
                  ok ? t('you.restore_done') : t('you.restore_bad'));
            },
            child: Text(t('common.save')),
          ),
        ],
      ),
    );
  }
}

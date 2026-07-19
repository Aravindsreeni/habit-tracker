// ── i18n.dart — tiny translation engine (port of js/i18n.js) ─────────
// t('namespace.key', {token: value}) with {placeholder} substitution.
// English is the fallback for any key missing from the active locale.
import 'locales/en.dart';
import 'locales/ml.dart';

class I18n {
  String lang = 'en';
  Map<String, Map<String, String>> strings = en;

  void load(String code) {
    lang = code == 'ml' ? 'ml' : 'en';
    strings = lang == 'ml' ? ml : en;
  }
}

final i18n = I18n();

String t(String key, [Map<String, Object?>? vars]) {
  final dot = key.indexOf('.');
  if (dot < 0) return key;
  final ns = key.substring(0, dot);
  final k = key.substring(dot + 1);
  var s = i18n.strings[ns]?[k] ?? en[ns]?[k] ?? key;
  if (vars != null) {
    vars.forEach((token, v) {
      s = s.replaceAll('{$token}', '$v');
    });
  }
  return s;
}

String plural(num n, String one, String other) => n == 1 ? one : other;

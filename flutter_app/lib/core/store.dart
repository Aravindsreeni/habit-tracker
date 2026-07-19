// ── store.dart — state + persistence (port of js/store.js) ───────────
// Uses SharedPreferences with the SAME keys and JSON shapes as the web
// app's localStorage (ht_habits, ht_d_YYYY-MM-DD, ht_qw, …), so data is
// portable between the PWA and this app via JSON backup/restore.
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'i18n.dart';

const int schemaVersion = 3;
const List<String> horizons = [
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'yearly',
];

// ── Date-key helpers (same formats as store.js) ──────────────────────
String p2(int n) => n.toString().padLeft(2, '0');
String ymd(DateTime d) => '${d.year}-${p2(d.month)}-${p2(d.day)}';

String dKey([DateTime? d]) => 'ht_d_${ymd(d ?? DateTime.now())}';

String wKey() {
  // ISO week number — port of the JS algorithm in store.js.
  var d = DateTime.now();
  d = DateTime(d.year, d.month, d.day);
  final thu = d.add(Duration(days: 4 - d.weekday));
  final jan1 = DateTime(thu.year, 1, 1);
  final week = ((thu.difference(jan1).inDays + 1) / 7).ceil();
  return 'ht_w_${thu.year}-W${p2(week)}';
}

String mKey() {
  final d = DateTime.now();
  return 'ht_m_${d.year}-${p2(d.month)}';
}

String qKey() {
  final d = DateTime.now();
  return 'ht_q_${d.year}-Q${(d.month - 1) ~/ 3 + 1}';
}

String yKey() => 'ht_y_${DateTime.now().year}';

String jKey([DateTime? d]) => 'ht_journal_${ymd(d ?? DateTime.now())}';
String moodKey([DateTime? d]) => 'ht_mood_${ymd(d ?? DateTime.now())}';

class Streak {
  final int current;
  final int best;
  const Streak(this.current, this.best);
}

class Store extends ChangeNotifier {
  late SharedPreferences _p;
  String _loadedDay = '';

  Map<String, dynamic> habits = {};
  Map<String, dynamic> d = {}, w = {}, m = {}, q = {}, y = {};
  List<dynamic> qw = [], inbox = [], routine = [], areas = [], cbt = [];
  Map<String, dynamic> settings = {};

  // ── Init / persistence ─────────────────────────────────────────────
  Future<void> init() async {
    _p = await SharedPreferences.getInstance();
    _migrate();
    _loadAll();
  }

  dynamic lsGet(String key) {
    final s = _p.getString(key);
    if (s == null) return null;
    try {
      return jsonDecode(s);
    } catch (_) {
      return null;
    }
  }

  void lsSet(String key, dynamic value) {
    _p.setString(key, jsonEncode(value));
  }

  void _migrate() {
    final v = lsGet('ht_schema_version');
    final from = v is int ? v : 1;
    if (from < schemaVersion) {
      // Additive only, mirrors migrate() in store.js.
      if (lsGet('ht_areas') is! List) lsSet('ht_areas', []);
      lsSet('ht_schema_version', schemaVersion);
    }
  }

  void _loadAll() {
    final h = lsGet('ht_habits');
    habits = h is Map
        ? Map<String, dynamic>.from(h)
        : <String, dynamic>{for (final hz in horizons) hz: <dynamic>[]};
    for (final hz in horizons) {
      if (habits[hz] is! List) habits[hz] = <dynamic>[];
    }
    _loadPeriods();
    qw = _list('ht_qw');
    inbox = _list('ht_inbox');
    routine = _list('ht_routine');
    areas = _list('ht_areas');
    cbt = _list('ht_cbt');
    final s = lsGet('ht_settings');
    settings = s is Map ? Map<String, dynamic>.from(s) : <String, dynamic>{};
  }

  void _loadPeriods() {
    d = _log(dKey());
    w = _log(wKey());
    m = _log(mKey());
    q = _log(qKey());
    y = _log(yKey());
    _loadedDay = dKey();
  }

  Map<String, dynamic> _log(String key) {
    final v = lsGet(key);
    final map =
        v is Map ? Map<String, dynamic>.from(v) : <String, dynamic>{};
    if (map['remarks'] is! Map) map['remarks'] = <String, dynamic>{};
    return map;
  }

  List<dynamic> _list(String key) {
    final v = lsGet(key);
    return v is List ? List<dynamic>.from(v) : <dynamic>[];
  }

  /// Reload period logs if the date rolled over while the app stayed open.
  void rollover() {
    if (_loadedDay != dKey()) _loadPeriods();
  }

  // ── Habits ─────────────────────────────────────────────────────────
  List<dynamic> habitsOf(String horizon) => habits[horizon] as List<dynamic>;

  void addHabit(String horizon, Map<String, dynamic> habit) {
    habitsOf(horizon).add(habit);
    lsSet('ht_habits', habits);
    notifyListeners();
  }

  void deleteHabit(String horizon, String id) {
    habits[horizon] =
        habitsOf(horizon).where((h) => h['id'] != id).toList();
    lsSet('ht_habits', habits);
    notifyListeners();
  }

  Map<String, dynamic> _periodLog(String horizon) {
    switch (horizon) {
      case 'weekly':
        return w;
      case 'monthly':
        return m;
      case 'quarterly':
        return q;
      case 'yearly':
        return y;
      default:
        return d;
    }
  }

  String _periodKey(String horizon) {
    switch (horizon) {
      case 'weekly':
        return wKey();
      case 'monthly':
        return mKey();
      case 'quarterly':
        return qKey();
      case 'yearly':
        return yKey();
      default:
        return dKey();
    }
  }

  int countOf(String horizon, String id) {
    final v = _periodLog(horizon)[id];
    return v is num ? v.toInt() : 0;
  }

  bool isDailyDone(Map<String, dynamic> habit) {
    rollover();
    if (habit['type'] == 'w') {
      final max = habit['max'] is num ? (habit['max'] as num).toInt() : 8;
      return countOf('daily', habit['id'] as String) >= max;
    }
    return d[habit['id']] == true;
  }

  void toggleDaily(String id) {
    rollover();
    d[id] = d[id] != true;
    lsSet(dKey(), d);
    notifyListeners();
  }

  void bump(String horizon, String id, int delta, {int maxValue = 999}) {
    rollover();
    final log = _periodLog(horizon);
    final next = (countOf(horizon, id) + delta).clamp(0, maxValue);
    log[id] = next;
    lsSet(_periodKey(horizon), log);
    notifyListeners();
  }

  // ── Quick wins ─────────────────────────────────────────────────────
  void addQuickWin(String task, String effort, String priority) {
    qw.add({
      'id': 'q${DateTime.now().millisecondsSinceEpoch}',
      'task': task,
      'effort': effort,
      'priority': priority,
      'status': 'pending',
    });
    lsSet('ht_qw', qw);
    notifyListeners();
  }

  void toggleQuickWin(String id) {
    for (final t in qw) {
      if (t['id'] == id) {
        t['status'] = t['status'] == 'done' ? 'pending' : 'done';
      }
    }
    lsSet('ht_qw', qw);
    notifyListeners();
  }

  void deleteQuickWin(String id) {
    qw = qw.where((t) => t['id'] != id).toList();
    lsSet('ht_qw', qw);
    notifyListeners();
  }

  // ── Routine ────────────────────────────────────────────────────────
  void addBlock(String start, String end, String label) {
    routine.add({
      'id': 'r${DateTime.now().millisecondsSinceEpoch}',
      'start': start,
      'end': end,
      'label': label,
      'done': false,
    });
    lsSet('ht_routine', routine);
    notifyListeners();
  }

  void toggleBlock(String id) {
    for (final b in routine) {
      if (b['id'] == id) b['done'] = b['done'] != true;
    }
    lsSet('ht_routine', routine);
    notifyListeners();
  }

  void deleteBlock(String id) {
    routine = routine.where((b) => b['id'] != id).toList();
    lsSet('ht_routine', routine);
    notifyListeners();
  }

  // ── Inbox ──────────────────────────────────────────────────────────
  void addInboxItem(String text) {
    inbox.add({
      'id': 'i${DateTime.now().millisecondsSinceEpoch}',
      'text': text,
      'note': '',
      'done': false,
      'createdAt': DateTime.now().toIso8601String(),
    });
    lsSet('ht_inbox', inbox);
    notifyListeners();
  }

  void setInboxNote(String id, String note) {
    for (final i in inbox) {
      if (i['id'] == id) i['note'] = note;
    }
    lsSet('ht_inbox', inbox);
    // No notify: called from a live TextField; nothing else shows notes.
  }

  void convertInboxToTask(String id) {
    dynamic item;
    for (final i in inbox) {
      if (i['id'] == id) item = i;
    }
    if (item == null) return;
    addQuickWin(item['text'] as String? ?? '', '10', 'med');
    deleteInboxItem(id);
  }

  void deleteInboxItem(String id) {
    inbox = inbox.where((i) => i['id'] != id).toList();
    lsSet('ht_inbox', inbox);
    notifyListeners();
  }

  // ── Journal ────────────────────────────────────────────────────────
  Map<String, dynamic> journal(String day) {
    final v = lsGet('ht_journal_$day');
    final e = v is Map ? Map<String, dynamic>.from(v) : <String, dynamic>{};
    for (final k in ['wins', 'lows', 'growth']) {
      if (e[k] is! List) e[k] = <dynamic>[];
    }
    return e;
  }

  void saveJournal(String day, Map<String, dynamic> entry) {
    lsSet('ht_journal_$day', entry);
    notifyListeners();
  }

  /// All journal entries with content, newest first: [(ymd, entry), …]
  List<MapEntry<String, Map<String, dynamic>>> journalHistory() {
    final rows = <MapEntry<String, Map<String, dynamic>>>[];
    for (final key in _p.getKeys()) {
      if (!key.startsWith('ht_journal_')) continue;
      final day = key.substring(11);
      final e = journal(day);
      final n = (e['wins'] as List).length +
          (e['lows'] as List).length +
          (e['growth'] as List).length;
      if (n > 0) rows.add(MapEntry(day, e));
    }
    rows.sort((a, b) => b.key.compareTo(a.key));
    return rows;
  }

  // ── Mood ───────────────────────────────────────────────────────────
  Map<String, dynamic>? mood(String day) {
    final v = lsGet('ht_mood_$day');
    return v is Map ? Map<String, dynamic>.from(v) : null;
  }

  void saveMood(String day, int score, String note) {
    lsSet('ht_mood_$day', {'score': score, 'note': note});
    notifyListeners();
  }

  // ── CBT ────────────────────────────────────────────────────────────
  void addCbt(Map<String, dynamic> record) {
    cbt.insert(0, record);
    lsSet('ht_cbt', cbt);
    notifyListeners();
  }

  void deleteCbt(String id) {
    cbt = cbt.where((r) => r['id'] != id).toList();
    lsSet('ht_cbt', cbt);
    notifyListeners();
  }

  // ── Settings ───────────────────────────────────────────────────────
  String get theme =>
      settings['theme'] is String ? settings['theme'] as String : 'system';
  String get lang =>
      settings['lang'] is String ? settings['lang'] as String : 'en';

  void setTheme(String value) {
    settings['theme'] = value;
    lsSet('ht_settings', settings);
    notifyListeners();
  }

  void setLang(String value) {
    settings['lang'] = value;
    lsSet('ht_settings', settings);
    i18n.load(value);
    notifyListeners();
  }

  // ── Stats helpers ──────────────────────────────────────────────────
  /// For each daily habit id: the set of 'YYYY-MM-DD' days it was done.
  Map<String, Set<String>> completedDaySets() {
    final daily = habitsOf('daily');
    final sets = <String, Set<String>>{
      for (final h in daily) h['id'] as String: <String>{},
    };
    for (final key in _p.getKeys()) {
      if (!key.startsWith('ht_d_')) continue;
      final log = lsGet(key);
      if (log is! Map) continue;
      final day = key.substring(5);
      for (final h in daily) {
        final id = h['id'] as String;
        final v = log[id];
        final bool done;
        if (h['type'] == 'w') {
          final max = h['max'] is num ? (h['max'] as num).toInt() : 8;
          done = v is num && v >= max;
        } else {
          done = v == true;
        }
        if (done) sets[id]!.add(day);
      }
    }
    return sets;
  }

  Streak streakOf(Set<String> days) {
    // Current: walk back from today (an unfinished today doesn't break it).
    var current = 0;
    var cursor = DateTime.now();
    if (!days.contains(ymd(cursor))) {
      cursor = cursor.subtract(const Duration(days: 1));
    }
    while (days.contains(ymd(cursor))) {
      current++;
      cursor = cursor.subtract(const Duration(days: 1));
    }
    // Best: longest run of consecutive dates.
    final sorted = days.map(DateTime.parse).toList()..sort();
    var best = 0, run = 0;
    DateTime? prev;
    for (final day in sorted) {
      run = (prev != null && day.difference(prev).inDays == 1) ? run + 1 : 1;
      if (run > best) best = run;
      prev = day;
    }
    return Streak(current, best);
  }

  // ── Backup / restore ───────────────────────────────────────────────
  String exportJson() {
    final out = <String, dynamic>{};
    final keys = _p.getKeys().where((k) => k.startsWith('ht_')).toList()
      ..sort();
    for (final k in keys) {
      out[k] = lsGet(k);
    }
    return const JsonEncoder.withIndent('  ').convert(out);
  }

  bool importJson(String text) {
    final dynamic data;
    try {
      data = jsonDecode(text);
    } catch (_) {
      return false;
    }
    if (data is! Map || !data.keys.any((k) => '$k'.startsWith('ht_'))) {
      return false;
    }
    data.forEach((key, value) {
      if (key is String && key.startsWith('ht_')) lsSet(key, value);
    });
    _migrate();
    _loadAll();
    i18n.load(lang);
    notifyListeners();
    return true;
  }
}

final store = Store();

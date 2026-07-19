// ── locales/en.dart — English (default) ──────────────────────────────
// Port of js/locales/en.js. HTML markup is stripped (native text).
// Keys are grouped by namespace: t('today.greeting_morning') etc.

const Map<String, Map<String, String>> en = {
  'nav': {
    'today': 'Today',
    'habits': 'Habits',
    'reflect': 'Reflect',
    'calm': 'Calm',
    'you': 'You',
  },

  'common': {
    'add': 'Add',
    'cancel': 'Cancel',
    'delete': 'Delete',
    'save': 'Save',
    'start': 'Start',
    'stop': 'Stop',
    'pause': 'Pause',
    'resume': 'Resume',
    'reset': 'Reset',
    'close': 'Close',
    'done': 'Done',
    'edit': 'Edit',
    'remove': 'Remove',
    'none': '— None —',
    'day_one': 'day',
    'day_other': 'days',
    'delete_confirm': 'Remove this habit? Your progress data is kept.',
  },

  'today': {
    'greeting_morning': 'Good morning',
    'greeting_afternoon': 'Good afternoon',
    'greeting_evening': 'Good evening',
    'affirm_all_done': 'Every habit tended. Rest easy tonight.',
    'affirm_none': 'A fresh, open day. Start wherever feels kind.',
    'affirm_progress': "You're moving gently through the day.",
    'ring_of': 'of',
    'habits_tended': '{done} of {total} habits tended today.',
    'habits_waiting': '{n} gently waiting.',
    'all_done': 'Beautifully done.',
    'section_habits': "TODAY'S HABITS",
    'no_habits': 'No daily habits yet — add one below.',
    'streak_badge': '{n}-day streak',
    'quickadd_ph': 'Add a habit for today…',
    'section_routine': 'ROUTINE',
    'routine_ph': "What's the block?",
    'no_blocks': 'No blocks yet — sketch out your day above.',
    'delete_block': 'Delete block',
    'section_wins': 'QUICK WINS',
    'add_task': '+ Add task',
    'task_ph': 'What needs to be done?',
    'filter_all': 'All',
    'filter_pending': 'Pending',
    'filter_done': 'Done',
    'no_tasks_done': 'No completed tasks yet.',
    'no_tasks_pending': 'No pending tasks — add one below.',
    'priority_high': 'High',
    'priority_med': 'Med',
    'priority_low': 'Low',
    'delete_task': 'Delete task',
    'effort_min': '{n} min',
  },

  'habits': {
    'title': 'Habits',
    'subtitle': 'Your rhythms',
    'tab_daily': 'Daily',
    'tab_weekly': 'Weekly',
    'tab_monthly': 'Monthly',
    'tab_quarterly': 'Quarterly',
    'tab_yearly': 'Yearly',
    'unit_daily': 'today',
    'unit_weekly': 'this week',
    'unit_monthly': 'this month',
    'unit_quarterly': 'this quarter',
    'unit_yearly': 'this year',
    'cap_done': 'Complete — lovely work {unit}',
    'cap_remaining': '{remaining} to go {unit}',
    'link_fed': '↗ fed by {label}',
    'summary': '{done}/{total} done',
    'no_habits': 'No {horizon} habits yet — add one below.',
    'add_habit': '+ Add habit',
    'add_goal': '+ Add goal',
    'habit_name': 'Habit name',
    'goal_name': 'Goal name',
    'type_checkbox': 'Checkbox',
    'type_counter': 'Counter',
    'target_week': 'Days/week',
    'target_month': 'Days/month',
    'target_quarter': 'Target/quarter',
    'target_year': 'Target/year',
    'max_label': 'Max',
  },

  'reflect': {
    'title': 'Reflect',
    'subtitle': 'Inner space',
    'tab_mood': 'Mood',
    'tab_journal': 'Journal',
    'tab_thoughts': 'Thoughts',
    'tab_inbox': 'Inbox',
  },

  'calm': {
    'title': 'Calm',
    'subtitle': 'A quiet moment',
  },

  'you': {
    'title': 'You',
    'subtitle': 'Your story',
    'tab_stats': 'Stats',
    'tab_settings': 'Settings',
    'section_backup': 'BACKUP',
    'btn_export': 'Copy backup JSON',
    'btn_import': 'Restore from JSON',
    'backup_hint':
        'All data stays on this device. Copy a JSON backup to keep it safe, '
            'or restore one here.',
    'backup_copied': 'Backup copied to clipboard ✓',
    'restore_ph': 'Paste backup JSON here…',
    'restore_done': 'Data restored ✓',
    'restore_bad': "That doesn't look like a valid backup",
  },

  'mood': {
    'label_1': 'Rough',
    'label_2': 'Low',
    'label_3': 'Okay',
    'label_4': 'Good',
    'label_5': 'Great',
    'header_base': 'Mood · Today',
    'header_scored': 'Mood · Today · {label}',
    'intro': "How are you feeling right now? One tap — there's no wrong answer.",
    'note_ph': 'Anything you want to note about today? (optional)',
    'trend_header': 'Last {n} days',
    'trend_avg_suffix': 'avg',
    'trend_logged': '{logged}/{total} days logged',
    'trend_none': 'Check in daily to start seeing your mood trend. 🌱',
    'trend_low':
        'Some heavy days lately — be gentle with yourself. Consider talking '
            'to someone at oppam.me. 💛',
    'trend_high': 'A brighter stretch — good to see. ✨',
    'trend_mid': 'Thanks for checking in — noticing is the first step. 🌱',
    'disclaimer':
        'A self-help tool, not a substitute for professional care. Mood '
            "tracking builds awareness but isn't a diagnosis. If you'd like to "
            'speak with a therapist, Oppam (oppam.me) offers 24×7 online '
            'counselling. In a crisis, reach Tele-MANAS 14416 (India, 24×7) or '
            'your local emergency number. Your check-ins stay private on this '
            'device.',
  },

  'journal': {
    'header_base': 'Journal · Today',
    'header_count': 'Journal · Today · {n}',
    'intro':
        'A few honest lines on what went well — and why — gently lifts mood '
            'over time.',
    'wins_title': 'What went well — and why?',
    'wins_ph': 'Something good that happened, and why it happened…',
    'wins_hint': 'The heart of the practice — name the good, then the cause.',
    'lows_title': 'One hard thing (optional)',
    'lows_ph': 'Name it gently — just once…',
    'lows_hint': 'Acknowledge it, then let it rest.',
    'growth_title': 'What might I learn or try next?',
    'growth_ph': 'A small step or insight for tomorrow…',
    'blank': "Nothing here yet — add when you're ready",
    'full': "That's plenty for today ✓",
    'past_days': 'Past days',
    'history_empty': 'Past reflections will appear here',
    'disclaimer':
        'A self-help tool, not a substitute for professional care. Journaling '
            "supports wellbeing but isn't therapy. If you'd like to speak with "
            'a therapist, Oppam (oppam.me) offers 24×7 online counselling. In '
            'a crisis, reach Tele-MANAS 14416 (India, 24×7) or your local '
            'emergency number. Your entries stay private on this device.',
  },

  'cbt': {
    'header_base': 'Thought records',
    'header_count': 'Thought records · {n}',
    'btn_new': '+ New record',
    'btn_close': 'Close',
    'btn_save': 'Save record',
    'intro':
        'Untangle a tough moment: name the thought, weigh it, and find a '
            'steadier one. Two frames — pick whichever fits.',
    'mode_beck': 'Thought record',
    'mode_abcde': 'ABC(DE)',
    'hint_beck':
        "Beck's 7-column worksheet — weigh the evidence for and against the "
            'thought.',
    'hint_abcde':
        'Ellis REBT — dispute the belief behind the feeling, then form an '
            'effective new one.',
    'beck_situation_label': 'Situation',
    'beck_situation_ph': 'What happened? Where and when?',
    'beck_thoughts_label': 'Automatic thought(s)',
    'beck_thoughts_ph': 'What went through your mind? What did it mean to you?',
    'beck_emotion_label': 'Emotion(s) & intensity now',
    'beck_evidence_for_label': 'Evidence for the thought',
    'beck_evidence_for_ph': 'Facts that seem to support the thought…',
    'beck_evidence_against_label': 'Evidence against the thought',
    'beck_evidence_against_ph':
        "Facts that don't fit it, or another way to see it…",
    'beck_balanced_label': 'Balanced / alternative thought',
    'beck_balanced_ph': 'A fairer, more rounded way to look at it…',
    'beck_after_label': 'Re-rate that emotion now',
    'abcde_situation_label': 'A · Activating event',
    'abcde_situation_ph':
        'What triggered this? The event or situation, just the facts.',
    'abcde_thoughts_label': 'B · Beliefs',
    'abcde_thoughts_ph':
        'What did you tell yourself about it? Your beliefs and self-talk.',
    'abcde_emotion_label': 'C · Consequences — emotion & intensity',
    'abcde_disp_label': 'D · Disputation',
    'abcde_disp_ph':
        'Challenge the belief — is it true? helpful? logical? What would you '
            'tell a friend?',
    'abcde_balanced_label': 'E · Effective new belief',
    'abcde_balanced_ph': 'A more useful, rational belief to carry forward.',
    'abcde_after_label': 'Re-rate that emotion now',
    'dist_header': 'Thinking patterns',
    'dist_hint': '— optional, tap any that fit',
    'dist_all_or_nothing_label': 'All-or-nothing',
    'dist_all_or_nothing_ex':
        'Seeing things in black-and-white — "If it\'s not perfect, I failed."',
    'dist_catastrophizing_label': 'Catastrophizing',
    'dist_catastrophizing_ex':
        'Expecting the worst — "This will be a total disaster."',
    'dist_overgeneralization_label': 'Overgeneralization',
    'dist_overgeneralization_ex':
        'One event becomes a never-ending pattern — "I always mess this up."',
    'dist_mental_filter_label': 'Mental filter',
    'dist_mental_filter_ex':
        'Dwelling on a single negative and ignoring the rest.',
    'dist_mind_reading_label': 'Mind-reading',
    'dist_mind_reading_ex':
        'Assuming you know what others think — "They think I\'m boring."',
    'dist_labeling_label': 'Labeling',
    'dist_labeling_ex':
        'Attaching a fixed label to yourself — "I\'m a loser."',
    'dist_emotional_reasoning_label': 'Emotional reasoning',
    'dist_emotional_reasoning_ex':
        'Treating a feeling as fact — "I feel useless, so I must be."',
    'dist_discounting_positive_label': 'Discounting the positive',
    'dist_discounting_positive_ex':
        'Brushing off good things — "That win doesn\'t count."',
    'dist_fortune_telling_label': 'Fortune-telling',
    'dist_fortune_telling_ex':
        'Predicting the future negatively — "I\'ll definitely fail."',
    'dist_personalization_label': 'Personalization',
    'dist_personalization_ex':
        'Blaming yourself for things outside your control.',
    'dist_should_statements_label': 'Should statements',
    'dist_should_statements_ex':
        'Rigid rules — "I should / must / have to…" that fuel guilt.',
    'dist_magnification_label': 'Magnification / minimization',
    'dist_magnification_ex': 'Blowing up flaws, shrinking strengths.',
    'dist_blaming_label': 'Blaming',
    'dist_blaming_ex':
        'Holding others wholly at fault, ignoring your part (or vice-versa).',
    'row_a': 'A · Activating event',
    'row_b': 'B · Beliefs',
    'row_thinking': 'Thinking patterns',
    'row_c': 'C · Consequences (before)',
    'row_d': 'D · Disputation',
    'row_e': 'E · Effective new belief',
    'row_situation': 'Situation',
    'row_thoughts': 'Automatic thought(s)',
    'row_emotion_before': 'Emotion (before)',
    'row_evidence_for': 'Evidence for',
    'row_evidence_against': 'Evidence against',
    'row_balanced': 'Balanced thought',
    'row_emotion_after': 'Emotion (after)',
    'foot_eased':
        'Nicely done — that emotion eased from {before}% to {after}%. 🌿',
    'foot_rose':
        "It rose a little ({before}% → {after}%). That's okay — naming it "
            'still helps. 💛',
    'foot_steady':
        'Held steady ({before}%). Some thoughts take more than one pass. 🌱',
    'empty': 'No thought records yet — start one when a moment feels heavy',
    'toast_empty': 'Add a situation or thought first',
    'toast_saved': 'Thought record saved ✓',
    'disclaimer':
        'A self-help tool, not a substitute for professional care. Thought '
            'records (CBT) and the ABC(DE) model (REBT) are self-help '
            "techniques, not therapy or diagnosis. If you'd like to speak "
            'with a therapist, Oppam (oppam.me) offers 24×7 online '
            'counselling. In a crisis, reach Tele-MANAS 14416 (India, 24×7) '
            'or your local emergency number. Your records stay private on '
            'this device.',
  },

  'mindfulness': {
    'title': 'Mindfulness',
    'intro':
        'A quiet moment for your breath. No streaks, no scores — just be here '
            'for a few cycles or a few minutes.',
    'breathing_title': 'Breathing pacer',
    'pat_box': 'Box · 4-4-4-4',
    'pat_478': '4-7-8',
    'phase_in': 'Breathe in',
    'phase_hold': 'Hold',
    'phase_out': 'Breathe out',
    'cycles_label': 'Cycles',
    'cycle_progress': 'Cycle {n} / {total}',
    'ready': 'Ready when you are.',
    'bf_done': 'Done — nicely paced. 🌿',
    'med_title': 'Meditation timer',
    'dur_min': '{n} min',
    'med_ready': "Tap Start when you're ready.",
    'med_started': 'Settle in… breathe naturally.',
    'med_paused': 'Paused — resume whenever.',
    'med_done': 'Session complete. Well done. 🌿',
  },

  'settings': {
    'title': 'SETTINGS',
    'section_theme': 'Theme',
    'theme_system': 'System',
    'theme_light': 'Light',
    'theme_dark': 'Dark',
    'section_language': 'Language',
    'lang_en': 'English',
    'lang_ml': 'മലയാളം',
    'reminders_note':
        'Reminders & notifications arrive in a later build of this app.',
  },

  'inbox': {
    'header_base': 'Inbox',
    'header_count': 'Inbox · {count}',
    'ph': 'Capture a thought or task…',
    'note_ph': 'Add a note…',
    'empty': 'Your inbox is empty — capture anything here',
    'convert': '→ Task',
    'converted': 'Added to Quick Wins ✓',
  },

  'stats': {
    'title': 'Stats',
    'empty': 'Add a daily habit to start tracking streaks & stats',
    'section_streaks': 'Streaks · Daily habits',
    'section_consistency': 'Consistency · Recent days',
    'section_heatmap': 'Heatmap · Recent months',
    'cur_streak': 'Current streak',
    'fire_icon_on': '🔥',
    'fire_icon_off': '🌱',
    'best': 'Best · {n}',
    'msg_begin': 'You hit {n} once — begin again 🌱',
    'msg_first': 'Every streak starts with day one 🌱',
    'msg_best': 'Best yet! 🎉',
    'msg_start': 'Off to a great start ✨',
    'msg_keep': 'Keep it going 💪',
    'window_30': '30 days',
    'window_90': '90 days',
    'legend_less': 'Less',
    'legend_more': 'More',
  },
};

// ── main.dart — bootstrap + 5-destination shell ──────────────────────
// Mirrors the web app: applyTheme → initLang → initSchema → loadAll →
// Today. The IndexedStack keeps every destination alive (Calm timers
// survive tab switches, like the calm.js re-render guard).
import 'package:flutter/material.dart';

import 'core/i18n.dart';
import 'core/store.dart';
import 'screens/calm_screen.dart';
import 'screens/habits_screen.dart';
import 'screens/reflect_screen.dart';
import 'screens/today_screen.dart';
import 'screens/you_screen.dart';
import 'theme/grove_theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await store.init();
  i18n.load(store.lang);
  runApp(const HabitApp());
}

class HabitApp extends StatelessWidget {
  const HabitApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: store,
      builder: (context, _) {
        final mode = switch (store.theme) {
          'light' => ThemeMode.light,
          'dark' => ThemeMode.dark,
          _ => ThemeMode.system,
        };
        return MaterialApp(
          title: 'Habit Tracker',
          debugShowCheckedModeBanner: false,
          theme: groveTheme(GroveColors.light, Brightness.light),
          darkTheme: groveTheme(GroveColors.dark, Brightness.dark),
          themeMode: mode,
          home: const Shell(),
        );
      },
    );
  }
}

class Shell extends StatefulWidget {
  const Shell({super.key});

  @override
  State<Shell> createState() => _ShellState();
}

class _ShellState extends State<Shell> {
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    // Listen here (not only at the MaterialApp level) and build the screens
    // non-const, so every store change re-renders the active destination.
    return ListenableBuilder(
      listenable: store,
      builder: (context, _) => Scaffold(
        body: IndexedStack(
          index: _tab,
          // ignore: prefer_const_literals_to_create_immutables
          children: [
            TodayScreen(),
            HabitsScreen(),
            ReflectScreen(),
            CalmScreen(),
            YouScreen(),
          ],
        ),
        bottomNavigationBar: _navBar(),
      ),
    );
  }

  Widget _navBar() {
    return NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (i) => setState(() => _tab = i),
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        height: 68,
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.wb_sunny_outlined),
            selectedIcon: const Icon(Icons.wb_sunny),
            label: t('nav.today'),
          ),
          NavigationDestination(
            icon: const Icon(Icons.check_circle_outline),
            selectedIcon: const Icon(Icons.check_circle),
            label: t('nav.habits'),
          ),
          NavigationDestination(
            icon: const Icon(Icons.menu_book_outlined),
            selectedIcon: const Icon(Icons.menu_book),
            label: t('nav.reflect'),
          ),
          NavigationDestination(
            icon: const Icon(Icons.air),
            selectedIcon: const Icon(Icons.air),
            label: t('nav.calm'),
          ),
          NavigationDestination(
            icon: const Icon(Icons.insights_outlined),
            selectedIcon: const Icon(Icons.insights),
            label: t('nav.you'),
          ),
        ],
    );
  }
}

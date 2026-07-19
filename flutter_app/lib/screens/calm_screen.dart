// ── calm_screen.dart — breathing pacer + meditation timer ────────────
// Port of views/mindfulness.js. Lives in an IndexedStack so switching
// tabs never destroys a running session (the calm.js guard, natively).
import 'dart:async';

import 'package:flutter/material.dart';

import '../core/i18n.dart';
import '../theme/grove_theme.dart';
import '../widgets/grove.dart';

class CalmScreen extends StatefulWidget {
  const CalmScreen({super.key});

  @override
  State<CalmScreen> createState() => _CalmScreenState();
}

class _PhaseSpec {
  final String key; // 'in' | 'hold' | 'out'
  final int seconds;
  const _PhaseSpec(this.key, this.seconds);
}

const _patterns = <String, List<_PhaseSpec>>{
  'box': [
    _PhaseSpec('in', 4),
    _PhaseSpec('hold', 4),
    _PhaseSpec('out', 4),
    _PhaseSpec('hold', 4),
  ],
  '478': [
    _PhaseSpec('in', 4),
    _PhaseSpec('hold', 7),
    _PhaseSpec('out', 8),
  ],
};

class _CalmScreenState extends State<CalmScreen> {
  // ── Breathing state ──
  String _pattern = 'box';
  int _cycles = 5;
  bool _running = false;
  bool _breathDone = false;
  int _phaseIdx = 0;
  int _phaseLeft = 0;
  int _cycle = 1;
  Timer? _breathTimer;

  // ── Meditation state ──
  int _durMin = 10;
  int _medLeft = 0;
  bool _medRunning = false;
  bool _medPaused = false;
  bool _medDone = false;
  Timer? _medTimer;

  @override
  void dispose() {
    _breathTimer?.cancel();
    _medTimer?.cancel();
    super.dispose();
  }

  // ── Breathing engine ─────────────────────────────────────────────
  List<_PhaseSpec> get _phases => _patterns[_pattern]!;

  void _startBreathing() {
    _breathTimer?.cancel();
    setState(() {
      _running = true;
      _breathDone = false;
      _phaseIdx = 0;
      _phaseLeft = _phases[0].seconds;
      _cycle = 1;
    });
    _breathTimer = Timer.periodic(const Duration(seconds: 1), (_) => _tick());
  }

  void _stopBreathing({bool done = false}) {
    _breathTimer?.cancel();
    _breathTimer = null;
    setState(() {
      _running = false;
      _breathDone = done;
    });
  }

  void _tick() {
    if (_phaseLeft > 1) {
      setState(() => _phaseLeft--);
      return;
    }
    // Advance phase
    if (_phaseIdx + 1 < _phases.length) {
      setState(() {
        _phaseIdx++;
        _phaseLeft = _phases[_phaseIdx].seconds;
      });
    } else if (_cycle < _cycles) {
      setState(() {
        _cycle++;
        _phaseIdx = 0;
        _phaseLeft = _phases[0].seconds;
      });
    } else {
      _stopBreathing(done: true);
    }
  }

  // ── Meditation engine ────────────────────────────────────────────
  void _startMed() {
    _medTimer?.cancel();
    setState(() {
      _medLeft = _durMin * 60;
      _medRunning = true;
      _medPaused = false;
      _medDone = false;
    });
    _medTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (_medPaused) return;
      if (_medLeft <= 1) {
        _medTimer?.cancel();
        _medTimer = null;
        setState(() {
          _medLeft = 0;
          _medRunning = false;
          _medDone = true;
        });
      } else {
        setState(() => _medLeft--);
      }
    });
  }

  void _resetMed() {
    _medTimer?.cancel();
    _medTimer = null;
    setState(() {
      _medRunning = false;
      _medPaused = false;
      _medDone = false;
      _medLeft = 0;
    });
  }

  @override
  Widget build(BuildContext context) {
    final g = gc(context);
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
        children: [
          ScreenHeader(eyebrow: t('calm.title'), title: t('calm.subtitle')),
          const SizedBox(height: 8),
          Text(t('mindfulness.intro'),
              style: TextStyle(color: g.ink2, fontSize: 13.5, height: 1.4)),
          const SizedBox(height: 20),
          _breathingCard(g),
          const SizedBox(height: 20),
          _meditationCard(g),
        ],
      ),
    );
  }

  // ── Breathing UI ─────────────────────────────────────────────────
  Widget _breathingCard(GroveColors g) {
    final phase = _phases[_phaseIdx];
    final double scale =
        !_running ? 0.72 : (phase.key == 'in' ? 1.0 : phase.key == 'out' ? 0.62 : _scaleHold());
    final String caption;
    if (_running) {
      caption = t('mindfulness.cycle_progress', {'n': _cycle, 'total': _cycles});
    } else if (_breathDone) {
      caption = t('mindfulness.bf_done');
    } else {
      caption = t('mindfulness.ready');
    }

    return GroveCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Eyebrow(t('mindfulness.breathing_title')),
          const SizedBox(height: 12),
          GroveSeg(
            options: [t('mindfulness.pat_box'), t('mindfulness.pat_478')],
            value: _pattern == 'box' ? 0 : 1,
            onChanged: _running
                ? (_) {}
                : (i) => setState(() => _pattern = i == 0 ? 'box' : '478'),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Text('${t('mindfulness.cycles_label')}:',
                  style: TextStyle(fontSize: 12.5, color: g.ink2)),
              const SizedBox(width: 8),
              for (final n in [3, 5, 10])
                Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: ChoiceChip(
                    label: Text('$n'),
                    selected: _cycles == n,
                    selectedColor: g.lavenderSoft,
                    onSelected:
                        _running ? null : (_) => setState(() => _cycles = n),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 18),
          Center(
            child: SizedBox(
              width: 170,
              height: 170,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  AnimatedScale(
                    scale: scale,
                    duration: Duration(
                        seconds: _running ? phase.seconds : 1),
                    curve: Curves.easeInOut,
                    child: Container(
                      width: 160,
                      height: 160,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: g.lavenderSoft,
                        border: Border.all(color: g.lavender, width: 2),
                      ),
                    ),
                  ),
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        _running
                            ? t('mindfulness.phase_${phase.key}')
                            : t('mindfulness.breathing_title'),
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: g.lavenderDeep,
                        ),
                      ),
                      if (_running)
                        Text('$_phaseLeft',
                            style: TextStyle(
                              fontSize: 26,
                              fontWeight: FontWeight.w700,
                              color: g.ink,
                            )),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Center(
            child: Text(caption,
                style: TextStyle(fontSize: 13, color: g.ink2)),
          ),
          const SizedBox(height: 12),
          Center(
            child: GroveButton(
              _running ? t('common.stop') : t('common.start'),
              onTap: _running ? _stopBreathing : _startBreathing,
            ),
          ),
        ],
      ),
    );
  }

  double _scaleHold() {
    // Hold keeps the size of the phase it follows (after in → big, after out → small).
    var prev = _phaseIdx - 1;
    if (prev < 0) prev = _phases.length - 1;
    return _phases[prev].key == 'in' ? 1.0 : 0.62;
  }

  // ── Meditation UI ────────────────────────────────────────────────
  Widget _meditationCard(GroveColors g) {
    final String msg;
    if (_medDone) {
      msg = t('mindfulness.med_done');
    } else if (_medRunning && _medPaused) {
      msg = t('mindfulness.med_paused');
    } else if (_medRunning) {
      msg = t('mindfulness.med_started');
    } else {
      msg = t('mindfulness.med_ready');
    }
    final left = _medRunning || _medPaused ? _medLeft : _durMin * 60;
    final mm = (left ~/ 60).toString().padLeft(2, '0');
    final ss = (left % 60).toString().padLeft(2, '0');

    return GroveCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Eyebrow(t('mindfulness.med_title')),
          const SizedBox(height: 12),
          Wrap(
            spacing: 6,
            children: [
              for (final n in [5, 10, 15, 20])
                ChoiceChip(
                  label: Text(t('mindfulness.dur_min', {'n': n})),
                  selected: _durMin == n,
                  selectedColor: g.lavenderSoft,
                  onSelected:
                      _medRunning ? null : (_) => setState(() => _durMin = n),
                ),
            ],
          ),
          const SizedBox(height: 16),
          Center(
            child: Text(
              '$mm:$ss',
              style: TextStyle(
                fontSize: 44,
                fontWeight: FontWeight.w700,
                color: g.ink,
                fontFeatures: const [FontFeature.tabularFigures()],
              ),
            ),
          ),
          const SizedBox(height: 6),
          Center(
            child:
                Text(msg, style: TextStyle(fontSize: 13, color: g.ink2)),
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (!_medRunning)
                GroveButton(t('common.start'), onTap: _startMed)
              else ...[
                GroveButton(
                  _medPaused ? t('common.resume') : t('common.pause'),
                  onTap: () => setState(() => _medPaused = !_medPaused),
                ),
                const SizedBox(width: 8),
                GroveButton(t('common.reset'), subtle: true, onTap: _resetMed),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

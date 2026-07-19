// ── progress_ring.dart — the Today hero ring (.ring) ─────────────────
import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/grove_theme.dart';

class ProgressRing extends StatelessWidget {
  final double fraction;
  final double size;
  final Widget child;
  const ProgressRing({
    super.key,
    required this.fraction,
    required this.child,
    this.size = 132,
  });

  @override
  Widget build(BuildContext context) {
    final g = gc(context);
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _RingPainter(
          fraction: fraction.clamp(0.0, 1.0),
          track: g.paperSunk,
          fill: g.sage,
        ),
        child: Center(child: child),
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  final double fraction;
  final Color track;
  final Color fill;
  _RingPainter({required this.fraction, required this.track, required this.fill});

  @override
  void paint(Canvas canvas, Size size) {
    const stroke = 10.0;
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.shortestSide - stroke) / 2;

    final trackPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..color = track;
    canvas.drawCircle(center, radius, trackPaint);

    if (fraction > 0) {
      final fillPaint = Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = stroke
        ..strokeCap = StrokeCap.round
        ..color = fill;
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        -math.pi / 2,
        2 * math.pi * fraction,
        false,
        fillPaint,
      );
    }
  }

  @override
  bool shouldRepaint(_RingPainter old) =>
      old.fraction != fraction || old.track != track || old.fill != fill;
}

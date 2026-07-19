// ── grove.dart — shared Grove UI components ──────────────────────────
// Flutter counterparts of .grv-card, .grv-check, .grv-seg, .grv-progress,
// the section eyebrows and screen headers from the web design system.
import 'package:flutter/material.dart';

import '../theme/grove_theme.dart';

class GroveCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final bool done;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;

  const GroveCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(14),
    this.done = false,
    this.onTap,
    this.onLongPress,
  });

  @override
  Widget build(BuildContext context) {
    final g = gc(context);
    return Material(
      color: done ? g.sageSoft : g.surface,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        onLongPress: onLongPress,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          width: double.infinity,
          padding: padding,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: done ? g.sageSoft : g.line),
          ),
          child: child,
        ),
      ),
    );
  }
}

/// Small uppercase letter-spaced section label (.sec-eyebrow).
class Eyebrow extends StatelessWidget {
  final String text;
  final Widget? trailing;
  const Eyebrow(this.text, {super.key, this.trailing});

  @override
  Widget build(BuildContext context) {
    final g = gc(context);
    final label = Text(
      text.toUpperCase(),
      style: TextStyle(
        fontSize: 11.5,
        fontWeight: FontWeight.w700,
        letterSpacing: 1.4,
        color: g.ink3,
      ),
    );
    if (trailing == null) return label;
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [label, trailing!],
    );
  }
}

/// Big serif screen header (.scr-head / .scr-greet).
class ScreenHeader extends StatelessWidget {
  final String eyebrow;
  final String title;
  const ScreenHeader({super.key, required this.eyebrow, required this.title});

  @override
  Widget build(BuildContext context) {
    final g = gc(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Eyebrow(eyebrow),
        const SizedBox(height: 6),
        Text(
          title,
          style: TextStyle(
            fontFamily: 'serif',
            fontSize: 30,
            height: 1.15,
            fontWeight: FontWeight.w500,
            color: g.ink,
          ),
        ),
      ],
    );
  }
}

/// Segmented control (.grv-seg).
class GroveSeg extends StatelessWidget {
  final List<String> options;
  final int value;
  final ValueChanged<int> onChanged;
  const GroveSeg({
    super.key,
    required this.options,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final g = gc(context);
    return Container(
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: g.paperSunk,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        children: [
          for (var i = 0; i < options.length; i++)
            Expanded(
              child: GestureDetector(
                onTap: () => onChanged(i),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  decoration: BoxDecoration(
                    color: i == value ? g.surface : Colors.transparent,
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(
                      color: i == value ? g.line2 : Colors.transparent,
                    ),
                  ),
                  child: Text(
                    options[i],
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 12.5,
                      fontWeight:
                          i == value ? FontWeight.w700 : FontWeight.w500,
                      color: i == value ? g.ink : g.ink2,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// Round completion check (.grv-check--round).
class RoundCheck extends StatelessWidget {
  final bool on;
  final VoidCallback onTap;
  final double size;
  const RoundCheck({
    super.key,
    required this.on,
    required this.onTap,
    this.size = 30,
  });

  @override
  Widget build(BuildContext context) {
    final g = gc(context);
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: on ? g.sage : Colors.transparent,
          border: Border.all(color: on ? g.sage : g.line2, width: 1.8),
        ),
        child: on
            ? Icon(Icons.check_rounded, size: size * 0.62, color: g.inkInverse)
            : null,
      ),
    );
  }
}

/// Slim progress bar (.grv-progress); [honey] switches the fill tone.
class GroveProgressBar extends StatelessWidget {
  final double fraction;
  final bool honey;
  const GroveProgressBar({
    super.key,
    required this.fraction,
    this.honey = false,
  });

  @override
  Widget build(BuildContext context) {
    final g = gc(context);
    return ClipRRect(
      borderRadius: BorderRadius.circular(999),
      child: Container(
        height: 7,
        color: g.paperSunk,
        child: FractionallySizedBox(
          alignment: Alignment.centerLeft,
          widthFactor: fraction.clamp(0.0, 1.0),
          child: Container(color: honey ? g.honey : g.sage),
        ),
      ),
    );
  }
}

/// Muted centred empty-state line (.empty).
class EmptyState extends StatelessWidget {
  final String text;
  const EmptyState(this.text, {super.key});

  @override
  Widget build(BuildContext context) {
    final g = gc(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 8),
      child: Center(
        child: Text(
          text,
          textAlign: TextAlign.center,
          style: TextStyle(
            color: g.ink3,
            fontSize: 13.5,
            fontStyle: FontStyle.italic,
          ),
        ),
      ),
    );
  }
}

/// Soft rounded primary button (.grv-btn).
class GroveButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  final bool subtle;
  const GroveButton(this.label, {super.key, required this.onTap, this.subtle = false});

  @override
  Widget build(BuildContext context) {
    final g = gc(context);
    return Material(
      color: subtle ? g.surface2 : g.sage,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: subtle ? g.line : g.sage),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 13.5,
              fontWeight: FontWeight.w700,
              color: subtle ? g.ink2 : g.inkInverse,
            ),
          ),
        ),
      ),
    );
  }
}

/// Small circular −/+ stepper button.
class StepBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const StepBtn(this.icon, {super.key, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final g = gc(context);
    return Material(
      color: g.surface2,
      shape: const CircleBorder(),
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: Container(
          width: 32,
          height: 32,
          alignment: Alignment.center,
          child: Icon(icon, size: 18, color: g.ink2),
        ),
      ),
    );
  }
}

void toast(BuildContext context, String message) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(message)));
}

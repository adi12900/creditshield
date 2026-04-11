import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_typography.dart';

enum CsButtonVariant { primary, secondary }

// ─── Primary / Secondary Button ───────────────────────────────────────────────
class CsButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final CsButtonVariant variant;
  final bool isLoading;
  final double? width;
  final IconData? icon;

  const CsButton({
    super.key,
    required this.label,
    this.onPressed,
    this.variant = CsButtonVariant.primary,
    this.isLoading = false,
    this.width,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final sec = isDark ? AppColors.secondaryDark : AppColors.secondary;

    Widget child = isLoading
        ? const SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
          )
        : Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[Icon(icon, size: 18), const SizedBox(width: 6)],
              Text(label, style: AppTypography.buttonLabel),
            ],
          );

    if (variant == CsButtonVariant.primary) {
      return Semantics(
        button: true,
        label: label,
        child: SizedBox(
          width: width ?? double.infinity,
          height: 52,
          child: ElevatedButton(
            onPressed: isLoading ? null : onPressed,
            style: ElevatedButton.styleFrom(
              backgroundColor: sec,
              foregroundColor: Colors.white,
              elevation: 0,
              shadowColor: Colors.transparent,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: child,
          ),
        ),
      );
    }
    return Semantics(
      button: true,
      label: label,
      child: SizedBox(
        width: width ?? double.infinity,
        height: 52,
        child: OutlinedButton(
          onPressed: isLoading ? null : onPressed,
          style: OutlinedButton.styleFrom(
            foregroundColor: sec,
            side: BorderSide(color: sec, width: 1.5),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
          child: child,
        ),
      ),
    );
  }
}

// ─── Card ─────────────────────────────────────────────────────────────────────
class CsCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets? padding;
  final VoidCallback? onTap;
  final Color? color;

  const CsCard({super.key, required this.child, this.padding, this.onTap, this.color});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = color ?? (isDark ? AppColors.cardDark : AppColors.cardLight);
    final border = isDark ? AppColors.borderDark : AppColors.borderLight;

    return Semantics(
      container: true,
      child: Material(
        color: bg,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: border, width: 1),
            ),
            padding: padding ?? const EdgeInsets.all(AppSpacing.sm),
            child: child,
          ),
        ),
      ),
    );
  }
}

// ─── Glassmorphic Card (for modals / floating overlays only) ──────────────────
class CsGlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets? padding;

  const CsGlassCard({super.key, required this.child, this.padding});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: Container(
        decoration: BoxDecoration(
          color: isDark
              ? Colors.white.withValues(alpha: 0.06)
              : Colors.white.withValues(alpha: 0.70),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: Colors.white.withValues(alpha: 0.20),
            width: 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.08),
              blurRadius: 20,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        padding: padding ?? const EdgeInsets.all(AppSpacing.sm),
        child: child,
      ),
    );
  }
}

// ─── Input Field ──────────────────────────────────────────────────────────────
class CsInputField extends StatelessWidget {
  final String label;
  final String? hint;
  final String? errorText;
  final TextEditingController? controller;
  final TextInputType keyboardType;
  final bool enabled;
  final bool obscureText;
  final Widget? suffixIcon;
  final Widget? prefixIcon;
  final int? maxLines;
  final void Function(String)? onChanged;

  const CsInputField({
    super.key,
    required this.label,
    this.hint,
    this.errorText,
    this.controller,
    this.keyboardType = TextInputType.text,
    this.enabled = true,
    this.obscureText = false,
    this.suffixIcon,
    this.prefixIcon,
    this.maxLines = 1,
    this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final muted = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: Text(label,
                style: AppTypography.caption.copyWith(
                  color: muted,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.3,
                )),
          ),
        Semantics(
          textField: true,
          label: label,
          child: TextFormField(
            controller: controller,
            keyboardType: keyboardType,
            enabled: enabled,
            obscureText: obscureText,
            maxLines: maxLines,
            onChanged: onChanged,
            style: AppTypography.body.copyWith(
              color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
            ),
            decoration: InputDecoration(
              hintText: hint,
              errorText: errorText,
              suffixIcon: suffixIcon,
              prefixIcon: prefixIcon,
              filled: true,
              fillColor: enabled
                  ? (isDark ? AppColors.surfaceDark : AppColors.backgroundLight)
                  : (isDark ? AppColors.disabledBgDark : const Color(0xFFF8F9FA)),
            ),
          ),
        ),
      ],
    );
  }
}

// ─── Step Indicator ───────────────────────────────────────────────────────────
class CsStepIndicator extends StatelessWidget {
  final int currentStep;
  final int totalSteps;
  final String? estimatedTime;

  const CsStepIndicator({
    super.key,
    required this.currentStep,
    required this.totalSteps,
    this.estimatedTime,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final secondary = isDark ? AppColors.secondaryDark : AppColors.secondary;
    final muted = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    return Semantics(
      label: 'Step $currentStep of $totalSteps',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: secondary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text('Step $currentStep of $totalSteps',
                    style: AppTypography.caption.copyWith(
                      color: secondary,
                      fontWeight: FontWeight.w700,
                    )),
              ),
              const Spacer(),
              if (estimatedTime != null)
                Row(
                  children: [
                    Icon(Icons.access_time_outlined, size: 12, color: muted),
                    const SizedBox(width: 4),
                    Text(estimatedTime!,
                        style: AppTypography.caption.copyWith(color: muted)),
                  ],
                ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: List.generate(totalSteps, (i) {
              final done = i < currentStep - 1;
              final active = i == currentStep - 1;
              return Expanded(
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  margin: const EdgeInsets.only(right: 4),
                  height: 4,
                  decoration: BoxDecoration(
                    color: done
                        ? secondary
                        : active
                            ? secondary.withValues(alpha: 0.7)
                            : muted.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
}

// ─── Shimmer Loader ───────────────────────────────────────────────────────────
class CsShimmerLoader extends StatefulWidget {
  final double width;
  final double height;
  final double borderRadius;

  const CsShimmerLoader({
    super.key,
    required this.width,
    required this.height,
    this.borderRadius = 8,
  });

  @override
  State<CsShimmerLoader> createState() => _CsShimmerLoaderState();
}

class _CsShimmerLoaderState extends State<CsShimmerLoader>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200))
      ..repeat();
    _anim = Tween<double>(begin: -1, end: 2)
        .animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final base = isDark ? AppColors.shimmerBaseDark : AppColors.shimmerBaseLight;
    final hi = isDark ? AppColors.shimmerHighDark : AppColors.shimmerHighLight;

    return AnimatedBuilder(
      animation: _anim,
      builder: (_, __) => Container(
        width: widget.width,
        height: widget.height,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(widget.borderRadius),
          gradient: LinearGradient(
            colors: [base, hi, base],
            stops: [
              (_anim.value - 1).clamp(0.0, 1.0),
              _anim.value.clamp(0.0, 1.0),
              (_anim.value + 1).clamp(0.0, 1.0),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Empty State ──────────────────────────────────────────────────────────────
class CsEmptyState extends StatelessWidget {
  final IconData icon;
  final String heading;
  final String message;
  final String? ctaLabel;
  final VoidCallback? onCta;

  const CsEmptyState({
    super.key,
    required this.icon,
    required this.heading,
    required this.message,
    this.ctaLabel,
    this.onCta,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final muted = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final secondary = isDark ? AppColors.secondaryDark : AppColors.secondary;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: secondary.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 48, color: secondary.withValues(alpha: 0.6)),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(heading, style: AppTypography.subheading, textAlign: TextAlign.center),
            const SizedBox(height: AppSpacing.xs),
            Text(message,
                style: AppTypography.body.copyWith(color: muted),
                textAlign: TextAlign.center),
            if (ctaLabel != null) ...[
              const SizedBox(height: AppSpacing.md),
              CsButton(label: ctaLabel!, onPressed: onCta, width: 200),
            ],
          ],
        ),
      ),
    );
  }
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
class CsTooltip extends StatelessWidget {
  final String term;
  final String explanation;

  const CsTooltip({super.key, required this.term, required this.explanation});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final secondary = isDark ? AppColors.secondaryDark : AppColors.secondary;
    return Tooltip(
      message: explanation,
      triggerMode: TooltipTriggerMode.tap,
      child: Semantics(
        label: 'Help: $term',
        button: true,
        child: Icon(Icons.info_outlined, size: 18, color: secondary),
      ),
    );
  }
}

// ─── Offline Banner ───────────────────────────────────────────────────────────
class CsOfflineBanner extends StatelessWidget {
  const CsOfflineBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'No Internet Connection — Offline Mode',
      child: Container(
        width: double.infinity,
        color: AppColors.warning,
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
        child: Row(
          children: [
            const Icon(Icons.wifi_off_rounded, color: Colors.white, size: 16),
            const SizedBox(width: 8),
            Flexible(
              child: Text('No Internet — Offline Mode',
                  style: AppTypography.caption.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  )),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Network Error ────────────────────────────────────────────────────────────
class CsNetworkError extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const CsNetworkError({super.key, required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.error.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.error.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: AppColors.error, size: 18),
          const SizedBox(width: 8),
          Expanded(
              child: Text(message,
                  style: AppTypography.caption.copyWith(color: AppColors.error))),
          Semantics(
            button: true,
            label: 'Retry',
            child: IconButton(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded, color: AppColors.error, size: 20),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── No Offers State ──────────────────────────────────────────────────────────
class CsNoOffersState extends StatelessWidget {
  final VoidCallback? onReapply;
  const CsNoOffersState({super.key, this.onReapply});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final secondary = isDark ? AppColors.secondaryDark : AppColors.secondary;
    final muted = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: muted.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.inbox_outlined, size: 52, color: muted),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text('No Offers Available',
                style: AppTypography.subheading, textAlign: TextAlign.center),
            const SizedBox(height: 8),
            Text(
              'No lenders matched your profile right now. Here\'s what you can do:',
              style: AppTypography.body.copyWith(color: muted),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.sm),
            _Tip(Icons.trending_up, 'Improve income documentation to increase eligibility.', secondary),
            _Tip(Icons.account_balance_wallet_outlined, 'Reduce existing debt before reapplying.', secondary),
            const SizedBox(height: AppSpacing.md),
            CsButton(label: 'Reapply after 30 days', onPressed: onReapply),
          ],
        ),
      ),
    );
  }
}

class _Tip extends StatelessWidget {
  final IconData icon;
  final String text;
  final Color secondary;
  const _Tip(this.icon, this.text, this.secondary);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: secondary),
          const SizedBox(width: 8),
          Expanded(child: Text(text, style: AppTypography.caption)),
        ],
      ),
    );
  }
}

// ─── Expired Application ──────────────────────────────────────────────────────
class CsExpiredApplication extends StatelessWidget {
  final String reason;
  final VoidCallback? onStartNew;
  const CsExpiredApplication({super.key, required this.reason, this.onStartNew});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final muted = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: AppColors.error.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.timer_off_outlined, size: 52, color: AppColors.error),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text('Application Expired',
                style: AppTypography.subheading, textAlign: TextAlign.center),
            const SizedBox(height: 8),
            Text(reason,
                style: AppTypography.body.copyWith(color: muted),
                textAlign: TextAlign.center),
            const SizedBox(height: AppSpacing.md),
            CsButton(label: 'Start New Application', onPressed: onStartNew),
          ],
        ),
      ),
    );
  }
}

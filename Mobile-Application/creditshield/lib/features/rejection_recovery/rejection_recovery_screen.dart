import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../core/design_system/components/cs_components.dart';

class RejectionRecoveryScreen extends StatelessWidget {
  const RejectionRecoveryScreen({super.key});

  static const _reasons = [
    {
      'icon': Icons.trending_down,
      'label': 'Irregular Income',
      'desc': 'Your income appears irregular over the last 3 months.',
      'impact': 0.7,
    },
    {
      'icon': Icons.history,
      'label': 'Short Credit History',
      'desc': 'Your credit history is less than 12 months old.',
      'impact': 0.5,
    },
    {
      'icon': Icons.account_balance_wallet_outlined,
      'label': 'High Debt Ratio',
      'desc': 'Your existing EMIs exceed 40% of your monthly income.',
      'impact': 0.4,
    },
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final secondary = isDark ? AppColors.secondaryDark : AppColors.secondary;
    final muted = isDark
        ? AppColors.textSecondaryDark
        : AppColors.textSecondaryLight;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, size: 20),
          onPressed: () => context.pop(),
        ),
        title: const Text('Application Update'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.sm),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Non-alarming rejection message
              Container(
                padding: const EdgeInsets.all(AppSpacing.sm),
                decoration: BoxDecoration(
                  color: AppColors.warning.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: AppColors.warning.withValues(alpha: 0.3),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(
                          Icons.info_outline,
                          color: AppColors.warning,
                          size: 24,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'We couldn\'t approve this application',
                          style: AppTypography.subheading.copyWith(
                            color: AppColors.warning,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Don\'t worry — this is not a permanent decision. Many borrowers get approved after making a few improvements.',
                      style: AppTypography.body.copyWith(color: muted),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              Text('What can I improve?', style: AppTypography.subheading),
              const SizedBox(height: 12),
              // Bar chart of factors
              ..._reasons.map(
                (r) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            r['icon'] as IconData,
                            size: 16,
                            color: AppColors.warning,
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              r['label'] as String,
                              style: AppTypography.body.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          Text(
                            '${((r['impact'] as double) * 100).toInt()}% impact',
                            style: AppTypography.caption.copyWith(color: muted),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: r['impact'] as double,
                          backgroundColor: AppColors.warning.withValues(
                            alpha: 0.15,
                          ),
                          valueColor: const AlwaysStoppedAnimation<Color>(
                            AppColors.warning,
                          ),
                          minHeight: 8,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        r['desc'] as String,
                        style: AppTypography.caption.copyWith(color: muted),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              Text('What you can do next', style: AppTypography.subheading),
              const SizedBox(height: 12),
              _RecoveryOption(
                icon: Icons.remove_circle_outline,
                title: 'Apply with a lower amount',
                desc:
                    'Try ₹25,000 (50% of your original request) — higher approval chances.',
                secondary: secondary,
                isDark: isDark,
                onTap: () => context.push('/loan-application/personal'),
              ),
              const SizedBox(height: 10),
              _RecoveryOption(
                icon: Icons.swap_horiz,
                title: 'Review your application status',
                desc: 'Open your tracker to see the next required step.',
                secondary: secondary,
                isDark: isDark,
                onTap: () => context.push('/loan-tracker'),
              ),
              const SizedBox(height: 10),
              _RecoveryOption(
                icon: Icons.calendar_today_outlined,
                title: 'Reapply later',
                desc:
                    'Suggested reapplication date: 12 April 2025 (after 3 months).',
                secondary: secondary,
                isDark: isDark,
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Reminder set for 12 April 2025'),
                    ),
                  );
                },
              ),
              const SizedBox(height: AppSpacing.md),
              CsButton(
                label: 'Back to Home',
                variant: CsButtonVariant.secondary,
                onPressed: () => context.go('/home'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RecoveryOption extends StatelessWidget {
  final IconData icon;
  final String title;
  final String desc;
  final Color secondary;
  final bool isDark;
  final VoidCallback onTap;

  const _RecoveryOption({
    required this.icon,
    required this.title,
    required this.desc,
    required this.secondary,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isDark ? AppColors.cardDark : AppColors.cardLight,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isDark ? AppColors.borderDark : AppColors.borderLight,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: secondary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: secondary, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppTypography.body.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    desc,
                    style: AppTypography.caption.copyWith(
                      color: isDark
                          ? AppColors.textSecondaryDark
                          : AppColors.textSecondaryLight,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.arrow_forward_ios,
              size: 16,
              color: isDark
                  ? AppColors.textSecondaryDark
                  : AppColors.textSecondaryLight,
            ),
          ],
        ),
      ),
    );
  }
}

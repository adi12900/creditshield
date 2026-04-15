import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../core/design_system/components/cs_components.dart';

class LoanDashboardScreen extends StatelessWidget {
  const LoanDashboardScreen({super.key});

  static const _emis = [
    {
      'no': 1,
      'date': '12 Feb 2025',
      'amount': 4428,
      'status': 'paid',
      'paidOn': '10 Feb 2025',
    },
    {
      'no': 2,
      'date': '12 Mar 2025',
      'amount': 4428,
      'status': 'paid',
      'paidOn': '11 Mar 2025',
    },
    {
      'no': 3,
      'date': '12 Apr 2025',
      'amount': 4428,
      'status': 'upcoming',
      'paidOn': null,
    },
    {
      'no': 4,
      'date': '12 May 2025',
      'amount': 4428,
      'status': 'upcoming',
      'paidOn': null,
    },
    {
      'no': 5,
      'date': '12 Jun 2025',
      'amount': 4428,
      'status': 'upcoming',
      'paidOn': null,
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
        title: const Text('Loan Dashboard'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.sm),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Active loan card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(AppSpacing.sm),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [AppColors.primary, Color(0xFF1A4A7A)],
                  ),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          'HDFC Bank',
                          style: AppTypography.body.copyWith(
                            color: Colors.white.withValues(alpha: 0.8),
                          ),
                        ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.success.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            'Active',
                            style: AppTypography.caption.copyWith(
                              color: AppColors.success,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Personal Loan',
                      style: AppTypography.subheading.copyWith(
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        _LoanStat(
                          'Sanctioned',
                          '₹50,000',
                          Colors.white,
                          Colors.white70,
                        ),
                        _LoanStat(
                          'Outstanding',
                          '₹41,144',
                          Colors.white,
                          Colors.white70,
                        ),
                        _LoanStat(
                          'Paid',
                          '₹8,856',
                          Colors.white,
                          Colors.white70,
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: 8856 / 53136,
                        backgroundColor: Colors.white.withValues(alpha: 0.2),
                        valueColor: const AlwaysStoppedAnimation<Color>(
                          AppColors.secondary,
                        ),
                        minHeight: 6,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '17% repaid',
                      style: AppTypography.caption.copyWith(
                        color: Colors.white70,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              // Next EMI reminder
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.warning.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: AppColors.warning.withValues(alpha: 0.3),
                  ),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.notifications_active_outlined,
                      color: AppColors.warning,
                      size: 20,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Next EMI Due in 5 days',
                            style: AppTypography.body.copyWith(
                              color: AppColors.warning,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          Text(
                            '₹4,428 due on 12 Apr 2025',
                            style: AppTypography.caption.copyWith(color: muted),
                          ),
                        ],
                      ),
                    ),
                    ElevatedButton(
                      onPressed: () {},
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.warning,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 8,
                        ),
                        minimumSize: Size.zero,
                        textStyle: AppTypography.caption,
                      ),
                      child: const Text('Pay Now'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              // Credit profile summary
              Text('Credit Profile', style: AppTypography.subheading),
              const SizedBox(height: 12),
              CsCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Profile Status',
                                style: AppTypography.caption.copyWith(
                                  color: muted,
                                ),
                              ),
                              Text(
                                'Healthy',
                                style: AppTypography.heading.copyWith(
                                  color: secondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.success.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.verified,
                                color: AppColors.success,
                                size: 16,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                'On track',
                                style: AppTypography.caption.copyWith(
                                  color: AppColors.success,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Keep paying on time to maintain a healthy profile.',
                      style: AppTypography.body.copyWith(color: muted),
                    ),
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: 0.78,
                        backgroundColor: secondary.withValues(alpha: 0.15),
                        valueColor: AlwaysStoppedAnimation<Color>(secondary),
                        minHeight: 8,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Consistent payments improve your profile over time.',
                      style: AppTypography.caption.copyWith(
                        color: AppColors.success,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              Text('EMI Schedule', style: AppTypography.subheading),
              const SizedBox(height: 12),
              ..._emis.map(
                (emi) => _EmiRow(
                  emi: emi,
                  secondary: secondary,
                  muted: muted,
                  isDark: isDark,
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              CsButton(
                label: 'View Full Repayment History',
                variant: CsButtonVariant.secondary,
                onPressed: () {},
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LoanStat extends StatelessWidget {
  final String label;
  final String value;
  final Color valueColor;
  final Color labelColor;

  const _LoanStat(this.label, this.value, this.valueColor, this.labelColor);

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Text(label, style: AppTypography.caption.copyWith(color: labelColor)),
          const SizedBox(height: 2),
          Text(
            value,
            style: AppTypography.body.copyWith(
              color: valueColor,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _EmiRow extends StatelessWidget {
  final Map emi;
  final Color secondary;
  final Color muted;
  final bool isDark;

  const _EmiRow({
    required this.emi,
    required this.secondary,
    required this.muted,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final status = emi['status'] as String;
    final isPaid = status == 'paid';
    final isOverdue = status == 'overdue';

    Color statusColor = isPaid
        ? AppColors.success
        : (isOverdue ? AppColors.error : muted);
    IconData statusIcon = isPaid
        ? Icons.check_circle
        : (isOverdue ? Icons.error_outline : Icons.schedule);

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? AppColors.cardDark : AppColors.cardLight,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isOverdue
              ? AppColors.error.withValues(alpha: 0.3)
              : (isDark ? AppColors.borderDark : AppColors.borderLight),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                '${emi['no']}',
                style: AppTypography.caption.copyWith(
                  color: statusColor,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'EMI ${emi['no']} — ${emi['date']}',
                  style: AppTypography.body.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (isPaid && emi['paidOn'] != null)
                  Text(
                    'Paid on ${emi['paidOn']}',
                    style: AppTypography.caption.copyWith(color: muted),
                  ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '₹${emi['amount']}',
                style: AppTypography.body.copyWith(fontWeight: FontWeight.w700),
              ),
              Row(
                children: [
                  Icon(statusIcon, size: 12, color: statusColor),
                  const SizedBox(width: 3),
                  Text(
                    isPaid ? 'Paid' : (isOverdue ? 'Overdue' : 'Upcoming'),
                    style: AppTypography.caption.copyWith(
                      color: statusColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../core/design_system/components/cs_components.dart';

class RbiComplianceScreen extends StatefulWidget {
  const RbiComplianceScreen({super.key});

  @override
  State<RbiComplianceScreen> createState() => _RbiComplianceScreenState();
}

class _RbiComplianceScreenState extends State<RbiComplianceScreen> {
  bool _kfsAcknowledged = false;
  bool _coolingOffAcknowledged = false;
  bool _grievanceAcknowledged = false;
  bool _dataConsentAcknowledged = true;

  bool get _canProceed =>
      _kfsAcknowledged &&
      _coolingOffAcknowledged &&
      _grievanceAcknowledged &&
      _dataConsentAcknowledged;

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
        title: const Text('RBI Compliance Checkpoint'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.sm),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Mandatory RBI Disclosures', style: AppTypography.heading),
              const SizedBox(height: 8),
              Text(
                'Confirm key borrower disclosures before application tracking.',
                style: AppTypography.body.copyWith(color: muted),
              ),
              const SizedBox(height: AppSpacing.sm),
              CsCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Key Fact Statement (KFS) Snapshot',
                      style: AppTypography.subheading,
                    ),
                    const SizedBox(height: 10),
                    _row('Loan amount', '₹50,000', muted),
                    _row('APR', '11.2% (all-inclusive)', muted),
                    _row('Tenure', '12 months', muted),
                    _row('Monthly repayment obligation', '₹4,428', muted),
                    _row(
                      'Penal charges',
                      '2% per month on overdue amount',
                      muted,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              _checkItem(
                title: 'KFS shared and acknowledged',
                subtitle: 'RBI Chapter III 9(1) and 9(3)',
                value: _kfsAcknowledged,
                onChanged: (v) => setState(() => _kfsAcknowledged = v),
                secondary: secondary,
                muted: muted,
              ),
              _checkItem(
                title: 'Cooling-off period explained',
                subtitle: 'RBI Chapter III 11(1) - minimum 1 day exit option',
                value: _coolingOffAcknowledged,
                onChanged: (v) => setState(() => _coolingOffAcknowledged = v),
                secondary: secondary,
                muted: muted,
              ),
              _checkItem(
                title: 'Grievance and RBI CMS route disclosed',
                subtitle: 'RBI Chapter III 12(2) to 12(4)',
                value: _grievanceAcknowledged,
                onChanged: (v) => setState(() => _grievanceAcknowledged = v),
                secondary: secondary,
                muted: muted,
              ),
              _checkItem(
                title: 'Purpose-based consent confirmed',
                subtitle: 'RBI Chapter III 13(1) to 13(4)',
                value: _dataConsentAcknowledged,
                onChanged: (v) => setState(() => _dataConsentAcknowledged = v),
                secondary: secondary,
                muted: muted,
              ),
              const SizedBox(height: AppSpacing.sm),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: _canProceed
                      ? AppColors.success.withValues(alpha: 0.08)
                      : AppColors.warning.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: _canProceed
                        ? AppColors.success.withValues(alpha: 0.35)
                        : AppColors.warning.withValues(alpha: 0.35),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      _canProceed
                          ? Icons.verified
                          : Icons.warning_amber_outlined,
                      color: _canProceed
                          ? AppColors.success
                          : AppColors.warning,
                      size: 18,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _canProceed
                            ? 'All RBI mandatory disclosures confirmed.'
                            : 'Complete all mandatory confirmations to continue.',
                        style: AppTypography.caption.copyWith(
                          color: _canProceed
                              ? AppColors.success
                              : AppColors.warning,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              CsButton(
                label: 'Proceed to Tracker',
                onPressed: _canProceed
                    ? () => context.push('/loan-tracker')
                    : null,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _row(String label, String value, Color muted) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: AppTypography.caption.copyWith(color: muted)),
          Text(
            value,
            style: AppTypography.caption.copyWith(fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }

  Widget _checkItem({
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
    required Color secondary,
    required Color muted,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: secondary.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          Checkbox(
            value: value,
            onChanged: (v) => onChanged(v ?? false),
            activeColor: secondary,
          ),
          const SizedBox(width: 6),
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
                Text(
                  subtitle,
                  style: AppTypography.caption.copyWith(color: muted),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

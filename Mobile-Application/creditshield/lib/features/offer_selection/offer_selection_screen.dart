import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../core/design_system/components/cs_components.dart';

class OfferSelectionScreen extends StatefulWidget {
  final String offerId;
  const OfferSelectionScreen({super.key, required this.offerId});

  @override
  State<OfferSelectionScreen> createState() => _OfferSelectionScreenState();
}

class _OfferSelectionScreenState extends State<OfferSelectionScreen> {
  bool _confirmed = false;
  bool _loading = false;

  static const _offerDetails = {
    '1': {'lender': 'HDFC Bank', 'amount': '₹50,000', 'emi': '₹4,428/month'},
    '2': {'lender': 'ICICI Bank', 'amount': '₹50,000', 'emi': '₹4,512/month'},
    '3': {'lender': 'Bajaj Finserv', 'amount': '₹45,000', 'emi': '₹4,050/month'},
  };

  static const _dataCategories = [
    {'icon': Icons.person_outline, 'label': 'Identity Data', 'purpose': 'KYC verification'},
    {'icon': Icons.account_balance_outlined, 'label': 'Bank Statements', 'purpose': 'Income & repayment assessment'},
    {'icon': Icons.work_outline, 'label': 'Employment Details', 'purpose': 'Stability assessment'},
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final secondary = isDark ? AppColors.secondaryDark : AppColors.secondary;
    final offer = _offerDetails[widget.offerId] ?? _offerDetails['1']!;

    if (_confirmed) return _buildSuccess(context, isDark, secondary, offer);

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, size: 20),
          onPressed: () => context.pop(),
        ),
        title: const Text('Confirm & Share'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.sm),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CsCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Selected Offer',
                        style: AppTypography.caption.copyWith(
                          color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                        )),
                    const SizedBox(height: 6),
                    Text(offer['lender']!, style: AppTypography.subheading),
                    const SizedBox(height: 4),
                    Text('${offer['amount']} • ${offer['emi']}',
                        style: AppTypography.body.copyWith(color: secondary, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              CsCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('KFS Disclosure (RBI)', style: AppTypography.body.copyWith(fontWeight: FontWeight.w700)),
                    const SizedBox(height: 8),
                    _InfoRow('APR', '11.2% all-inclusive', isDark),
                    const Divider(height: 18),
                    _InfoRow('Penal charges', '2% per month on overdue', isDark),
                    const Divider(height: 18),
                    _InfoRow('Cooling-off', '1 day borrower exit option', isDark),
                    const Divider(height: 18),
                    _InfoRow('Grievance', 'care@creditshield.in / 1800-123-111', isDark),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              Text('Data you\'re sharing', style: AppTypography.subheading),
              const SizedBox(height: 8),
              Text(
                'The following data will be shared with ${offer['lender']} for loan evaluation:',
                style: AppTypography.body.copyWith(
                  color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                ),
              ),
              const SizedBox(height: 12),
              ..._dataCategories.map((cat) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Row(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: secondary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(cat['icon'] as IconData, color: secondary, size: 20),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(cat['label'] as String,
                                  style: AppTypography.body.copyWith(fontWeight: FontWeight.w600)),
                              Text(cat['purpose'] as String,
                                  style: AppTypography.caption.copyWith(
                                    color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                                  )),
                            ],
                          ),
                        ),
                      ],
                    ),
                  )),
              const SizedBox(height: AppSpacing.xs),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: secondary.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    Icon(Icons.info_outline, color: secondary, size: 16),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Non-selected lenders will NOT receive your personal data.',
                        style: AppTypography.caption.copyWith(color: secondary),
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              CsButton(
                label: 'Confirm and Share',
                isLoading: _loading,
                onPressed: () async {
                  setState(() => _loading = true);
                  await Future.delayed(const Duration(seconds: 1));
                  if (mounted) setState(() { _loading = false; _confirmed = true; });
                },
              ),
              const SizedBox(height: 8),
              CsButton(
                label: 'Go Back',
                variant: CsButtonVariant.secondary,
                onPressed: () => context.pop(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSuccess(BuildContext context, bool isDark, Color secondary, Map offer) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.sm),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 96,
                height: 96,
                decoration: BoxDecoration(
                  color: AppColors.success.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check_circle, color: AppColors.success, size: 56),
              ),
              const SizedBox(height: AppSpacing.md),
              Text('Application Submitted!',
                  style: AppTypography.heading, textAlign: TextAlign.center),
              const SizedBox(height: 8),
              Text(
                'Your application has been forwarded to ${offer['lender']}. You\'ll be notified of updates.',
                style: AppTypography.body.copyWith(
                  color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppSpacing.sm),
              CsCard(
                child: Column(
                  children: [
                    _InfoRow('Reference No.', 'CS-2024-78432', isDark),
                    const Divider(height: 20),
                    _InfoRow('Status', 'Submitted', isDark),
                    const Divider(height: 20),
                    _InfoRow('Est. Processing', '2–3 business days', isDark),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              CsButton(
                label: 'Track Application',
                onPressed: () => context.go('/loan-tracker'),
              ),
              const SizedBox(height: 8),
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

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isDark;

  const _InfoRow(this.label, this.value, this.isDark);

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label,
            style: AppTypography.body.copyWith(
              color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
            )),
        Text(value, style: AppTypography.body.copyWith(fontWeight: FontWeight.w600)),
      ],
    );
  }
}

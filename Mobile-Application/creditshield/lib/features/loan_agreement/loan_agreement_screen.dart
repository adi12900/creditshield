import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../core/design_system/components/cs_components.dart';

class LoanAgreementScreen extends StatefulWidget {
  const LoanAgreementScreen({super.key});

  @override
  State<LoanAgreementScreen> createState() => _LoanAgreementScreenState();
}

class _LoanAgreementScreenState extends State<LoanAgreementScreen> {
  bool _showFullAgreement = false;
  bool _signingMode = false;
  bool _signed = false;
  bool _loading = false;
  final _otpCtrl = TextEditingController();

  @override
  void dispose() {
    _otpCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final secondary = isDark ? AppColors.secondaryDark : AppColors.secondary;

    if (_signed) return _buildSignedSuccess(context, isDark, secondary);
    if (_signingMode) return _buildOtpScreen(context, isDark, secondary);

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, size: 20),
          onPressed: () => context.pop(),
        ),
        title: const Text('Loan Agreement'),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 12),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.warning.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text('Expires in 5 days',
                style: AppTypography.caption.copyWith(
                  color: AppColors.warning,
                  fontWeight: FontWeight.w600,
                )),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(AppSpacing.sm),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Key terms summary
                    Text('Key Terms Summary', style: AppTypography.subheading),
                    const SizedBox(height: 8),
                    Text('Review the important terms of your loan agreement before signing.',
                        style: AppTypography.body.copyWith(
                          color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                        )),
                    const SizedBox(height: AppSpacing.sm),
                    CsCard(
                      child: Column(
                        children: [
                          _TermRow('Sanctioned Amount', '₹50,000', secondary, isDark),
                          const Divider(height: 20),
                          _TermRow('APR (all-inclusive)', '11.2% APR', secondary, isDark),
                          const Divider(height: 20),
                          _TermRow('Interest Rate', '10.5% per annum', secondary, isDark),
                          const Divider(height: 20),
                          _TermRow('Monthly EMI', '₹4,428', secondary, isDark),
                          const Divider(height: 20),
                          _TermRow('Tenure', '12 months', secondary, isDark),
                          const Divider(height: 20),
                          _TermRow('Processing Fee', '₹500 (1%)', secondary, isDark),
                          const Divider(height: 20),
                          _TermRow('Prepayment', 'No charges after 6 months', secondary, isDark),
                          const Divider(height: 20),
                          _TermRow('Cooling-off period', '1 day from execution', secondary, isDark),
                          const Divider(height: 20),
                          _TermRow('Default Consequence', 'Late fee of 2% per month on overdue amount', secondary, isDark),
                          const Divider(height: 20),
                          _TermRow('Grievance contact', 'care@creditshield.in / 1800-123-111', secondary, isDark),
                        ],
                      ),
                    ),
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: secondary.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: secondary.withValues(alpha: 0.2)),
                      ),
                      child: Text(
                        'RBI note: You can exit within cooling-off period by paying principal + proportionate APR. For unresolved complaints, use RBI CMS portal after lender response timelines.',
                        style: AppTypography.caption.copyWith(color: secondary),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    // Full agreement toggle
                    GestureDetector(
                      onTap: () => setState(() => _showFullAgreement = !_showFullAgreement),
                      child: Row(
                        children: [
                          Text('Full Agreement Document',
                              style: AppTypography.body.copyWith(
                                color: secondary,
                                fontWeight: FontWeight.w600,
                              )),
                          const SizedBox(width: 6),
                          Icon(
                            _showFullAgreement ? Icons.expand_less : Icons.expand_more,
                            color: secondary,
                          ),
                        ],
                      ),
                    ),
                    if (_showFullAgreement) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: isDark ? AppColors.borderDark : AppColors.borderLight),
                        ),
                        child: Text(
                          'LOAN AGREEMENT\n\nThis Loan Agreement ("Agreement") is entered into as of 12 January 2025, between HDFC Bank Limited ("Lender") and Priya Sharma ("Borrower").\n\n1. LOAN AMOUNT\nThe Lender agrees to provide a personal loan of ₹50,000 (Rupees Fifty Thousand only) to the Borrower.\n\n2. INTEREST RATE\nThe loan shall carry an interest rate of 10.5% per annum (reducing balance method).\n\n3. REPAYMENT\nThe Borrower shall repay the loan in 12 equal monthly instalments of ₹4,428 each, commencing from 12 February 2025.\n\n4. PREPAYMENT\nThe Borrower may prepay the outstanding loan amount after 6 months without any prepayment charges.\n\n5. DEFAULT\nIn case of default, a late payment fee of 2% per month shall be levied on the overdue amount.\n\n6. GOVERNING LAW\nThis Agreement shall be governed by the laws of India and subject to the jurisdiction of courts in Mumbai.\n\n[Agreement continues...]',
                          style: AppTypography.caption.copyWith(height: 1.7),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(AppSpacing.sm),
              child: Column(
                children: [
                  CsButton(
                    label: 'Sign with Aadhaar eSign',
                    onPressed: () => setState(() => _signingMode = true),
                  ),
                  const SizedBox(height: 8),
                  CsButton(
                    label: 'Download Agreement',
                    variant: CsButtonVariant.secondary,
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Agreement saved to Downloads')),
                      );
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOtpScreen(BuildContext context, bool isDark, Color secondary) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, size: 20),
          onPressed: () => setState(() => _signingMode = false),
        ),
        title: const Text('eSign — OTP Verification'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.sm),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: secondary.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    Icon(Icons.lock_outline, color: secondary, size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'An OTP has been sent to your Aadhaar-linked mobile number +91 98765 XXXXX',
                        style: AppTypography.caption.copyWith(color: secondary),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              Text('Enter OTP to Sign', style: AppTypography.heading),
              const SizedBox(height: AppSpacing.sm),
              CsInputField(
                label: 'OTP',
                hint: '• • • • • •',
                controller: _otpCtrl,
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () {},
                child: Text('Resend OTP',
                    style: AppTypography.body.copyWith(color: secondary)),
              ),
              const Spacer(),
              CsButton(
                label: 'Verify & Sign',
                isLoading: _loading,
                onPressed: () async {
                  setState(() => _loading = true);
                  await Future.delayed(const Duration(seconds: 1));
                  if (mounted) setState(() { _loading = false; _signingMode = false; _signed = true; });
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSignedSuccess(BuildContext context, bool isDark, Color secondary) {
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
                child: const Icon(Icons.verified, color: AppColors.success, size: 56),
              ),
              const SizedBox(height: AppSpacing.md),
              Text('Agreement Signed!',
                  style: AppTypography.heading, textAlign: TextAlign.center),
              const SizedBox(height: 8),
              Text(
                'Your loan agreement has been signed successfully. Disbursement will be processed within 24 hours.',
                style: AppTypography.body.copyWith(
                  color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppSpacing.md),
              CsButton(
                label: 'Download Signed Agreement',
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Signed agreement saved to Downloads')),
                  );
                },
              ),
              const SizedBox(height: 8),
              CsButton(
                label: 'Go to Dashboard',
                variant: CsButtonVariant.secondary,
                onPressed: () => context.go('/loan-dashboard'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TermRow extends StatelessWidget {
  final String label;
  final String value;
  final Color secondary;
  final bool isDark;

  const _TermRow(this.label, this.value, this.secondary, this.isDark);

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Text(label,
              style: AppTypography.body.copyWith(
                color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
              )),
        ),
        Expanded(
          child: Text(value,
              style: AppTypography.body.copyWith(fontWeight: FontWeight.w600),
              textAlign: TextAlign.right),
        ),
      ],
    );
  }
}

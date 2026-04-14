import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../core/design_system/components/cs_components.dart';

class KycScreen extends StatefulWidget {
  const KycScreen({super.key});

  @override
  State<KycScreen> createState() => _KycScreenState();
}

class _KycScreenState extends State<KycScreen> {
  int _step = 1; // 1=method, 2=aadhaar, 3=otp, 4=review, 5=consent
  final _aadhaarCtrl = TextEditingController();
  final _otpCtrl = TextEditingController();
  bool _loading = false;
  bool _usePanFallback = false;
  String? _aadhaarError;

  @override
  void dispose() {
    _aadhaarCtrl.dispose();
    _otpCtrl.dispose();
    super.dispose();
  }

  void _nextStep() {
    if (_step == 2) {
      if (_aadhaarCtrl.text.length != 12) {
        setState(
          () => _aadhaarError = 'Please enter a valid 12-digit Aadhaar number',
        );
        return;
      }
      setState(() {
        _aadhaarError = null;
        _loading = true;
      });
      Future.delayed(const Duration(seconds: 1), () {
        if (mounted)
          setState(() {
            _loading = false;
            _step = 3;
          });
      });
      return;
    }
    if (_step == 3) {
      if (_otpCtrl.text.length != 6) return;
      setState(() => _loading = true);
      Future.delayed(const Duration(seconds: 1), () {
        if (mounted)
          setState(() {
            _loading = false;
            _step = 4;
          });
      });
      return;
    }
    setState(() => _step++);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final secondary = isDark ? AppColors.secondaryDark : AppColors.secondary;

    return Scaffold(
      appBar: AppBar(
        leading: _step > 1
            ? IconButton(
                icon: const Icon(Icons.arrow_back_ios, size: 20),
                onPressed: () => setState(() => _step--),
              )
            : null,
        title: const Text('Identity Verification'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.sm),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CsStepIndicator(
                currentStep: _step,
                totalSteps: 5,
                estimatedTime: '~3 min',
              ),
              const SizedBox(height: AppSpacing.md),
              Expanded(child: _buildStep(isDark, secondary)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStep(bool isDark, Color secondary) {
    switch (_step) {
      case 1:
        return _buildMethodStep(isDark, secondary);
      case 2:
        return _usePanFallback
            ? _buildPanFallback(isDark, secondary)
            : _buildAadhaarStep(isDark, secondary);
      case 3:
        return _buildOtpStep(isDark, secondary);
      case 4:
        return _buildReviewStep(isDark, secondary);
      case 5:
        return _buildConsentStep(isDark, secondary);
      default:
        return const SizedBox();
    }
  }

  Widget _buildMethodStep(bool isDark, Color secondary) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Verify your identity', style: AppTypography.heading),
        const SizedBox(height: 8),
        Text(
          'Choose how you\'d like to verify your identity',
          style: AppTypography.body.copyWith(
            color: isDark
                ? AppColors.textSecondaryDark
                : AppColors.textSecondaryLight,
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        _MethodCard(
          icon: Icons.fingerprint,
          title: 'Aadhaar eKYC',
          subtitle: 'Verify instantly using your Aadhaar number and OTP',
          recommended: true,
          secondary: secondary,
          onTap: () => setState(() {
            _usePanFallback = false;
            _step = 2;
          }),
        ),
        const SizedBox(height: 12),
        _MethodCard(
          icon: Icons.credit_card_outlined,
          title: 'PAN + Selfie',
          subtitle: 'Upload your PAN card and complete a liveness check',
          recommended: false,
          secondary: secondary,
          onTap: () => setState(() {
            _usePanFallback = true;
            _step = 2;
          }),
        ),
      ],
    );
  }

  Widget _buildAadhaarStep(bool isDark, Color secondary) {
    return SingleChildScrollView(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom + AppSpacing.sm,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Enter Aadhaar Number', style: AppTypography.heading),
          const SizedBox(height: 8),
          Text(
            'Your 12-digit Aadhaar number. We never store your raw Aadhaar — only a secure token.',
            style: AppTypography.body.copyWith(
              color: isDark
                  ? AppColors.textSecondaryDark
                  : AppColors.textSecondaryLight,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          CsInputField(
            label: 'Aadhaar Number',
            hint: 'XXXX XXXX XXXX',
            controller: _aadhaarCtrl,
            keyboardType: TextInputType.number,
            errorText: _aadhaarError,
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: secondary.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: secondary.withValues(alpha: 0.2)),
            ),
            child: Row(
              children: [
                Icon(Icons.info_outline, color: secondary, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Your Aadhaar number is tokenized per UIDAI guidelines and never stored in raw form.',
                    style: AppTypography.caption.copyWith(color: secondary),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          CsButton(
            label: 'Send OTP',
            isLoading: _loading,
            onPressed: _nextStep,
          ),
        ],
      ),
    );
  }

  Widget _buildPanFallback(bool isDark, Color secondary) {
    return SingleChildScrollView(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom + AppSpacing.sm,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.warning.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: AppColors.warning.withValues(alpha: 0.3),
              ),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.warning_amber_outlined,
                  color: AppColors.warning,
                  size: 18,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Aadhaar eKYC is unavailable. Please use PAN + Selfie instead.',
                    style: AppTypography.caption.copyWith(
                      color: AppColors.warning,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Text('PAN Card Upload', style: AppTypography.heading),
          const SizedBox(height: AppSpacing.sm),
          _UploadBox(
            label: 'Upload PAN Card',
            icon: Icons.upload_outlined,
            secondary: secondary,
          ),
          const SizedBox(height: AppSpacing.sm),
          Text('Selfie Liveness Check', style: AppTypography.subheading),
          const SizedBox(height: 8),
          Text(
            'Look straight at the camera and follow the on-screen instructions. This takes less than 60 seconds.',
            style: AppTypography.body.copyWith(
              color: isDark
                  ? AppColors.textSecondaryDark
                  : AppColors.textSecondaryLight,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          _UploadBox(
            label: 'Take Selfie',
            icon: Icons.camera_alt_outlined,
            secondary: secondary,
          ),
          const SizedBox(height: AppSpacing.md),
          CsButton(
            label: 'Continue',
            onPressed: () => setState(() => _step = 4),
          ),
        ],
      ),
    );
  }

  Widget _buildOtpStep(bool isDark, Color secondary) {
    return SingleChildScrollView(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom + AppSpacing.sm,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Enter OTP', style: AppTypography.heading),
          const SizedBox(height: 8),
          Text(
            'A 6-digit OTP has been sent to your Aadhaar-linked mobile number.',
            style: AppTypography.body.copyWith(
              color: isDark
                  ? AppColors.textSecondaryDark
                  : AppColors.textSecondaryLight,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          CsInputField(
            label: 'OTP',
            hint: '• • • • • •',
            controller: _otpCtrl,
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: () {},
            child: Text(
              'Resend OTP',
              style: AppTypography.body.copyWith(color: secondary),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          CsButton(
            label: 'Verify OTP',
            isLoading: _loading,
            onPressed: _nextStep,
          ),
        ],
      ),
    );
  }

  Widget _buildReviewStep(bool isDark, Color secondary) {
    return SingleChildScrollView(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom + AppSpacing.sm,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.verified, color: secondary, size: 28),
              const SizedBox(width: 8),
              Text('Identity Verified!', style: AppTypography.heading),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'We\'ve retrieved your details from DigiLocker. Please review and confirm.',
            style: AppTypography.body.copyWith(
              color: isDark
                  ? AppColors.textSecondaryDark
                  : AppColors.textSecondaryLight,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          CsCard(
            child: Column(
              children: [
                _ReviewRow('Full Name', 'Priya Sharma', secondary),
                const Divider(height: 24),
                _ReviewRow('Date of Birth', '15 March 1992', secondary),
                const Divider(height: 24),
                _ReviewRow(
                  'Address',
                  '42, MG Road, Bengaluru, Karnataka 560001',
                  secondary,
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Is this information correct?',
            style: AppTypography.body.copyWith(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: AppSpacing.md),
          CsButton(label: 'Confirm & Continue', onPressed: _nextStep),
          const SizedBox(height: 8),
          CsButton(
            label: 'Edit Details',
            variant: CsButtonVariant.secondary,
            onPressed: () {},
          ),
        ],
      ),
    );
  }

  Widget _buildConsentStep(bool isDark, Color secondary) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Data Usage Summary', style: AppTypography.heading),
        const SizedBox(height: 8),
        Text(
          'Before we proceed, here\'s exactly what data we collect and why.',
          style: AppTypography.body.copyWith(
            color: isDark
                ? AppColors.textSecondaryDark
                : AppColors.textSecondaryLight,
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        Expanded(
          child: ListView(
            children: [
              _ConsentItem(
                icon: Icons.person_outline,
                title: 'Identity Data',
                desc:
                    'Name, DOB, address — used to verify your identity and pre-fill your application.',
                secondary: secondary,
              ),
              _ConsentItem(
                icon: Icons.account_balance_outlined,
                title: 'Financial Data',
                desc:
                    'Bank statements, income — used to assess your loan eligibility.',
                secondary: secondary,
              ),
              _ConsentItem(
                icon: Icons.location_on_outlined,
                title: 'Location',
                desc:
                    'City — used to match you with lenders available in your area.',
                secondary: secondary,
              ),
            ],
          ),
        ),
        CsButton(
          label: 'I Understand & Agree',
          onPressed: () => context.go('/profile-setup'),
        ),
      ],
    );
  }
}

class _MethodCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final bool recommended;
  final Color secondary;
  final VoidCallback onTap;

  const _MethodCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.recommended,
    required this.secondary,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isDark ? AppColors.cardDark : AppColors.cardLight,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: recommended
                ? secondary
                : (isDark ? AppColors.borderDark : AppColors.borderLight),
            width: recommended ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: secondary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: secondary),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        title,
                        style: AppTypography.body.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      if (recommended) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: secondary,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            'Recommended',
                            style: AppTypography.caption.copyWith(
                              color: Colors.white,
                              fontSize: 10,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
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

class _UploadBox extends StatefulWidget {
  final String label;
  final IconData icon;
  final Color secondary;

  const _UploadBox({
    required this.label,
    required this.icon,
    required this.secondary,
  });

  @override
  State<_UploadBox> createState() => _UploadBoxState();
}

class _UploadBoxState extends State<_UploadBox> {
  bool _uploaded = false;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GestureDetector(
      onTap: () => setState(() => _uploaded = true),
      child: Container(
        height: 80,
        decoration: BoxDecoration(
          color: _uploaded
              ? widget.secondary.withValues(alpha: 0.08)
              : (isDark ? AppColors.surfaceDark : AppColors.surfaceLight),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: _uploaded
                ? widget.secondary
                : (isDark ? AppColors.borderDark : AppColors.borderLight),
            width: _uploaded ? 2 : 1,
          ),
        ),
        child: Center(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                _uploaded ? Icons.check_circle : widget.icon,
                color: _uploaded
                    ? widget.secondary
                    : (isDark
                          ? AppColors.textSecondaryDark
                          : AppColors.textSecondaryLight),
              ),
              const SizedBox(width: 8),
              Text(
                _uploaded ? 'Uploaded' : widget.label,
                style: AppTypography.body.copyWith(
                  color: _uploaded ? widget.secondary : null,
                  fontWeight: _uploaded ? FontWeight.w600 : FontWeight.normal,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ReviewRow extends StatelessWidget {
  final String label;
  final String value;
  final Color secondary;

  const _ReviewRow(this.label, this.value, this.secondary);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 100,
          child: Text(
            label,
            style: AppTypography.caption.copyWith(
              color: isDark
                  ? AppColors.textSecondaryDark
                  : AppColors.textSecondaryLight,
            ),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: AppTypography.body.copyWith(fontWeight: FontWeight.w600),
          ),
        ),
      ],
    );
  }
}

class _ConsentItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String desc;
  final Color secondary;

  const _ConsentItem({
    required this.icon,
    required this.title,
    required this.desc,
    required this.secondary,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: CsCard(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: secondary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: secondary, size: 20),
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
                  const SizedBox(height: 4),
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
          ],
        ),
      ),
    );
  }
}

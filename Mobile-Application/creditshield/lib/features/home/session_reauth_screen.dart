import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../app/app_state.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../core/design_system/components/cs_components.dart';

/// Shown when session expires (30-min inactivity). Re-authenticates via OTP.
class SessionReauthScreen extends StatefulWidget {
  const SessionReauthScreen({super.key});

  @override
  State<SessionReauthScreen> createState() => _SessionReauthScreenState();
}

class _SessionReauthScreenState extends State<SessionReauthScreen> {
  final _otpCtrl = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _otpCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final secondary = isDark ? AppColors.secondaryDark : AppColors.secondary;
    final muted = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.sm),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: secondary.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(Icons.lock_outline, size: 40, color: secondary),
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              Text('Session Expired', style: AppTypography.heading),
              const SizedBox(height: 8),
              Text(
                'Your session expired due to 30 minutes of inactivity. Enter the OTP sent to +91 98765 XXXXX to continue.',
                style: AppTypography.body.copyWith(color: muted),
              ),
              const SizedBox(height: AppSpacing.md),
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
                        'Your application progress has been saved and will not be lost.',
                        style: AppTypography.caption.copyWith(color: secondary),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              CsInputField(
                label: 'OTP',
                hint: '• • • • • •',
                controller: _otpCtrl,
                keyboardType: TextInputType.number,
                errorText: _error,
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () {},
                child: Text('Resend OTP', style: AppTypography.body.copyWith(color: secondary)),
              ),
              const SizedBox(height: AppSpacing.md),
              CsButton(
                label: 'Verify & Continue',
                isLoading: _loading,
                onPressed: () async {
                  if (_otpCtrl.text.length < 4) {
                    setState(() => _error = 'Please enter a valid OTP');
                    return;
                  }
                  setState(() { _loading = true; _error = null; });
                  await Future.delayed(const Duration(seconds: 1));
                  if (!mounted) return;
                  setState(() => _loading = false);
                  if (!context.mounted) return;
                  context.go('/home');
                },
              ),
              const SizedBox(height: 8),
              CsButton(
                label: 'Log Out',
                variant: CsButtonVariant.secondary,
                onPressed: () async {
                  await context.read<AppState>().setLoggedIn(false);
                  if (context.mounted) context.go('/welcome');
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

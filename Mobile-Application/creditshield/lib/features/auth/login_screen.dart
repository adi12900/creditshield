import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:creditshield/app/app_state.dart';
import 'package:creditshield/core/constants/app_colors.dart';
import 'package:creditshield/core/constants/app_typography.dart';
import 'package:creditshield/core/design_system/components/cs_components.dart';
import 'package:creditshield/features/auth/auth_api_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _isLoading = false;
  String? _phoneError;
  String? _passwordError;
  String? _apiError;

  final AuthApiService _authApi = AuthApiService();

  @override
  void dispose() {
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _continue() async {
    final digits = _phoneController.text.replaceAll(RegExp(r'[^0-9]'), '');
    final password = _passwordController.text;

    setState(() {
      _phoneError = null;
      _passwordError = null;
    });

    if (digits.length != 10) {
      setState(() => _phoneError = 'Enter a valid 10-digit mobile number');
      return;
    }

    if (password.length < 8) {
      setState(() => _passwordError = 'Enter a valid password');
      return;
    }

    setState(() {
      _isLoading = true;
      _apiError = null;
    });

    try {
      final auth = await _authApi.login(identifier: digits, password: password);
      final kycStatus = await _authApi.getKycStatus(auth.accessToken);
      if (!mounted) return;

      await context.read<AppState>().setAuthSession(
        token: auth.accessToken,
        name: auth.borrower.fullName,
        email: auth.borrower.email,
        mobile: auth.borrower.mobileNumber,
        kycCompleted: kycStatus.kycCompleted,
      );

      if (!mounted) return;
      setState(() => _isLoading = false);
      context.go(kycStatus.kycCompleted ? '/home' : '/kyc');
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _apiError = e.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final secondary = isDark ? AppColors.secondaryDark : AppColors.secondary;

    return Scaffold(
      appBar: AppBar(title: const Text('Login')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.sm),
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: AppSpacing.sm),
              Text('Welcome back', style: AppTypography.heading),
              const SizedBox(height: AppSpacing.xs),
              Text(
                'Sign in with your mobile number to continue your loan journey.',
                style: AppTypography.body.copyWith(
                  color: isDark
                      ? AppColors.textSecondaryDark
                      : AppColors.textSecondaryLight,
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              CsInputField(
                label: 'Mobile Number',
                hint: 'Enter 10-digit mobile number',
                keyboardType: TextInputType.phone,
                controller: _phoneController,
                errorText: _phoneError,
                prefixIcon: Icon(Icons.phone_android, color: secondary),
                onChanged: (_) {
                  if (_phoneError != null) setState(() => _phoneError = null);
                },
              ),
              const SizedBox(height: AppSpacing.sm),
              CsInputField(
                label: 'Password',
                hint: 'Enter your password',
                controller: _passwordController,
                errorText: _passwordError,
                obscureText: true,
                prefixIcon: Icon(Icons.lock_outline, color: secondary),
                onChanged: (_) {
                  if (_passwordError != null) {
                    setState(() => _passwordError = null);
                  }
                },
              ),
              const SizedBox(height: AppSpacing.md),
              CsButton(
                label: 'Continue',
                onPressed: _isLoading ? null : _continue,
                isLoading: _isLoading,
              ),
              if (_apiError != null) ...[
                const SizedBox(height: AppSpacing.xs),
                Text(
                  _apiError!,
                  style: AppTypography.caption.copyWith(
                    color: Theme.of(context).colorScheme.error,
                  ),
                ),
              ],
              const SizedBox(height: AppSpacing.sm),
              Center(
                child: TextButton(
                  onPressed: () => context.go('/signup'),
                  child: Text(
                    'New user? Create an account',
                    style: AppTypography.body.copyWith(color: secondary),
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                'By continuing, you agree to OTP verification for secure login.',
                style: AppTypography.caption.copyWith(
                  color: isDark
                      ? AppColors.textSecondaryDark
                      : AppColors.textSecondaryLight,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

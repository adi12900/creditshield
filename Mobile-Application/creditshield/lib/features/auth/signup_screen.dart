import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:creditshield/app/app_state.dart';
import 'package:creditshield/core/constants/app_colors.dart';
import 'package:creditshield/core/constants/app_typography.dart';
import 'package:creditshield/core/design_system/components/cs_components.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _addressController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController =
      TextEditingController();
  bool _isLoading = false;
  bool _acceptTerms = false;
  String? _nameError;
  String? _phoneError;
  String? _addressError;
  String? _emailError;
  String? _passwordError;
  String? _confirmPasswordError;
  String? _termsError;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  bool _isValidEmail(String email) {
    final regex = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
    return regex.hasMatch(email);
  }

  Future<void> _createAccount() async {
    final name = _nameController.text.trim();
    final digits = _phoneController.text.replaceAll(RegExp(r'[^0-9]'), '');
    final address = _addressController.text.trim();
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    final confirmPassword = _confirmPasswordController.text;

    setState(() {
      _nameError = null;
      _phoneError = null;
      _addressError = null;
      _emailError = null;
      _passwordError = null;
      _confirmPasswordError = null;
      _termsError = null;
    });

    if (name.length < 2) {
      setState(() => _nameError = 'Enter your full name');
      return;
    }

    if (digits.length != 10) {
      setState(() => _phoneError = 'Enter a valid 10-digit mobile number');
      return;
    }

    if (address.length < 10) {
      setState(() => _addressError = 'Enter your complete address');
      return;
    }

    if (!_isValidEmail(email)) {
      setState(() => _emailError = 'Enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setState(() => _passwordError = 'Password must be at least 6 characters');
      return;
    }

    if (confirmPassword != password) {
      setState(() => _confirmPasswordError = 'Passwords do not match');
      return;
    }

    if (!_acceptTerms) {
      setState(() => _termsError = 'Please accept Terms and Privacy Policy');
      return;
    }

    setState(() {
      _isLoading = true;
    });

    await Future<void>.delayed(const Duration(milliseconds: 700));
    if (!mounted) return;

    await context.read<AppState>().setLoggedIn(true);
    if (!mounted) return;

    setState(() => _isLoading = false);
    context.go('/kyc');
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final secondary = isDark ? AppColors.secondaryDark : AppColors.secondary;

    return Scaffold(
      appBar: AppBar(title: const Text('Sign Up')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.sm),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: AppSpacing.sm),
              Text('Create your account', style: AppTypography.heading),
              const SizedBox(height: AppSpacing.xs),
              Text(
                'Sign up to continue with loan application and verification.',
                style: AppTypography.body.copyWith(
                  color: isDark
                      ? AppColors.textSecondaryDark
                      : AppColors.textSecondaryLight,
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              CsInputField(
                label: 'Full Name',
                hint: 'Enter your full name',
                controller: _nameController,
                errorText: _nameError,
                prefixIcon: Icon(Icons.person_outline, color: secondary),
                onChanged: (_) {
                  if (_nameError != null) setState(() => _nameError = null);
                },
              ),
              const SizedBox(height: AppSpacing.sm),
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
                label: 'Address',
                hint: 'Enter your current address',
                controller: _addressController,
                errorText: _addressError,
                prefixIcon: Icon(Icons.location_on_outlined, color: secondary),
                maxLines: 2,
                onChanged: (_) {
                  if (_addressError != null)
                    setState(() => _addressError = null);
                },
              ),
              const SizedBox(height: AppSpacing.sm),
              CsInputField(
                label: 'Email Address',
                hint: 'Enter your email address',
                keyboardType: TextInputType.emailAddress,
                controller: _emailController,
                errorText: _emailError,
                prefixIcon: Icon(Icons.alternate_email, color: secondary),
                onChanged: (_) {
                  if (_emailError != null) setState(() => _emailError = null);
                },
              ),
              const SizedBox(height: AppSpacing.sm),
              CsInputField(
                label: 'Password',
                hint: 'Create a password',
                controller: _passwordController,
                errorText: _passwordError,
                obscureText: true,
                prefixIcon: Icon(Icons.lock_outline, color: secondary),
                onChanged: (_) {
                  if (_passwordError != null)
                    setState(() => _passwordError = null);
                },
              ),
              const SizedBox(height: AppSpacing.sm),
              CsInputField(
                label: 'Confirm Password',
                hint: 'Re-enter your password',
                controller: _confirmPasswordController,
                errorText: _confirmPasswordError,
                obscureText: true,
                prefixIcon: Icon(Icons.lock_reset_outlined, color: secondary),
                onChanged: (_) {
                  if (_confirmPasswordError != null) {
                    setState(() => _confirmPasswordError = null);
                  }
                },
              ),
              const SizedBox(height: AppSpacing.xs),
              CheckboxListTile(
                value: _acceptTerms,
                contentPadding: EdgeInsets.zero,
                controlAffinity: ListTileControlAffinity.leading,
                activeColor: secondary,
                title: Text(
                  'I agree to the Terms and Privacy Policy',
                  style: AppTypography.caption,
                ),
                onChanged: (value) {
                  setState(() {
                    _acceptTerms = value ?? false;
                    if (_acceptTerms) _termsError = null;
                  });
                },
              ),
              if (_termsError != null)
                Padding(
                  padding: const EdgeInsets.only(top: 2),
                  child: Text(
                    _termsError!,
                    style: AppTypography.caption.copyWith(
                      color: Theme.of(context).colorScheme.error,
                    ),
                  ),
                ),
              const SizedBox(height: AppSpacing.md),
              CsButton(
                label: 'Create Account',
                onPressed: _isLoading ? null : _createAccount,
                isLoading: _isLoading,
              ),
              const SizedBox(height: AppSpacing.sm),
              Center(
                child: TextButton(
                  onPressed: () => context.go('/login'),
                  child: Text(
                    'Already have an account? Login',
                    style: AppTypography.body.copyWith(color: secondary),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

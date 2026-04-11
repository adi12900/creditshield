import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../app/app_state.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../core/design_system/components/cs_components.dart';

class ProfileSetupScreen extends StatefulWidget {
  const ProfileSetupScreen({super.key});

  @override
  State<ProfileSetupScreen> createState() => _ProfileSetupScreenState();
}

class _ProfileSetupScreenState extends State<ProfileSetupScreen> {
  final _phoneCtrl = TextEditingController(text: '+91 98765 43210');
  final _emailCtrl = TextEditingController();
  String _employmentType = 'Salaried';
  bool _loading = false;

  static const _employmentTypes = ['Salaried', 'Self-Employed', 'Gig Worker', 'Student', 'Retired'];

  @override
  void dispose() {
    _phoneCtrl.dispose();
    _emailCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final secondary = isDark ? AppColors.secondaryDark : AppColors.secondary;

    return Scaffold(
      appBar: AppBar(title: const Text('Complete Your Profile')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.sm),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CsStepIndicator(currentStep: 5, totalSteps: 5, estimatedTime: '~1 min'),
              const SizedBox(height: AppSpacing.md),
              Center(
                child: Stack(
                  children: [
                    CircleAvatar(
                      radius: 44,
                      backgroundColor: secondary.withValues(alpha: 0.15),
                      child: Text('PS',
                          style: AppTypography.heading.copyWith(color: secondary)),
                    ),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          color: secondary,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                        child: const Icon(Icons.camera_alt, size: 14, color: Colors.white),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              CsCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Personal Details',
                        style: AppTypography.body.copyWith(fontWeight: FontWeight.w600)),
                    const SizedBox(height: AppSpacing.sm),
                    CsInputField(
                      label: 'Full Name',
                      hint: 'Priya Sharma',
                      controller: TextEditingController(text: 'Priya Sharma'),
                      enabled: false,
                    ),
                    const SizedBox(height: 12),
                    CsInputField(
                      label: 'Mobile Number',
                      controller: _phoneCtrl,
                      keyboardType: TextInputType.phone,
                      suffixIcon: Icon(Icons.verified, color: secondary, size: 20),
                    ),
                    const SizedBox(height: 12),
                    CsInputField(
                      label: 'Email Address (Optional)',
                      hint: 'priya@example.com',
                      controller: _emailCtrl,
                      keyboardType: TextInputType.emailAddress,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              CsCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Employment Details',
                        style: AppTypography.body.copyWith(fontWeight: FontWeight.w600)),
                    const SizedBox(height: AppSpacing.sm),
                    Text('Employment Type', style: AppTypography.caption.copyWith(
                      color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                      fontWeight: FontWeight.w500,
                    )),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _employmentTypes.map((type) {
                        final selected = _employmentType == type;
                        return GestureDetector(
                          onTap: () => setState(() => _employmentType = type),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            decoration: BoxDecoration(
                              color: selected ? secondary.withValues(alpha: 0.1) : Colors.transparent,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: selected ? secondary : (isDark ? AppColors.borderDark : AppColors.borderLight),
                                width: selected ? 2 : 1,
                              ),
                            ),
                            child: Text(type,
                                style: AppTypography.caption.copyWith(
                                  color: selected ? secondary : null,
                                  fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                                )),
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              CsButton(
                label: 'Complete Setup',
                isLoading: _loading,
                onPressed: () async {
                  final appState = context.read<AppState>();
                  setState(() => _loading = true);
                  await Future.delayed(const Duration(seconds: 1));
                  if (!mounted) return;
                  await appState.setLoggedIn(true);
                  await appState.setOnboardingDone(true);
                  if (!context.mounted) return;
                  context.go('/home');
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

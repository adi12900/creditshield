import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../app/app_state.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../core/design_system/components/cs_components.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _emiReminders = true;
  bool _statusUpdates = true;
  bool _promotional = false;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final secondary = isDark ? AppColors.secondaryDark : AppColors.secondary;
    final muted = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final appState = context.watch<AppState>();

    return Scaffold(
      appBar: AppBar(title: const Text('Profile & Settings')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.sm),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Profile header
              CsCard(
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 32,
                      backgroundColor: secondary.withValues(alpha: 0.15),
                      child: Text('PS',
                          style: AppTypography.subheading.copyWith(color: secondary)),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Priya Sharma', style: AppTypography.subheading),
                          Text('+91 98765 43210',
                              style: AppTypography.body.copyWith(color: muted)),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: AppColors.success.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(Icons.verified, color: AppColors.success, size: 12),
                                    const SizedBox(width: 4),
                                    Text('KYC Verified',
                                        style: AppTypography.caption.copyWith(
                                          color: AppColors.success,
                                          fontWeight: FontWeight.w600,
                                          fontSize: 10,
                                        )),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text('85% complete',
                                  style: AppTypography.caption.copyWith(color: muted)),
                            ],
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: () {},
                      icon: Icon(Icons.edit_outlined, color: secondary),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              // Profile completion bar
              CsCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Profile Completion', style: AppTypography.body.copyWith(fontWeight: FontWeight.w600)),
                        Text('85%', style: AppTypography.body.copyWith(color: secondary, fontWeight: FontWeight.w700)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: 0.85,
                        backgroundColor: secondary.withValues(alpha: 0.15),
                        valueColor: AlwaysStoppedAnimation<Color>(secondary),
                        minHeight: 8,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text('Add email address to reach 100%',
                        style: AppTypography.caption.copyWith(color: muted)),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              // Language
              _SectionHeader('Language & Region'),
              CsCard(
                child: Row(
                  children: [
                    Icon(Icons.language_outlined, color: secondary, size: 22),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('App Language', style: AppTypography.body.copyWith(fontWeight: FontWeight.w600)),
                          Text(appState.language, style: AppTypography.caption.copyWith(color: muted)),
                        ],
                      ),
                    ),
                    TextButton(
                      onPressed: () => _showLanguagePicker(context, appState, secondary, isDark),
                      child: Text('Change', style: AppTypography.caption.copyWith(color: secondary, fontWeight: FontWeight.w600)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              // Consent & Privacy
              _SectionHeader('Consent & Privacy'),
              _SettingsTile(
                icon: Icons.security_outlined,
                title: 'Consent Dashboard',
                subtitle: '3 active consents',
                secondary: secondary,
                muted: muted,
                isDark: isDark,
                onTap: () => context.push('/consent-dashboard'),
              ),
              const SizedBox(height: 8),
              _SettingsTile(
                icon: Icons.privacy_tip_outlined,
                title: 'Privacy Controls',
                subtitle: 'View data, request report, delete account',
                secondary: secondary,
                muted: muted,
                isDark: isDark,
                onTap: () => _showPrivacyControls(context, isDark, secondary),
              ),
              const SizedBox(height: AppSpacing.sm),
              // Notifications
              _SectionHeader('Notification Preferences'),
              CsCard(
                child: Column(
                  children: [
                    _NotifToggle('EMI Reminders', 'Critical — cannot be disabled', _emiReminders, true, secondary, muted, (v) => setState(() => _emiReminders = v)),
                    const Divider(height: 20),
                    _NotifToggle('Status Updates', 'Application status changes', _statusUpdates, false, secondary, muted, (v) => setState(() => _statusUpdates = v)),
                    const Divider(height: 20),
                    _NotifToggle('Promotional', 'New offers and product updates', _promotional, false, secondary, muted, (v) => setState(() => _promotional = v)),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              // App info
              _SectionHeader('About'),
              CsCard(
                child: Column(
                  children: [
                    _InfoTile('App Version', '1.0.0 (Build 1)', muted),
                    const Divider(height: 20),
                    _InfoTile('Terms of Service', 'View', muted, onTap: () {}),
                    const Divider(height: 20),
                    _InfoTile('Privacy Policy', 'View', muted, onTap: () {}),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              CsButton(
                label: 'Log Out',
                variant: CsButtonVariant.secondary,
                onPressed: () async {
                  await context.read<AppState>().setLoggedIn(false);
                  if (context.mounted) context.go('/welcome');
                },
              ),
              const SizedBox(height: AppSpacing.sm),
            ],
          ),
        ),
      ),
    );
  }

  void _showLanguagePicker(BuildContext context, AppState appState, Color secondary, bool isDark) {
    const langs = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Bengali', 'Marathi', 'Gujarati'];
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(AppSpacing.sm),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Select Language', style: AppTypography.subheading),
            const SizedBox(height: AppSpacing.sm),
            ...langs.map((lang) => ListTile(
                  title: Text(lang),
                  trailing: appState.language == lang
                      ? Icon(Icons.check_circle, color: secondary)
                      : null,
                  onTap: () async {
                    await appState.setLanguage(lang);
                    if (context.mounted) Navigator.pop(context);
                  },
                )),
          ],
        ),
      ),
    );
  }

  void _showPrivacyControls(BuildContext context, bool isDark, Color secondary) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(AppSpacing.sm),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Privacy Controls', style: AppTypography.subheading),
            const SizedBox(height: AppSpacing.sm),
            ListTile(
              leading: Icon(Icons.visibility_outlined, color: secondary),
              title: const Text('View All Collected Data'),
              onTap: () => Navigator.pop(context),
            ),
            ListTile(
              leading: Icon(Icons.summarize_outlined, color: secondary),
              title: const Text('Request Data Usage Report'),
              subtitle: const Text('Available within 48 hours (DPDPA Section 11)'),
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Report will be available within 48 hours.')),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.delete_outline, color: AppColors.error),
              title: const Text('Request Data Deletion'),
              subtitle: const Text('DPDPA Section 12 — processed within 30 days'),
              onTap: () {
                Navigator.pop(context);
                _showDeletionConfirm(context, isDark);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showDeletionConfirm(BuildContext context, bool isDark) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Request Data Deletion'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('The following data will be deleted:', style: AppTypography.body.copyWith(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Text('• Profile information\n• Application drafts\n• Consent records\n• Transaction history',
                style: AppTypography.body),
            const SizedBox(height: 12),
            Text('The following data must be retained for regulatory compliance:', style: AppTypography.body.copyWith(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Text('• Loan agreement records (7 years per RBI guidelines)\n• KYC audit trail',
                style: AppTypography.body),
            const SizedBox(height: 12),
            Text('Expected completion: 30 days', style: AppTypography.body.copyWith(color: AppColors.warning)),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Data deletion request submitted. You\'ll be notified within 30 days.')),
              );
            },
            child: const Text('Submit Request', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader(this.title);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(title,
          style: AppTypography.caption.copyWith(
            color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.5,
          )),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color secondary;
  final Color muted;
  final bool isDark;
  final VoidCallback onTap;

  const _SettingsTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.secondary,
    required this.muted,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isDark ? AppColors.cardDark : AppColors.cardLight,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: isDark ? AppColors.borderDark : AppColors.borderLight),
        ),
        child: Row(
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
                  Text(title, style: AppTypography.body.copyWith(fontWeight: FontWeight.w600)),
                  Text(subtitle, style: AppTypography.caption.copyWith(color: muted)),
                ],
              ),
            ),
            Icon(Icons.arrow_forward_ios, size: 16, color: muted),
          ],
        ),
      ),
    );
  }
}

class _NotifToggle extends StatelessWidget {
  final String title;
  final String subtitle;
  final bool value;
  final bool locked;
  final Color secondary;
  final Color muted;
  final void Function(bool) onChanged;

  const _NotifToggle(this.title, this.subtitle, this.value, this.locked, this.secondary, this.muted, this.onChanged);

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: AppTypography.body.copyWith(fontWeight: FontWeight.w600)),
              Text(subtitle, style: AppTypography.caption.copyWith(color: muted)),
            ],
          ),
        ),
        Switch(
          value: value,
          onChanged: locked ? null : onChanged,
          activeColor: secondary,
        ),
      ],
    );
  }
}

class _InfoTile extends StatelessWidget {
  final String label;
  final String value;
  final Color muted;
  final VoidCallback? onTap;

  const _InfoTile(this.label, this.value, this.muted, {this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: AppTypography.body),
          Text(value,
              style: AppTypography.body.copyWith(
                color: onTap != null ? AppColors.secondary : muted,
                fontWeight: onTap != null ? FontWeight.w600 : FontWeight.normal,
              )),
        ],
      ),
    );
  }
}

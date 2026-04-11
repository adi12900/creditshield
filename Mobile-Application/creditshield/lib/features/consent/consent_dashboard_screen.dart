import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';

class ConsentDashboardScreen extends StatefulWidget {
  const ConsentDashboardScreen({super.key});

  @override
  State<ConsentDashboardScreen> createState() => _ConsentDashboardScreenState();
}

class _ConsentDashboardScreenState extends State<ConsentDashboardScreen> {
  final _consents = [
    {'category': 'Bank Statements', 'expiry': '15 Jan 2026', 'active': true, 'expiringSoon': false},
    {'category': 'UPI History', 'expiry': '20 Jan 2026', 'active': true, 'expiringSoon': false},
    {'category': 'Utility Bills', 'expiry': '05 Jan 2026', 'active': true, 'expiringSoon': true},
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, size: 20),
          onPressed: () => context.pop(),
        ),
        title: const Text('Consent Dashboard'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.sm),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Active Consents', style: AppTypography.subheading),
              const SizedBox(height: 6),
              Text('Manage what data you share with lenders.',
                  style: AppTypography.body.copyWith(
                    color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                  )),
              const SizedBox(height: AppSpacing.sm),
              Expanded(
                child: ListView.separated(
                  itemCount: _consents.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, i) {
                    final c = _consents[i];
                    final expiringSoon = c['expiringSoon'] as bool;
                    return Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: expiringSoon
                            ? AppColors.warning.withValues(alpha: 0.06)
                            : (isDark ? AppColors.cardDark : AppColors.cardLight), // ignore: deprecated_member_use
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: expiringSoon
                              ? AppColors.warning.withValues(alpha: 0.4)
                              : (isDark ? AppColors.borderDark : AppColors.borderLight),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(c['category'] as String,
                                    style: AppTypography.body.copyWith(fontWeight: FontWeight.w600)),
                              ),
                              if (expiringSoon)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: AppColors.warning.withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text('Expiring Soon',
                                      style: AppTypography.caption.copyWith(
                                        color: AppColors.warning,
                                        fontWeight: FontWeight.w600,
                                        fontSize: 10,
                                      )),
                                ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text('Expires: ${c['expiry']}',
                              style: AppTypography.caption.copyWith(
                                color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                              )),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              if (expiringSoon)
                                Expanded(
                                  child: OutlinedButton(
                                    onPressed: () {},
                                    style: OutlinedButton.styleFrom(
                                      padding: const EdgeInsets.symmetric(vertical: 8),
                                      minimumSize: Size.zero,
                                    ),
                                    child: const Text('Renew'),
                                  ),
                                ),
                              if (expiringSoon) const SizedBox(width: 8),
                              Expanded(
                                child: OutlinedButton(
                                  onPressed: () {
                                    showDialog(
                                      context: context,
                                      builder: (_) => AlertDialog(
                                        title: const Text('Revoke Consent'),
                                        content: Text(
                                          'Data collection for "${c['category']}" will stop. Any cached data will be deleted within 24 hours.',
                                          style: AppTypography.body,
                                        ),
                                        actions: [
                                          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
                                          TextButton(
                                            onPressed: () {
                                              setState(() => _consents.removeAt(i));
                                              Navigator.pop(context);
                                            },
                                            child: Text('Revoke', style: TextStyle(color: AppColors.error)),
                                          ),
                                        ],
                                      ),
                                    );
                                  },
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: AppColors.error,
                                    side: const BorderSide(color: AppColors.error),
                                    padding: const EdgeInsets.symmetric(vertical: 8),
                                    minimumSize: Size.zero,
                                  ),
                                  child: const Text('Revoke'),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../core/design_system/components/cs_components.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final _notifications = [
    {
      'type': 'emi',
      'icon': Icons.notifications_active_outlined,
      'title': 'EMI Reminder',
      'body': 'Your EMI of ₹4,428 is due in 5 days on 12 Apr 2025.',
      'time': '2 hours ago',
      'read': false,
      'route': '/loan-dashboard',
    },
    {
      'type': 'status',
      'icon': Icons.track_changes_outlined,
      'title': 'Application Update',
      'body':
          'Your application CS-2024-78432 has moved to Employment Verified.',
      'time': '1 day ago',
      'read': false,
      'route': '/loan-tracker',
    },
    {
      'type': 'offer',
      'icon': Icons.local_offer_outlined,
      'title': 'Application Update',
      'body': 'Your application is ready for the next tracking step.',
      'time': '2 days ago',
      'read': true,
      'route': '/loan-tracker',
    },
    {
      'type': 'consent',
      'icon': Icons.security_outlined,
      'title': 'Consent Expiring Soon',
      'body': 'Your Utility Bills consent expires in 7 days. Tap to renew.',
      'time': '3 days ago',
      'read': true,
      'route': '/consent-dashboard',
    },
    {
      'type': 'disbursal',
      'icon': Icons.account_balance_outlined,
      'title': 'Loan Disbursed',
      'body': '₹50,000 has been credited to your account ending XXXX4321.',
      'time': '5 days ago',
      'read': true,
      'route': '/loan-dashboard',
    },
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final secondary = isDark ? AppColors.secondaryDark : AppColors.secondary;
    final muted = isDark
        ? AppColors.textSecondaryDark
        : AppColors.textSecondaryLight;
    final unreadCount = _notifications
        .where((n) => !(n['read'] as bool))
        .length;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, size: 20),
          onPressed: () => context.pop(),
        ),
        title: const Text('Notifications'),
        actions: [
          if (unreadCount > 0)
            TextButton(
              onPressed: () => setState(() {
                for (final n in _notifications) {
                  n['read'] = true;
                }
              }),
              child: Text(
                'Mark all read',
                style: AppTypography.caption.copyWith(
                  color: secondary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
        ],
      ),
      body: SafeArea(
        child: _notifications.isEmpty
            ? CsEmptyState(
                icon: Icons.notifications_none_outlined,
                heading: 'No Notifications',
                message:
                    'You\'re all caught up! Notifications will appear here.',
              )
            : ListView.separated(
                padding: const EdgeInsets.all(AppSpacing.sm),
                itemCount: _notifications.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (context, i) {
                  final n = _notifications[i];
                  final isRead = n['read'] as bool;
                  return GestureDetector(
                    onTap: () {
                      setState(() => n['read'] = true);
                      context.push(n['route'] as String);
                    },
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: isRead
                            ? (isDark
                                  ? AppColors.cardDark
                                  : AppColors.cardLight)
                            : secondary.withValues(alpha: 0.06),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: isRead
                              ? (isDark
                                    ? AppColors.borderDark
                                    : AppColors.borderLight)
                              : secondary.withValues(alpha: 0.3),
                        ),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 42,
                            height: 42,
                            decoration: BoxDecoration(
                              color: secondary.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(11),
                            ),
                            child: Icon(
                              n['icon'] as IconData,
                              color: secondary,
                              size: 20,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        n['title'] as String,
                                        style: AppTypography.body.copyWith(
                                          fontWeight: isRead
                                              ? FontWeight.w500
                                              : FontWeight.w700,
                                        ),
                                      ),
                                    ),
                                    if (!isRead)
                                      Container(
                                        width: 8,
                                        height: 8,
                                        decoration: BoxDecoration(
                                          color: secondary,
                                          shape: BoxShape.circle,
                                        ),
                                      ),
                                  ],
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  n['body'] as String,
                                  style: AppTypography.caption.copyWith(
                                    color: muted,
                                    height: 1.4,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  n['time'] as String,
                                  style: AppTypography.caption.copyWith(
                                    color: muted.withValues(alpha: 0.7),
                                    fontSize: 11,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
      ),
    );
  }
}

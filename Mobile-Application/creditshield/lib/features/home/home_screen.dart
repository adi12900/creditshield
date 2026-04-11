import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../app/app_state.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _tab = 0;

  // Req 20.4 — guard: if active application exists, prompt resume or abandon
  void _onApplyTap(BuildContext context, AppState appState) {
    if (appState.resumeLoanType != null) {
      showDialog(
        context: context,
        builder: (_) => AlertDialog(
          title: const Text('Active Application'),
          content: Text(
            'You have an in-progress ${appState.resumeLoanType} loan application at step ${appState.resumeStep}. Resume it or start a new one?',
            style: AppTypography.body,
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                context.push(
                    '/loan-application/${appState.resumeLoanType}?step=${appState.resumeStep}');
              },
              child: const Text('Resume'),
            ),
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                _confirmAbandon(context, appState);
              },
              child: Text('Start New',
                  style: TextStyle(color: AppColors.error)),
            ),
          ],
        ),
      );
    } else {
      context.push('/loan-type');
    }
  }

  void _confirmAbandon(BuildContext context, AppState appState) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Abandon Application?'),
        content: const Text(
          'Your current application data will be cleared. This cannot be undone.',
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel')),
          TextButton(
            onPressed: () async {
              await appState.clearResume();
              if (context.mounted) {
                Navigator.pop(context);
                context.push('/loan-type');
              }
            },
            child:
                Text('Abandon', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();

    final tabs = [
      _HomeTab(appState: appState),
      _ApplyTab(onStartApply: () => _onApplyTap(context, appState)),
      const _TrackTab(),
      const _DashboardTab(),
      _ProfileTab(appState: appState),
    ];

    return Scaffold(
      body: tabs[_tab],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _tab,
        onTap: (i) => setState(() => _tab = i),
        items: const [
          BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined),
              activeIcon: Icon(Icons.home),
              label: 'Home'),
          BottomNavigationBarItem(
              icon: Icon(Icons.add_circle_outline),
              activeIcon: Icon(Icons.add_circle),
              label: 'Apply'),
          BottomNavigationBarItem(
              icon: Icon(Icons.track_changes_outlined),
              activeIcon: Icon(Icons.track_changes),
              label: 'Track'),
          BottomNavigationBarItem(
              icon: Icon(Icons.dashboard_outlined),
              activeIcon: Icon(Icons.dashboard),
              label: 'Dashboard'),
          BottomNavigationBarItem(
              icon: Icon(Icons.person_outline),
              activeIcon: Icon(Icons.person),
              label: 'Profile'),
        ],
      ),
    );
  }
}

class _HomeTab extends StatelessWidget {
  final AppState appState;
  const _HomeTab({required this.appState});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final secondary = isDark ? AppColors.secondaryDark : AppColors.secondary;

    return Scaffold(
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.sm),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Good morning,',
                                  style: AppTypography.body.copyWith(
                                    color: isDark
                                        ? AppColors.textSecondaryDark
                                        : AppColors.textSecondaryLight,
                                  )),
                              Text('Priya Sharma 👋',
                                  style: AppTypography.subheading),
                            ],
                          ),
                        ),
                        Semantics(
                          button: true,
                          label: 'Notifications',
                          child: IconButton(
                            onPressed: () => context.push('/notifications'),
                            icon: Stack(
                              children: [
                                const Icon(Icons.notifications_outlined,
                                    size: 28),
                                Positioned(
                                  right: 0,
                                  top: 0,
                                  child: Container(
                                    width: 10,
                                    height: 10,
                                    decoration: BoxDecoration(
                                      color: AppColors.error,
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                          color: isDark
                                              ? AppColors.backgroundDark
                                              : Colors.white,
                                          width: 1.5),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    // Req 17.6 — Resume Application prompt
                    if (appState.resumeLoanType != null)
                      _ResumeBanner(
                        loanType: appState.resumeLoanType!,
                        step: appState.resumeStep,
                        secondary: secondary,
                      ),
                    const SizedBox(height: AppSpacing.sm),
                    // Hero eligibility card
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(AppSpacing.sm),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [AppColors.primary, Color(0xFF1A4A7A)],
                        ),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Check your eligibility',
                              style: AppTypography.subheading
                                  .copyWith(color: Colors.white)),
                          const SizedBox(height: 6),
                          Text(
                              'Get an instant estimate in seconds — no paperwork needed.',
                              style: AppTypography.body.copyWith(
                                  color: Colors.white.withValues(alpha: 0.8))),
                          const SizedBox(height: AppSpacing.sm),
                          ElevatedButton(
                            onPressed: () => context.push('/eligibility'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.secondary,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10)),
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 20, vertical: 10),
                            ),
                            child: const Text('Check Now'),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    Text('Loan Products', style: AppTypography.subheading),
                    const SizedBox(height: 12),
                  ],
                ),
              ),
            ),
            SliverPadding(
              padding:
                  const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
              sliver: SliverGrid(
                gridDelegate:
                    const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  childAspectRatio: 1.4,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                ),
                delegate: SliverChildListDelegate(
                    _loanCards(context, secondary, isDark)),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.sm),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: AppSpacing.xs),
                    Text('Quick Actions', style: AppTypography.subheading),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _QuickAction(
                          icon: Icons.calculate_outlined,
                          label: 'EMI Calculator',
                          secondary: secondary,
                          onTap: () =>
                              context.push('/loan-application/personal'),
                        ),
                        const SizedBox(width: 12),
                        _QuickAction(
                          icon: Icons.history_outlined,
                          label: 'My Applications',
                          secondary: secondary,
                          onTap: () => context.push('/loan-tracker'),
                        ),
                        const SizedBox(width: 12),
                        _QuickAction(
                          icon: Icons.support_agent_outlined,
                          label: 'Support',
                          secondary: secondary,
                          onTap: () => context.push('/maintenance'),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.md),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<Widget> _loanCards(
      BuildContext context, Color secondary, bool isDark) {
    const loans = [
      {
        'icon': Icons.person_outline,
        'title': 'Personal Loan',
        'desc': 'For any personal need',
        'type': 'personal'
      },
      {
        'icon': Icons.diamond_outlined,
        'title': 'Gold Loan',
        'desc': 'Against gold jewellery',
        'type': 'gold'
      },
      {
        'icon': Icons.home_outlined,
        'title': 'Home Loan',
        'desc': 'Buy your dream home',
        'type': 'home'
      },
      {
        'icon': Icons.directions_car_outlined,
        'title': 'Car Loan',
        'desc': 'New or used vehicle',
        'type': 'car'
      },
      {
        'icon': Icons.school_outlined,
        'title': 'Education Loan',
        'desc': 'Fund your studies',
        'type': 'education'
      },
    ];
    return loans.map((loan) {
      return Semantics(
        button: true,
        label: loan['title'] as String,
        child: GestureDetector(
          onTap: () => context.push('/loan-application/${loan['type']}'),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: isDark ? AppColors.cardDark : AppColors.cardLight,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                  color: isDark
                      ? AppColors.borderDark
                      : AppColors.borderLight),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: secondary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(loan['icon'] as IconData,
                      color: secondary, size: 22),
                ),
                const Spacer(),
                Text(loan['title'] as String,
                    style: AppTypography.body
                        .copyWith(fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(loan['desc'] as String,
                    style: AppTypography.caption.copyWith(
                      color: isDark
                          ? AppColors.textSecondaryDark
                          : AppColors.textSecondaryLight,
                    )),
              ],
            ),
          ),
        ),
      );
    }).toList();
  }
}

class _ResumeBanner extends StatelessWidget {
  final String loanType;
  final int step;
  final Color secondary;

  const _ResumeBanner(
      {required this.loanType,
      required this.step,
      required this.secondary});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: secondary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: secondary.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Icon(Icons.restore, color: secondary, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Resume Application',
                    style: AppTypography.body.copyWith(
                        fontWeight: FontWeight.w600, color: secondary)),
                Text(
                    '${loanType[0].toUpperCase()}${loanType.substring(1)} Loan — Step $step',
                    style: AppTypography.caption),
              ],
            ),
          ),
          TextButton(
            onPressed: () =>
                context.push('/loan-application/$loanType?step=$step'),
            child: Text('Resume',
                style: AppTypography.caption
                    .copyWith(color: secondary, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color secondary;
  final VoidCallback onTap;

  const _QuickAction(
      {required this.icon,
      required this.label,
      required this.secondary,
      required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Expanded(
      child: Semantics(
        button: true,
        label: label,
        child: GestureDetector(
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 14),
            decoration: BoxDecoration(
              color: isDark ? AppColors.cardDark : AppColors.cardLight,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                  color: isDark
                      ? AppColors.borderDark
                      : AppColors.borderLight),
            ),
            child: Column(
              children: [
                Icon(icon, color: secondary, size: 24),
                const SizedBox(height: 6),
                Text(label,
                    style: AppTypography.caption
                        .copyWith(fontWeight: FontWeight.w500),
                    textAlign: TextAlign.center),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ApplyTab extends StatelessWidget {
  final VoidCallback onStartApply;

  const _ApplyTab({required this.onStartApply});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final secondary = isDark ? AppColors.secondaryDark : AppColors.secondary;

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.sm),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Start New Application', style: AppTypography.heading),
              const SizedBox(height: 8),
              Text(
                'Select a loan type and begin your application. Your progress will be auto-saved.',
                style: AppTypography.body.copyWith(
                  color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(AppSpacing.sm),
                decoration: BoxDecoration(
                  color: secondary.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: secondary.withValues(alpha: 0.25)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Quick Start', style: AppTypography.subheading.copyWith(color: secondary)),
                    const SizedBox(height: 8),
                    Text(
                      'Personal, Gold, Home, Car, and Education loans are available.',
                      style: AppTypography.body,
                    ),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: onStartApply,
                      child: const Text('Choose Loan Type'),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  String toString({DiagnosticLevel minLevel = DiagnosticLevel.info}) => '_ApplyTab';
}

class _TrackTab extends StatelessWidget {
  const _TrackTab();

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final secondary = isDark ? AppColors.secondaryDark : AppColors.secondary;

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.sm),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Track Application', style: AppTypography.heading),
              const SizedBox(height: 8),
              Text(
                'Follow your application journey from submission to disbursal.',
                style: AppTypography.body.copyWith(
                  color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              ListTile(
                tileColor: isDark ? AppColors.cardDark : AppColors.cardLight,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: isDark ? AppColors.borderDark : AppColors.borderLight),
                ),
                leading: Icon(Icons.track_changes, color: secondary),
                title: const Text('Open Detailed Tracker'),
                subtitle: const Text('Reference: CS-2024-78432'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.push('/loan-tracker'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DashboardTab extends StatelessWidget {
  const _DashboardTab();

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final secondary = isDark ? AppColors.secondaryDark : AppColors.secondary;

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.sm),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Loan Dashboard', style: AppTypography.heading),
              const SizedBox(height: 8),
              Text(
                'View outstanding amount, upcoming EMIs, and repayment summary.',
                style: AppTypography.body.copyWith(
                  color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              ListTile(
                tileColor: isDark ? AppColors.cardDark : AppColors.cardLight,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: isDark ? AppColors.borderDark : AppColors.borderLight),
                ),
                leading: Icon(Icons.dashboard, color: secondary),
                title: const Text('Open Detailed Dashboard'),
                subtitle: const Text('Outstanding: Rs 41,144'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.push('/loan-dashboard'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ProfileTab extends StatelessWidget {
  final AppState appState;

  const _ProfileTab({required this.appState});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final secondary = isDark ? AppColors.secondaryDark : AppColors.secondary;

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.sm),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Profile', style: AppTypography.heading),
              const SizedBox(height: 8),
              Text(
                'Manage language, privacy, notifications, and account settings.',
                style: AppTypography.body.copyWith(
                  color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              ListTile(
                tileColor: isDark ? AppColors.cardDark : AppColors.cardLight,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: isDark ? AppColors.borderDark : AppColors.borderLight),
                ),
                leading: Icon(Icons.person_outline, color: secondary),
                title: const Text('Open Full Profile Settings'),
                subtitle: Text('Language: ${appState.language}'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.push('/profile'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

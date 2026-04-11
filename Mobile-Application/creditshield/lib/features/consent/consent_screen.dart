import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../core/design_system/components/cs_components.dart';

class ConsentScreen extends StatefulWidget {
  const ConsentScreen({super.key});

  @override
  State<ConsentScreen> createState() => _ConsentScreenState();
}

class _ConsentScreenState extends State<ConsentScreen> {
  final Map<String, bool> _consents = {
    'bank_statements': true,
    'upi_history': false,
    'utility_bills': false,
    'mobile_usage': false,
  };

  bool _fetching = false;
  String? _fetchingSource;

  static const _categories = [
    {
      'key': 'bank_statements',
      'icon': Icons.account_balance_outlined,
      'title': 'Bank Statements',
      'desc': 'Last 6 months of bank transactions to assess your repayment capacity.',
      'benefit': 'Improves your loan eligibility score',
    },
    {
      'key': 'upi_history',
      'icon': Icons.payment_outlined,
      'title': 'UPI Transaction History',
      'desc': 'Your UPI payment patterns to understand spending behaviour.',
      'benefit': 'Helps lenders offer better interest rates',
    },
    {
      'key': 'utility_bills',
      'icon': Icons.receipt_long_outlined,
      'title': 'Utility Bills',
      'desc': 'Electricity, water, and gas bill payment history.',
      'benefit': 'Demonstrates financial responsibility',
    },
    {
      'key': 'mobile_usage',
      'icon': Icons.phone_android_outlined,
      'title': 'Mobile Usage Data',
      'desc': 'Anonymised mobile recharge and usage patterns.',
      'benefit': 'Useful for thin-file borrowers with no credit history',
    },
  ];

  List<String> get _activeConsents =>
      _consents.entries.where((e) => e.value).map((e) => e.key).toList();

  void _simulateFetch() {
    setState(() { _fetching = true; _fetchingSource = 'HDFC Bank'; });
    Future.delayed(const Duration(seconds: 1), () {
      if (mounted) setState(() => _fetchingSource = 'ICICI Bank');
      Future.delayed(const Duration(seconds: 1), () {
        if (mounted) setState(() { _fetching = false; _fetchingSource = null; });
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final secondary = isDark ? AppColors.secondaryDark : AppColors.secondary;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, size: 20),
          onPressed: () => context.pop(),
        ),
        title: const Text('Data Consent'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.sm),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Control your data sharing', style: AppTypography.heading),
              const SizedBox(height: 6),
              Text('Choose what financial data to share. You can change this anytime.',
                  style: AppTypography.body.copyWith(
                    color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                  )),
              const SizedBox(height: AppSpacing.sm),
              if (_fetching)
                Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: secondary.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: secondary.withValues(alpha: 0.2)),
                  ),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2, color: secondary),
                      ),
                      const SizedBox(width: 10),
                      Text('Fetching data from $_fetchingSource...',
                          style: AppTypography.caption.copyWith(color: secondary)),
                    ],
                  ),
                ),
              Expanded(
                child: ListView.separated(
                  itemCount: _categories.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, i) {
                    final cat = _categories[i];
                    final key = cat['key'] as String;
                    final enabled = _consents[key] ?? false;
                    return _ConsentCard(
                      icon: cat['icon'] as IconData,
                      title: cat['title'] as String,
                      desc: cat['desc'] as String,
                      benefit: cat['benefit'] as String,
                      enabled: enabled,
                      secondary: secondary,
                      isDark: isDark,
                      onToggle: (v) => setState(() => _consents[key] = v),
                    );
                  },
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              // Active consents summary
              if (_activeConsents.isNotEmpty)
                Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 12),
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
                          '${_activeConsents.length} data ${_activeConsents.length == 1 ? 'category' : 'categories'} will be shared with lenders.',
                          style: AppTypography.caption.copyWith(color: secondary),
                        ),
                      ),
                    ],
                  ),
                ),
              CsButton(
                label: 'Continue',
                onPressed: () {
                  _simulateFetch();
                  Future.delayed(const Duration(seconds: 2), () {
                    if (!context.mounted) return;
                    context.push('/rbi-compliance');
                  });
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ConsentCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String desc;
  final String benefit;
  final bool enabled;
  final Color secondary;
  final bool isDark;
  final void Function(bool) onToggle;

  const _ConsentCard({
    required this.icon,
    required this.title,
    required this.desc,
    required this.benefit,
    required this.enabled,
    required this.secondary,
    required this.isDark,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: enabled
            ? secondary.withValues(alpha: 0.06)
            : (isDark ? AppColors.cardDark : AppColors.cardLight),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: enabled ? secondary.withValues(alpha: 0.4) : (isDark ? AppColors.borderDark : AppColors.borderLight),
          width: enabled ? 1.5 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: enabled ? secondary.withValues(alpha: 0.15) : secondary.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: secondary, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(title,
                    style: AppTypography.body.copyWith(fontWeight: FontWeight.w600)),
              ),
              Switch(
                value: enabled,
                onChanged: onToggle,
                activeColor: secondary,
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(desc, style: AppTypography.caption.copyWith(
            color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
          )),
          const SizedBox(height: 6),
          Row(
            children: [
              Icon(Icons.star_outline, size: 14, color: secondary),
              const SizedBox(width: 4),
              Text(benefit, style: AppTypography.caption.copyWith(color: secondary, fontWeight: FontWeight.w500)),
            ],
          ),
        ],
      ),
    );
  }
}

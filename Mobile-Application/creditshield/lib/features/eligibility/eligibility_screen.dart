import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../core/design_system/components/cs_components.dart';

class EligibilityScreen extends StatefulWidget {
  const EligibilityScreen({super.key});

  @override
  State<EligibilityScreen> createState() => _EligibilityScreenState();
}

class _EligibilityScreenState extends State<EligibilityScreen> {
  String? _incomeRange;
  String? _loanType;
  String? _city;
  bool _loading = false;
  bool? _eligible;
  String _citySearch = '';

  static const _incomeRanges = [
    'Below ₹10,000', '₹10,000 – ₹25,000', '₹25,000 – ₹50,000',
    '₹50,000 – ₹1,00,000', 'Above ₹1,00,000',
  ];
  static const _loanTypes = ['Personal Loan', 'Gold Loan', 'Home Loan', 'Car Loan', 'Education Loan'];
  static const _cities = [
    'Mumbai, Maharashtra', 'Delhi, NCR', 'Bengaluru, Karnataka',
    'Chennai, Tamil Nadu', 'Hyderabad, Telangana', 'Pune, Maharashtra',
    'Kolkata, West Bengal', 'Ahmedabad, Gujarat', 'Jaipur, Rajasthan',
    'Lucknow, Uttar Pradesh',
  ];

  void _check() {
    if (_incomeRange == null || _loanType == null || _city == null) return;
    setState(() { _loading = true; _eligible = null; });
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() {
          _loading = false;
          _eligible = _incomeRange != 'Below ₹10,000';
        });
      }
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
        title: const Text('Eligibility Check'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.sm),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Check your eligibility\nin seconds',
                  style: AppTypography.heading),
              const SizedBox(height: 6),
              Text('No login required. Just 3 quick inputs.',
                  style: AppTypography.body.copyWith(
                    color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                  )),
              const SizedBox(height: AppSpacing.md),
              // Income Range
              Text('Income Range', style: AppTypography.caption.copyWith(
                color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                fontWeight: FontWeight.w500,
              )),
              const SizedBox(height: 6),
              Container(
                decoration: BoxDecoration(
                  color: isDark ? AppColors.surfaceDark : AppColors.backgroundLight,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: isDark ? AppColors.borderDark : AppColors.borderLight),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _incomeRange,
                    hint: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text('Select monthly income range',
                          style: AppTypography.body.copyWith(
                            color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                          )),
                    ),
                    isExpanded: true,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    borderRadius: BorderRadius.circular(12),
                    items: _incomeRanges.map((r) => DropdownMenuItem(value: r, child: Text(r))).toList(),
                    onChanged: (v) => setState(() => _incomeRange = v),
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              // Loan Type
              Text('Loan Type', style: AppTypography.caption.copyWith(
                color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                fontWeight: FontWeight.w500,
              )),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _loanTypes.map((type) {
                  final selected = _loanType == type;
                  return GestureDetector(
                    onTap: () => setState(() => _loanType = type),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
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
              const SizedBox(height: AppSpacing.sm),
              // City
              Text('City', style: AppTypography.caption.copyWith(
                color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                fontWeight: FontWeight.w500,
              )),
              const SizedBox(height: 6),
              CsInputField(
                label: '',
                hint: 'Search city...',
                onChanged: (v) => setState(() => _citySearch = v),
              ),
              if (_citySearch.isNotEmpty)
                Container(
                  margin: const EdgeInsets.only(top: 4),
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.cardDark : AppColors.cardLight,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: isDark ? AppColors.borderDark : AppColors.borderLight),
                  ),
                  child: Column(
                    children: _cities
                        .where((c) => c.toLowerCase().contains(_citySearch.toLowerCase()))
                        .map((c) => ListTile(
                              dense: true,
                              title: Text(c, style: AppTypography.body),
                              onTap: () => setState(() { _city = c; _citySearch = ''; }),
                            ))
                        .toList(),
                  ),
                ),
              if (_city != null)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Row(
                    children: [
                      Icon(Icons.location_on, color: secondary, size: 16),
                      const SizedBox(width: 4),
                      Text(_city!, style: AppTypography.body.copyWith(color: secondary, fontWeight: FontWeight.w600)),
                      const SizedBox(width: 8),
                      GestureDetector(
                        onTap: () => setState(() => _city = null),
                        child: Icon(Icons.close, size: 16,
                            color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight),
                      ),
                    ],
                  ),
                ),
              const SizedBox(height: AppSpacing.md),
              CsButton(
                label: _loading ? 'Checking...' : 'Check Eligibility',
                isLoading: _loading,
                onPressed: (_incomeRange != null && _loanType != null && _city != null) ? _check : null,
              ),
              if (_eligible != null) ...[
                const SizedBox(height: AppSpacing.md),
                _EligibilityResult(
                  eligible: _eligible!,
                  loanType: _loanType!,
                  secondary: secondary,
                  isDark: isDark,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _EligibilityResult extends StatelessWidget {
  final bool eligible;
  final String loanType;
  final Color secondary;
  final bool isDark;

  const _EligibilityResult({
    required this.eligible,
    required this.loanType,
    required this.secondary,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    if (eligible) {
      return Container(
        padding: const EdgeInsets.all(AppSpacing.sm),
        decoration: BoxDecoration(
          color: AppColors.success.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.success.withValues(alpha: 0.3)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.check_circle, color: AppColors.success, size: 24),
                const SizedBox(width: 8),
                Text('Eligible!',
                    style: AppTypography.subheading.copyWith(color: AppColors.success)),
              ],
            ),
            const SizedBox(height: 8),
            Text('Estimated loan range',
                style: AppTypography.caption.copyWith(
                  color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                )),
            Text('₹25,000 – ₹1,00,000',
                style: AppTypography.heading.copyWith(color: AppColors.success)),
            const SizedBox(height: AppSpacing.sm),
            CsButton(
              label: 'Continue Application',
              onPressed: () {
                final type = loanType.toLowerCase().replaceAll(' loan', '').replaceAll(' ', '_');
                context.push('/loan-type?preSelected=$type');
              },
            ),
          ],
        ),
      );
    }
    return Container(
      padding: const EdgeInsets.all(AppSpacing.sm),
      decoration: BoxDecoration(
        color: AppColors.error.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.error.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.cancel_outlined, color: AppColors.error, size: 24),
              const SizedBox(width: 8),
              Text('Not Eligible',
                  style: AppTypography.subheading.copyWith(color: AppColors.error)),
            ],
          ),
          const SizedBox(height: 8),
          Text('Your income range does not meet the minimum requirement for this loan type.',
              style: AppTypography.body),
          const SizedBox(height: 12),
          Text('What you can do:',
              style: AppTypography.body.copyWith(fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          _Suggestion(icon: Icons.trending_up, text: 'Try a higher income bracket or a lower loan amount'),
          _Suggestion(icon: Icons.swap_horiz, text: 'Consider a Gold Loan — no income requirement'),
        ],
      ),
    );
  }
}

class _Suggestion extends StatelessWidget {
  final IconData icon;
  final String text;
  const _Suggestion({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: AppColors.warning),
          const SizedBox(width: 8),
          Expanded(child: Text(text, style: AppTypography.caption)),
        ],
      ),
    );
  }
}

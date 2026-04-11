import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../core/design_system/components/cs_components.dart';

class LoanTypeScreen extends StatefulWidget {
  final String? preSelected;
  const LoanTypeScreen({super.key, this.preSelected});

  @override
  State<LoanTypeScreen> createState() => _LoanTypeScreenState();
}

class _LoanTypeScreenState extends State<LoanTypeScreen> {
  String? _selected;

  static const _loans = [
    {'type': 'personal', 'icon': Icons.person_outline, 'title': 'Personal Loan', 'desc': 'For any personal need', 'range': '₹10,000 – ₹5,00,000'},
    {'type': 'gold', 'icon': Icons.diamond_outlined, 'title': 'Gold Loan', 'desc': 'Against gold jewellery', 'range': '₹5,000 – ₹50,00,000'},
    {'type': 'home', 'icon': Icons.home_outlined, 'title': 'Home Loan', 'desc': 'Buy your dream home', 'range': '₹5,00,000 – ₹5,00,00,000'},
    {'type': 'car', 'icon': Icons.directions_car_outlined, 'title': 'Car Loan', 'desc': 'New or used vehicle', 'range': '₹1,00,000 – ₹50,00,000'},
    {'type': 'education', 'icon': Icons.school_outlined, 'title': 'Education Loan', 'desc': 'Fund your studies', 'range': '₹50,000 – ₹20,00,000'},
  ];

  @override
  void initState() {
    super.initState();
    _selected = widget.preSelected;
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
        title: const Text('Select Loan Type'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.sm),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('What type of loan\nare you looking for?', style: AppTypography.heading),
              const SizedBox(height: AppSpacing.sm),
              Expanded(
                child: ListView.separated(
                  itemCount: _loans.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, i) {
                    final loan = _loans[i];
                    final isSelected = _selected == loan['type'];
                    return GestureDetector(
                      onTap: () => setState(() => _selected = loan['type'] as String),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? secondary.withValues(alpha: 0.08)
                              : (isDark ? AppColors.cardDark : AppColors.cardLight),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isSelected ? secondary : (isDark ? AppColors.borderDark : AppColors.borderLight),
                            width: isSelected ? 2 : 1,
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 52,
                              height: 52,
                              decoration: BoxDecoration(
                                color: isSelected ? secondary.withValues(alpha: 0.15) : secondary.withValues(alpha: 0.08),
                                borderRadius: BorderRadius.circular(14),
                              ),
                              child: Icon(loan['icon'] as IconData,
                                  color: secondary, size: 26),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(loan['title'] as String,
                                      style: AppTypography.body.copyWith(fontWeight: FontWeight.w600)),
                                  const SizedBox(height: 2),
                                  Text(loan['desc'] as String,
                                      style: AppTypography.caption.copyWith(
                                        color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                                      )),
                                  const SizedBox(height: 4),
                                  Text(loan['range'] as String,
                                      style: AppTypography.caption.copyWith(
                                        color: secondary,
                                        fontWeight: FontWeight.w600,
                                      )),
                                ],
                              ),
                            ),
                            if (isSelected)
                              Icon(Icons.check_circle, color: secondary, size: 24)
                            else
                              Icon(Icons.radio_button_unchecked,
                                  color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                                  size: 24),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              CsButton(
                label: 'Continue',
                onPressed: _selected == null
                    ? null
                    : () => context.push('/loan-application/$_selected'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

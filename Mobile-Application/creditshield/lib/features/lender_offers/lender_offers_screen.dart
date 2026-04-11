import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../core/design_system/components/cs_components.dart';

class LenderOffersScreen extends StatefulWidget {
  const LenderOffersScreen({super.key});

  @override
  State<LenderOffersScreen> createState() => _LenderOffersScreenState();
}

class _LenderOffersScreenState extends State<LenderOffersScreen> {
  final Set<int> _compareSet = {};
  bool _compareMode = false;
  int? _expandedOffer;

  static final _offers = [
    {
      'id': '1',
      'lender': 'HDFC Bank',
      'amount': 50000.0,
      'emi': 4428.0,
      'rate': 10.5,
      'tenure': 12,
      'total': 53136.0,
      'processingFee': '1% of loan amount',
      'prepayment': 'No prepayment charges after 6 months',
    },
    {
      'id': '2',
      'lender': 'ICICI Bank',
      'amount': 50000.0,
      'emi': 4512.0,
      'rate': 11.5,
      'tenure': 12,
      'total': 54144.0,
      'processingFee': '₹999 flat',
      'prepayment': '2% prepayment charge within 12 months',
    },
    {
      'id': '3',
      'lender': 'Bajaj Finserv',
      'amount': 45000.0,
      'emi': 4050.0,
      'rate': 13.0,
      'tenure': 12,
      'total': 48600.0,
      'processingFee': '2% of loan amount',
      'prepayment': 'No prepayment allowed in first 3 months',
    },
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final secondary = isDark ? AppColors.secondaryDark : AppColors.secondary;

    // Sort by EMI ascending
    final sorted = List.from(_offers)..sort((a, b) => (a['emi'] as double).compareTo(b['emi'] as double));

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, size: 20),
          onPressed: () => context.pop(),
        ),
        title: const Text('Lender Offers'),
        actions: [
          TextButton(
            onPressed: () => setState(() => _compareMode = !_compareMode),
            child: Text(
              _compareMode ? 'Done' : 'Compare',
              style: AppTypography.body.copyWith(color: secondary, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            if (_compareMode && _compareSet.length >= 2)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                color: secondary.withValues(alpha: 0.1),
                child: Row(
                  children: [
                    Text('${_compareSet.length} offers selected',
                        style: AppTypography.body.copyWith(color: secondary, fontWeight: FontWeight.w600)),
                    const Spacer(),
                    ElevatedButton(
                      onPressed: () => _showComparison(context, sorted, isDark, secondary),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        minimumSize: Size.zero,
                      ),
                      child: const Text('Compare Now'),
                    ),
                  ],
                ),
              ),
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.all(AppSpacing.sm),
                itemCount: sorted.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, i) {
                  final offer = sorted[i];
                  final expanded = _expandedOffer == i;
                  final inCompare = _compareSet.contains(i);

                  return GestureDetector(
                    onTap: () {
                      if (_compareMode) {
                        setState(() {
                          if (inCompare) {
                            _compareSet.remove(i);
                          } else if (_compareSet.length < 3) {
                            _compareSet.add(i);
                          }
                        });
                      } else {
                        setState(() => _expandedOffer = expanded ? null : i);
                      }
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: inCompare
                            ? secondary.withValues(alpha: 0.08)
                            : (isDark ? AppColors.cardDark : AppColors.cardLight),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: inCompare ? secondary : (isDark ? AppColors.borderDark : AppColors.borderLight),
                          width: inCompare ? 2 : 1,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: secondary.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Center(
                                  child: Text(
                                    (offer['lender'] as String).substring(0, 2).toUpperCase(),
                                    style: AppTypography.body.copyWith(
                                      color: secondary,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(offer['lender'] as String,
                                        style: AppTypography.body.copyWith(fontWeight: FontWeight.w700)),
                                    Text('₹${(offer['amount'] as double).toInt()} • ${offer['tenure']} months',
                                        style: AppTypography.caption.copyWith(
                                          color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                                        )),
                                  ],
                                ),
                              ),
                              if (_compareMode)
                                Icon(
                                  inCompare ? Icons.check_box : Icons.check_box_outline_blank,
                                  color: inCompare ? secondary : (isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight),
                                ),
                            ],
                          ),
                          const SizedBox(height: 14),
                          Row(
                            children: [
                              _OfferStat('Monthly EMI', '₹${(offer['emi'] as double).toInt()}', secondary, isDark),
                              _OfferStat('APR', '${offer['rate']}% p.a.', secondary, isDark),
                              _OfferStat('Total Cost', '₹${(offer['total'] as double).toInt()}', secondary, isDark),
                            ],
                          ),
                          if (expanded) ...[
                            const SizedBox(height: 12),
                            const Divider(height: 1),
                            const SizedBox(height: 12),
                            _DetailRow('Processing Fee', offer['processingFee'] as String, isDark),
                            const SizedBox(height: 6),
                            _DetailRow('Prepayment', offer['prepayment'] as String, isDark),
                            const SizedBox(height: 12),
                            CsButton(
                              label: 'Select This Offer',
                              onPressed: () => context.push('/offer-selection/${offer['id']}'),
                            ),
                          ] else if (!_compareMode) ...[
                            const SizedBox(height: 10),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                Text('Tap to see details',
                                    style: AppTypography.caption.copyWith(
                                      color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                                    )),
                                const SizedBox(width: 4),
                                Icon(Icons.expand_more, size: 16,
                                    color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight),
                              ],
                            ),
                          ],
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showComparison(BuildContext context, List sorted, bool isDark, Color secondary) {
    final selected = _compareSet.map((i) => sorted[i]).toList();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        expand: false,
        builder: (_, ctrl) => Padding(
          padding: const EdgeInsets.all(AppSpacing.sm),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40, height: 4,
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.borderDark : AppColors.borderLight,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              Text('Side-by-Side Comparison', style: AppTypography.subheading),
              const SizedBox(height: AppSpacing.sm),
              Expanded(
                child: SingleChildScrollView(
                  controller: ctrl,
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: selected.map((o) => Container(
                      width: 160,
                      margin: const EdgeInsets.only(right: 12),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.cardDark : AppColors.cardLight,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: isDark ? AppColors.borderDark : AppColors.borderLight),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(o['lender'] as String, style: AppTypography.body.copyWith(fontWeight: FontWeight.w700)),
                          const SizedBox(height: 12),
                          _CompareRow('Amount', '₹${(o['amount'] as double).toInt()}', isDark),
                          _CompareRow('EMI', '₹${(o['emi'] as double).toInt()}', isDark),
                          _CompareRow('Rate', '${o['rate']}%', isDark),
                          _CompareRow('Tenure', '${o['tenure']}M', isDark),
                          _CompareRow('Total', '₹${(o['total'] as double).toInt()}', isDark),
                        ],
                      ),
                    )).toList(),
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

class _OfferStat extends StatelessWidget {
  final String label;
  final String value;
  final Color secondary;
  final bool isDark;

  const _OfferStat(this.label, this.value, this.secondary, this.isDark);

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Text(label, style: AppTypography.caption.copyWith(
            color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
          )),
          const SizedBox(height: 2),
          Text(value, style: AppTypography.body.copyWith(
            color: secondary, fontWeight: FontWeight.w700,
          )),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isDark;

  const _DetailRow(this.label, this.value, this.isDark);

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 110,
          child: Text(label, style: AppTypography.caption.copyWith(
            color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
          )),
        ),
        Expanded(child: Text(value, style: AppTypography.caption.copyWith(fontWeight: FontWeight.w500))),
      ],
    );
  }
}

class _CompareRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isDark;

  const _CompareRow(this.label, this.value, this.isDark);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: AppTypography.caption.copyWith(
            color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
          )),
          Text(value, style: AppTypography.body.copyWith(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../core/design_system/components/cs_components.dart';

class RiskScoreScreen extends StatefulWidget {
  const RiskScoreScreen({super.key});

  @override
  State<RiskScoreScreen> createState() => _RiskScoreScreenState();
}

class _RiskScoreScreenState extends State<RiskScoreScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scoreAnim;
  static const int _score = 720;
  int? _expandedCard;

  static const _factors = [
    {
      'icon': Icons.account_balance_wallet_outlined,
      'label': 'Regular Income',
      'desc': 'Your income has been consistent over the last 6 months.',
      'improve': 'Maintain regular income deposits to keep this factor strong.',
      'positive': true,
    },
    {
      'icon': Icons.credit_score_outlined,
      'label': 'Low Existing Debt',
      'desc': 'You have minimal outstanding loans or credit card dues.',
      'improve': 'Keep your debt-to-income ratio below 40% for best results.',
      'positive': true,
    },
    {
      'icon': Icons.history_outlined,
      'label': 'Short Credit History',
      'desc': 'Your credit history is less than 2 years old.',
      'improve': 'On-time repayments over the next 12 months will significantly improve this.',
      'positive': false,
    },
  ];

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    );
    _scoreAnim = Tween<double>(begin: 0, end: _score / 1000).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic),
    );
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Color get _scoreColor {
    if (_score <= 400) return AppColors.error;
    if (_score <= 600) return AppColors.warning;
    return AppColors.success;
  }

  String get _scoreLabel {
    if (_score <= 400) return 'Needs Improvement';
    if (_score <= 600) return 'Fair';
    return 'Good';
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
        title: const Text('Your Risk Score'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.sm),
          child: Column(
            children: [
              // Gauge
              AnimatedBuilder(
                animation: _scoreAnim,
                builder: (_, __) => _GaugeWidget(
                  progress: _scoreAnim.value,
                  score: (_scoreAnim.value * 1000).toInt(),
                  color: _scoreColor,
                  label: _scoreLabel,
                  isDark: isDark,
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              // Confidence
              CsCard(
                child: Row(
                  children: [
                    Icon(Icons.analytics_outlined, color: secondary, size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Based on 3 data sources',
                              style: AppTypography.body.copyWith(fontWeight: FontWeight.w600)),
                          Text('Data completeness: 78%',
                              style: AppTypography.caption.copyWith(
                                color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                              )),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: secondary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text('78%', style: AppTypography.body.copyWith(
                        color: secondary, fontWeight: FontWeight.w700,
                      )),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              // Pre-approved banner
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(AppSpacing.sm),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [secondary.withValues(alpha: 0.15), secondary.withValues(alpha: 0.05)],
                  ),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: secondary.withValues(alpha: 0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.verified, color: secondary, size: 22),
                        const SizedBox(width: 8),
                        Text('You are pre-approved!',
                            style: AppTypography.subheading.copyWith(color: secondary)),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text('You are pre-approved for up to ₹50,000',
                        style: AppTypography.body),
                    const SizedBox(height: AppSpacing.sm),
                    CsButton(
                      label: 'View Lender Offers',
                      onPressed: () => context.push('/lender-offers'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              Align(
                alignment: Alignment.centerLeft,
                child: Text('What influenced your score',
                    style: AppTypography.subheading),
              ),
              const SizedBox(height: 12),
              ..._factors.asMap().entries.map((entry) {
                final i = entry.key;
                final f = entry.value;
                final expanded = _expandedCard == i;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: GestureDetector(
                    onTap: () => setState(() => _expandedCard = expanded ? null : i),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.cardDark : AppColors.cardLight,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isDark ? AppColors.borderDark : AppColors.borderLight,
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
                                  color: (f['positive'] as bool)
                                      ? AppColors.success.withValues(alpha: 0.1)
                                      : AppColors.warning.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Icon(f['icon'] as IconData,
                                    color: (f['positive'] as bool) ? AppColors.success : AppColors.warning,
                                    size: 20),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(f['label'] as String,
                                    style: AppTypography.body.copyWith(fontWeight: FontWeight.w600)),
                              ),
                              Icon(
                                (f['positive'] as bool) ? Icons.trending_up : Icons.trending_down,
                                color: (f['positive'] as bool) ? AppColors.success : AppColors.warning,
                                size: 20,
                              ),
                              const SizedBox(width: 4),
                              Icon(
                                expanded ? Icons.expand_less : Icons.expand_more,
                                color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                                size: 20,
                              ),
                            ],
                          ),
                          if (expanded) ...[
                            const SizedBox(height: 10),
                            const Divider(height: 1),
                            const SizedBox(height: 10),
                            Text(f['desc'] as String, style: AppTypography.body),
                            const SizedBox(height: 8),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Icon(Icons.lightbulb_outline, size: 16, color: secondary),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: Text(f['improve'] as String,
                                      style: AppTypography.caption.copyWith(color: secondary)),
                                ),
                              ],
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                );
              }),
            ],
          ),
        ),
      ),
    );
  }
}

class _GaugeWidget extends StatelessWidget {
  final double progress;
  final int score;
  final Color color;
  final String label;
  final bool isDark;

  const _GaugeWidget({
    required this.progress,
    required this.score,
    required this.color,
    required this.label,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 200,
      child: CustomPaint(
        painter: _GaugePainter(progress: progress, color: color, isDark: isDark),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              Text('$score',
                  style: TextStyle(
                    fontSize: 48,
                    fontWeight: FontWeight.bold,
                    color: color,
                  )),
              Text(label,
                  style: AppTypography.body.copyWith(
                    color: color,
                    fontWeight: FontWeight.w600,
                  )),
              const SizedBox(height: 8),
              Text('out of 1000',
                  style: AppTypography.caption.copyWith(
                    color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                  )),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}

class _GaugePainter extends CustomPainter {
  final double progress;
  final Color color;
  final bool isDark;

  _GaugePainter({required this.progress, required this.color, required this.isDark});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height * 0.75);
    final radius = size.width * 0.42;
    const startAngle = math.pi;
    const sweepAngle = math.pi;

    // Background arc
    final bgPaint = Paint()
      ..color = (isDark ? AppColors.borderDark : AppColors.borderLight)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 18
      ..strokeCap = StrokeCap.round;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      startAngle, sweepAngle, false, bgPaint,
    );

    // Colored segments
    final segments = [
      (0.0, 0.4, AppColors.error),
      (0.4, 0.6, AppColors.warning),
      (0.6, 1.0, AppColors.success),
    ];
    for (final seg in segments) {
      final segPaint = Paint()
        ..color = seg.$3.withValues(alpha: 0.25)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 18
        ..strokeCap = StrokeCap.butt;
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle + sweepAngle * seg.$1,
        sweepAngle * (seg.$2 - seg.$1),
        false, segPaint,
      );
    }

    // Progress arc
    final progressPaint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 18
      ..strokeCap = StrokeCap.round;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      startAngle, sweepAngle * progress, false, progressPaint,
    );
  }

  @override
  bool shouldRepaint(_GaugePainter old) => old.progress != progress;
}

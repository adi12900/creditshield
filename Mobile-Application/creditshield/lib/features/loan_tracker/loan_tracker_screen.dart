import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../app/app_state.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../auth/auth_api_service.dart';

enum StageStatus { completed, active, pending, actionRequired }

class _Stage {
  final String label;
  final StageStatus status;

  const _Stage(this.label, this.status);
}

class LoanTrackerScreen extends StatefulWidget {
  const LoanTrackerScreen({super.key});

  @override
  State<LoanTrackerScreen> createState() => _LoanTrackerScreenState();
}

class _LoanTrackerScreenState extends State<LoanTrackerScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  final AuthApiService _authApi = AuthApiService();
  bool _loading = true;
  String? _error;
  String? _applicationId;
  String _currentStage = 'No active application';
  List<_Stage> _stages = const [];

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat(reverse: true);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadTracker();
    });
  }

  Future<void> _loadTracker() async {
    final token = context.read<AppState>().authToken;
    if (token == null || token.isEmpty) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Session expired. Please login again.';
      });
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final tracker = await _authApi.getTracker(token);
      if (!mounted) return;
      setState(() {
        _applicationId = tracker.applicationId;
        _currentStage = tracker.stage;
        _stages = _buildStages(tracker.stage);
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  List<_Stage> _buildStages(String currentStage) {
    if (currentStage == 'No active application') {
      return const [_Stage('No active application', StageStatus.pending)];
    }

    const ordered = [
      'Submitted',
      'KYC Verified',
      'Underwriting',
      'Offer Sent',
      'Disbursed',
    ];

    var currentIndex = ordered.indexWhere(
      (s) => s.toLowerCase() == currentStage.toLowerCase(),
    );
    if (currentIndex < 0) {
      currentIndex = 0;
    }

    return List.generate(ordered.length, (i) {
      if (i < currentIndex) {
        return _Stage(ordered[i], StageStatus.completed);
      }
      if (i == currentIndex) {
        return _Stage(ordered[i], StageStatus.active);
      }
      return _Stage(ordered[i], StageStatus.pending);
    });
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final secondary = isDark ? AppColors.secondaryDark : AppColors.secondary;
    final muted = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    if (_loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_error != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Application Tracker')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.sm),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(_error!, style: AppTypography.body),
                const SizedBox(height: AppSpacing.sm),
                ElevatedButton(onPressed: _loadTracker, child: const Text('Retry')),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, size: 20),
          onPressed: () => context.pop(),
        ),
        title: const Text('Application Tracker'),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Header info
            Container(
              margin: const EdgeInsets.all(AppSpacing.sm),
              padding: const EdgeInsets.all(AppSpacing.sm),
              decoration: BoxDecoration(
                color: isDark ? AppColors.cardDark : AppColors.cardLight,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: isDark ? AppColors.borderDark : AppColors.borderLight),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Reference No.', style: AppTypography.caption.copyWith(color: muted)),
                        Text(_applicationId ?? 'NA',
                            style: AppTypography.body.copyWith(fontWeight: FontWeight.w700)),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text('Submitted', style: AppTypography.caption.copyWith(color: muted)),
                      Text(_currentStage, style: AppTypography.body.copyWith(fontWeight: FontWeight.w600)),
                    ],
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
                itemCount: _stages.length,
                itemBuilder: (context, i) {
                  final stage = _stages[i];
                  final isLast = i == _stages.length - 1;
                  return _StageItem(
                    stage: stage,
                    isLast: isLast,
                    secondary: secondary,
                    muted: muted,
                    isDark: isDark,
                    pulseController: _pulseController,
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StageItem extends StatelessWidget {
  final _Stage stage;
  final bool isLast;
  final Color secondary;
  final Color muted;
  final bool isDark;
  final AnimationController pulseController;

  const _StageItem({
    required this.stage,
    required this.isLast,
    required this.secondary,
    required this.muted,
    required this.isDark,
    required this.pulseController,
  });

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Timeline column
          SizedBox(
            width: 40,
            child: Column(
              children: [
                _buildDot(),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      color: stage.status == StageStatus.completed
                          ? secondary
                          : (isDark ? AppColors.borderDark : AppColors.borderLight),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          // Content
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    stage.label,
                    style: AppTypography.body.copyWith(
                      fontWeight: stage.status == StageStatus.active
                          ? FontWeight.w700
                          : FontWeight.w500,
                      color: stage.status == StageStatus.pending ? muted : null,
                    ),
                  ),
                  if (stage.status == StageStatus.active) ...[
                    const SizedBox(height: 4),
                    Text('In progress — We\'ll notify you as soon as there\'s an update.',
                        style: AppTypography.caption.copyWith(color: secondary)),
                  ],
                  if (stage.status == StageStatus.actionRequired) ...[
                    const SizedBox(height: 8),
                    ElevatedButton.icon(
                      onPressed: () {},
                      icon: const Icon(Icons.upload_outlined, size: 16),
                      label: const Text('Upload Document'),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        minimumSize: Size.zero,
                        textStyle: AppTypography.caption,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDot() {
    switch (stage.status) {
      case StageStatus.completed:
        return Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(color: secondary, shape: BoxShape.circle),
          child: const Icon(Icons.check, color: Colors.white, size: 16),
        );
      case StageStatus.active:
        return AnimatedBuilder(
          animation: pulseController,
          builder: (_, __) => Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: secondary.withValues(alpha: 0.2 + 0.3 * pulseController.value),
              shape: BoxShape.circle,
              border: Border.all(color: secondary, width: 2),
            ),
            child: Center(
              child: Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(color: secondary, shape: BoxShape.circle),
              ),
            ),
          ),
        );
      case StageStatus.actionRequired:
        return Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: AppColors.warning.withValues(alpha: 0.1),
            shape: BoxShape.circle,
            border: Border.all(color: AppColors.warning, width: 2),
          ),
          child: const Icon(Icons.warning_amber_outlined, color: AppColors.warning, size: 16),
        );
      case StageStatus.pending:
        return Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(
              color: isDark ? AppColors.borderDark : AppColors.borderLight,
              width: 2,
            ),
          ),
        );
    }
  }
}

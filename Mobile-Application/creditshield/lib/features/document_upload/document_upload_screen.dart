import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../core/design_system/components/cs_components.dart';

class DocumentUploadScreen extends StatefulWidget {
  final String loanType;
  const DocumentUploadScreen({super.key, required this.loanType});

  @override
  State<DocumentUploadScreen> createState() => _DocumentUploadScreenState();
}

class _DocumentUploadScreenState extends State<DocumentUploadScreen> {
  final Map<String, bool> _uploaded = {};

  List<Map<String, dynamic>> get _docs {
    switch (widget.loanType) {
      case 'home':
        return [
          {'key': 'sale_deed', 'label': 'Sale Deed / Agreement', 'mandatory': true},
          {'key': 'property_tax', 'label': 'Property Tax Receipt', 'mandatory': true},
        ];
      case 'gold':
        return [
          {'key': 'gold_photo_1', 'label': 'Gold Photo 1', 'mandatory': true},
          {'key': 'gold_photo_2', 'label': 'Gold Photo 2', 'mandatory': true},
          {'key': 'self_declaration', 'label': 'Self-Declaration Form', 'mandatory': true},
        ];
      case 'education':
        return [
          {'key': 'admission_letter', 'label': 'College Admission Letter', 'mandatory': true},
          {'key': 'fee_structure', 'label': 'Fee Structure Document', 'mandatory': true},
        ];
      case 'car':
        return [
          {'key': 'dealer_invoice', 'label': 'Dealer Invoice', 'mandatory': true},
          {'key': 'vehicle_quotation', 'label': 'Vehicle Quotation', 'mandatory': true},
        ];
      default:
        return [
          {'key': 'salary_slip_1', 'label': 'Salary Slip — Month 1', 'mandatory': true},
          {'key': 'salary_slip_2', 'label': 'Salary Slip — Month 2', 'mandatory': true},
          {'key': 'salary_slip_3', 'label': 'Salary Slip — Month 3', 'mandatory': true},
          {'key': 'bank_statement', 'label': 'Bank Statement (6 months)', 'mandatory': true},
        ];
    }
  }

  bool get _allUploaded => _docs.every((d) => _uploaded[d['key']] == true);

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
        title: const Text('Upload Documents'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.sm),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Required Documents', style: AppTypography.subheading),
              const SizedBox(height: 6),
              Text('Upload the following documents for your ${widget.loanType} loan application.',
                  style: AppTypography.body.copyWith(
                    color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                  )),
              const SizedBox(height: AppSpacing.sm),
              Expanded(
                child: ListView.separated(
                  itemCount: _docs.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, i) {
                    final doc = _docs[i];
                    final key = doc['key'] as String;
                    final uploaded = _uploaded[key] == true;
                    return _DocCard(
                      label: doc['label'] as String,
                      mandatory: doc['mandatory'] as bool,
                      uploaded: uploaded,
                      secondary: secondary,
                      isDark: isDark,
                      onUpload: (source) => setState(() => _uploaded[key] = true),
                      onReupload: () => setState(() => _uploaded[key] = false),
                    );
                  },
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              if (_allUploaded)
                Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: AppColors.success.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.success.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.check_circle, color: AppColors.success, size: 18),
                      const SizedBox(width: 8),
                      Text('All documents uploaded successfully!',
                          style: AppTypography.body.copyWith(color: AppColors.success, fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
              CsButton(
                label: 'Proceed',
                onPressed: _allUploaded ? () => context.push('/consent') : null,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DocCard extends StatelessWidget {
  final String label;
  final bool mandatory;
  final bool uploaded;
  final Color secondary;
  final bool isDark;
  final void Function(String) onUpload;
  final VoidCallback onReupload;

  const _DocCard({
    required this.label,
    required this.mandatory,
    required this.uploaded,
    required this.secondary,
    required this.isDark,
    required this.onUpload,
    required this.onReupload,
  });

  void _showUploadOptions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(AppSpacing.sm),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(width: 40, height: 4, decoration: BoxDecoration(
              color: isDark ? AppColors.borderDark : AppColors.borderLight,
              borderRadius: BorderRadius.circular(2),
            )),
            const SizedBox(height: AppSpacing.sm),
            Text('Upload Document', style: AppTypography.subheading),
            const SizedBox(height: AppSpacing.sm),
            ListTile(
              leading: Icon(Icons.camera_alt_outlined, color: secondary),
              title: const Text('Camera'),
              onTap: () { Navigator.pop(context); onUpload('camera'); },
            ),
            ListTile(
              leading: Icon(Icons.photo_library_outlined, color: secondary),
              title: const Text('Gallery'),
              onTap: () { Navigator.pop(context); onUpload('gallery'); },
            ),
            ListTile(
              leading: Icon(Icons.folder_outlined, color: secondary),
              title: const Text('DigiLocker'),
              onTap: () { Navigator.pop(context); onUpload('digilocker'); },
            ),
            const SizedBox(height: AppSpacing.xs),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: uploaded
            ? AppColors.success.withValues(alpha: 0.06)
            : (isDark ? AppColors.cardDark : AppColors.cardLight),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: uploaded ? AppColors.success.withValues(alpha: 0.4) : (isDark ? AppColors.borderDark : AppColors.borderLight),
          width: uploaded ? 1.5 : 1,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: uploaded ? AppColors.success.withValues(alpha: 0.1) : secondary.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              uploaded ? Icons.description : Icons.description_outlined,
              color: uploaded ? AppColors.success : secondary,
              size: 24,
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
                      child: Text(label,
                          style: AppTypography.body.copyWith(fontWeight: FontWeight.w600)),
                    ),
                    if (mandatory)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.error.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text('Required',
                            style: AppTypography.caption.copyWith(color: AppColors.error, fontSize: 10)),
                      ),
                  ],
                ),
                const SizedBox(height: 4),
                if (uploaded)
                  Text('Uploaded • JPEG • 2.1 MB',
                      style: AppTypography.caption.copyWith(color: AppColors.success))
                else
                  Text('JPEG, PNG, PDF • Max 5MB',
                      style: AppTypography.caption.copyWith(
                        color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                      )),
              ],
            ),
          ),
          const SizedBox(width: 8),
          if (uploaded)
            TextButton(
              onPressed: onReupload,
              child: Text('Re-upload',
                  style: AppTypography.caption.copyWith(color: secondary, fontWeight: FontWeight.w600)),
            )
          else
            IconButton(
              onPressed: () => _showUploadOptions(context),
              icon: Icon(Icons.upload_outlined, color: secondary),
            ),
        ],
      ),
    );
  }
}

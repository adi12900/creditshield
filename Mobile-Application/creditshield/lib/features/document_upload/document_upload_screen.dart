import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:flutter/services.dart';

import '../../app/app_state.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../core/design_system/components/cs_components.dart';
import '../auth/auth_api_service.dart';

class DocumentUploadScreen extends StatefulWidget {
  final String loanType;
  final String? applicationId;
  final String? employmentType;

  const DocumentUploadScreen({
    super.key,
    required this.loanType,
    required this.applicationId,
    required this.employmentType,
  });

  @override
  State<DocumentUploadScreen> createState() => _DocumentUploadScreenState();
}

class _DocumentUploadScreenState extends State<DocumentUploadScreen> {
  final Map<String, bool> _uploaded = {};
  final Map<String, _SelectedDocument> _selectedDocs = {};
  final Set<String> _uploading = <String>{};
  final AuthApiService _authApi = AuthApiService();
  final ImagePicker _imagePicker = ImagePicker();
  List<Map<String, dynamic>> _requiredDocs = const [];
  bool _loadingRequiredDocs = true;

  bool get _hasApplicationId =>
      widget.applicationId != null && widget.applicationId!.trim().isNotEmpty;

  String get _employmentType =>
      (widget.employmentType == null || widget.employmentType!.trim().isEmpty)
      ? 'Salaried'
      : widget.employmentType!.trim();

  List<Map<String, dynamic>> get _docs =>
      _requiredDocs.isNotEmpty ? _requiredDocs : _fallbackRequiredDocs();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadRequiredDocs();
    });
  }

  Future<void> _loadRequiredDocs() async {
    final token = context.read<AppState>().authToken;
    if (!_hasApplicationId || token == null || token.isEmpty) {
      if (!mounted) return;
      setState(() => _loadingRequiredDocs = false);
      return;
    }

    try {
      final docs = await _authApi.getRequiredDocumentsForApplication(
        accessToken: token,
        applicationId: widget.applicationId!.trim(),
      );
      if (!mounted) return;
      setState(() {
        _requiredDocs = docs
            .map(
              (d) => {'key': d.code, 'label': d.name, 'mandatory': d.required},
            )
            .toList();
        _loadingRequiredDocs = false;
      });
    } catch (e) {
      if (!mounted) return;
      final errorText = e.toString();
      if (errorText.contains('401') ||
          errorText.contains('Unauthorized') ||
          errorText.contains('Missing or invalid Authorization header') ||
          errorText.contains('Invalid or expired token')) {
        context.go('/session-reauth');
        return;
      }
      setState(() => _loadingRequiredDocs = false);
    }
  }

  List<Map<String, dynamic>> _fallbackRequiredDocs() {
    final normalizedLoanType = widget.loanType.trim().toLowerCase();
    final normalizedEmployment = _employmentType
        .trim()
        .toLowerCase()
        .replaceAll('-', ' ');

    if (normalizedLoanType == 'home') {
      return [
        {
          'key': 'sale_deed',
          'label': 'Sale Deed / Agreement',
          'mandatory': true,
        },
        {
          'key': 'property_tax',
          'label': 'Property Tax Receipt',
          'mandatory': true,
        },
      ];
    }
    if (normalizedLoanType == 'gold') {
      return [
        {'key': 'gold_photo_1', 'label': 'Gold Photo 1', 'mandatory': true},
        {'key': 'gold_photo_2', 'label': 'Gold Photo 2', 'mandatory': true},
        {
          'key': 'self_declaration',
          'label': 'Self-Declaration Form',
          'mandatory': true,
        },
      ];
    }
    if (normalizedLoanType == 'education') {
      final docs = [
        {
          'key': 'admission_letter',
          'label': 'Admission Letter',
          'mandatory': true,
        },
        {
          'key': 'fee_structure',
          'label': 'Fee Structure Document',
          'mandatory': true,
        },
      ];
      if (normalizedEmployment == 'student') {
        docs.addAll([
          {
            'key': 'co_applicant_income_proof',
            'label': 'Co-Applicant Income Proof',
            'mandatory': true,
          },
          {
            'key': 'guardian_bank_statement',
            'label': 'Guardian Bank Statement',
            'mandatory': true,
          },
        ]);
      }
      return docs;
    }
    if (normalizedLoanType == 'car') {
      return [
        {'key': 'dealer_invoice', 'label': 'Dealer Invoice', 'mandatory': true},
        {
          'key': 'vehicle_quotation',
          'label': 'Vehicle Quotation',
          'mandatory': true,
        },
      ];
    }

    if (normalizedEmployment == 'salaried') {
      return [
        {
          'key': 'salary_slip_1',
          'label': 'Salary Slip — Month 1',
          'mandatory': true,
        },
        {
          'key': 'salary_slip_2',
          'label': 'Salary Slip — Month 2',
          'mandatory': true,
        },
        {
          'key': 'salary_slip_3',
          'label': 'Salary Slip — Month 3',
          'mandatory': true,
        },
        {
          'key': 'bank_statement',
          'label': 'Bank Statement (6 months)',
          'mandatory': true,
        },
      ];
    }

    if (normalizedEmployment == 'student') {
      return [
        {
          'key': 'student_id_card',
          'label': 'Student ID Card',
          'mandatory': true,
        },
        {
          'key': 'co_applicant_income_proof',
          'label': 'Co-Applicant Income Proof',
          'mandatory': true,
        },
        {
          'key': 'guardian_bank_statement',
          'label': 'Guardian Bank Statement',
          'mandatory': true,
        },
      ];
    }

    return [
      {
        'key': 'itr_last_2_years',
        'label': 'ITR (Last 2 Years)',
        'mandatory': true,
      },
      {
        'key': 'bank_statement_12m',
        'label': 'Bank Statement (12 months)',
        'mandatory': true,
      },
      {'key': 'business_proof', 'label': 'Business Proof', 'mandatory': true},
    ];
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
              Text(
                'Upload the following documents for your ${widget.loanType} loan application.',
                style: AppTypography.body.copyWith(
                  color: isDark
                      ? AppColors.textSecondaryDark
                      : AppColors.textSecondaryLight,
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              if (_loadingRequiredDocs)
                const Padding(
                  padding: EdgeInsets.only(bottom: 12),
                  child: LinearProgressIndicator(),
                ),
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
                      uploading: _uploading.contains(key),
                      selectedDoc: _selectedDocs[key],
                      secondary: secondary,
                      isDark: isDark,
                      onUpload: (source) => _pickAndUploadDoc(key, source),
                      onReupload: () => setState(() {
                        _uploaded[key] = false;
                        _selectedDocs.remove(key);
                      }),
                    );
                  },
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              if (!_hasApplicationId)
                Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: AppColors.error.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: AppColors.error.withValues(alpha: 0.25),
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.error_outline,
                        color: AppColors.error,
                        size: 18,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Missing application ID. Please go back and submit the loan application first.',
                          style: AppTypography.caption.copyWith(
                            color: AppColors.error,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              if (_allUploaded)
                Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: AppColors.success.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: AppColors.success.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.check_circle,
                        color: AppColors.success,
                        size: 18,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'All documents uploaded successfully!',
                        style: AppTypography.body.copyWith(
                          color: AppColors.success,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              CsButton(
                label: 'Proceed',
                onPressed: (_allUploaded && _hasApplicationId)
                    ? () => context.push('/consent')
                    : null,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _pickAndUploadDoc(String key, String source) async {
    if (!_hasApplicationId) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Missing application ID. Please resubmit application.'),
        ),
      );
      return;
    }

    final accessToken = context.read<AppState>().authToken;
    if (accessToken == null || accessToken.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Session expired. Please login again.')),
      );
      return;
    }

    _SelectedDocument? selected;
    try {
      selected = await _pickDocument(source);
    } on MissingPluginException {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Document picker plugin not loaded. Stop app and run again (full restart).',
          ),
        ),
      );
      return;
    } on PlatformException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            e.message ??
                'Could not open picker. Stop app and run again (full restart).',
          ),
        ),
      );
      return;
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Could not open picker: $e')));
      return;
    }

    if (selected == null) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('No file selected.')));
      return;
    }

    setState(() => _uploading.add(key));
    try {
      await _authApi.uploadApplicationDocument(
        accessToken: accessToken,
        applicationId: widget.applicationId!.trim(),
        docType: key,
        status: 'Pending OCR',
        storageUrl: selected.storageUrl,
      );
      if (!mounted) return;
      setState(() {
        _uploading.remove(key);
        _uploaded[key] = true;
        _selectedDocs[key] = selected!;
      });
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('${selected.fileName} uploaded')));
    } catch (e) {
      if (!mounted) return;
      setState(() => _uploading.remove(key));
      final errorText = e.toString();
      if (errorText.contains('401') ||
          errorText.contains('Unauthorized') ||
          errorText.contains('Missing or invalid Authorization header') ||
          errorText.contains('Invalid or expired token')) {
        context.go('/session-reauth');
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
      );
    }
  }

  Future<_SelectedDocument?> _pickDocument(String source) async {
    if (source == 'camera') {
      final file = await _imagePicker.pickImage(
        source: ImageSource.camera,
        imageQuality: 90,
      );
      if (file == null) return null;
      return _SelectedDocument(
        fileName: _fileNameFromPath(file.path),
        sizeBytes: await file.length(),
        source: source,
        storageUrl: 'picked://$source/${_fileNameFromPath(file.path)}',
      );
    }

    if (source == 'gallery') {
      final file = await _imagePicker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 90,
      );
      if (file == null) return null;
      return _SelectedDocument(
        fileName: _fileNameFromPath(file.path),
        sizeBytes: await file.length(),
        source: source,
        storageUrl: 'picked://$source/${_fileNameFromPath(file.path)}',
      );
    }

    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: const ['pdf', 'jpg', 'jpeg', 'png'],
      withData: false,
    );
    if (result == null || result.files.isEmpty) return null;

    final picked = result.files.first;
    final fileName = picked.name.trim().isEmpty ? 'document' : picked.name;
    return _SelectedDocument(
      fileName: fileName,
      sizeBytes: picked.size,
      source: source,
      storageUrl: 'picked://$source/$fileName',
    );
  }

  String _fileNameFromPath(String path) {
    final normalized = path.replaceAll('\\', '/');
    final segments = normalized.split('/');
    if (segments.isEmpty) return 'document';
    return segments.last.trim().isEmpty ? 'document' : segments.last;
  }
}

class _DocCard extends StatelessWidget {
  final String label;
  final bool mandatory;
  final bool uploaded;
  final bool uploading;
  final _SelectedDocument? selectedDoc;
  final Color secondary;
  final bool isDark;
  final void Function(String) onUpload;
  final VoidCallback onReupload;

  const _DocCard({
    required this.label,
    required this.mandatory,
    required this.uploaded,
    required this.uploading,
    required this.selectedDoc,
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
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: isDark ? AppColors.borderDark : AppColors.borderLight,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text('Upload Document', style: AppTypography.subheading),
            const SizedBox(height: AppSpacing.sm),
            ListTile(
              leading: Icon(Icons.camera_alt_outlined, color: secondary),
              title: const Text('Camera'),
              onTap: () {
                Navigator.pop(context);
                onUpload('camera');
              },
            ),
            ListTile(
              leading: Icon(Icons.photo_library_outlined, color: secondary),
              title: const Text('Gallery'),
              onTap: () {
                Navigator.pop(context);
                onUpload('gallery');
              },
            ),
            ListTile(
              leading: Icon(Icons.folder_outlined, color: secondary),
              title: const Text('DigiLocker'),
              onTap: () {
                Navigator.pop(context);
                onUpload('digilocker');
              },
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
          color: uploaded
              ? AppColors.success.withValues(alpha: 0.4)
              : (isDark ? AppColors.borderDark : AppColors.borderLight),
          width: uploaded ? 1.5 : 1,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: uploaded
                  ? AppColors.success.withValues(alpha: 0.1)
                  : secondary.withValues(alpha: 0.08),
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
                      child: Text(
                        label,
                        style: AppTypography.body.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    if (mandatory)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.error.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          'Required',
                          style: AppTypography.caption.copyWith(
                            color: AppColors.error,
                            fontSize: 10,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 4),
                if (uploaded)
                  Text(
                    'Uploaded • ${selectedDoc?.displayLabel ?? 'Document'}',
                    style: AppTypography.caption.copyWith(
                      color: AppColors.success,
                    ),
                  )
                else
                  Text(
                    'JPEG, PNG, PDF • Max 5MB',
                    style: AppTypography.caption.copyWith(
                      color: isDark
                          ? AppColors.textSecondaryDark
                          : AppColors.textSecondaryLight,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          if (uploaded)
            TextButton(
              onPressed: onReupload,
              child: Text(
                'Re-upload',
                style: AppTypography.caption.copyWith(
                  color: secondary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            )
          else
            IconButton(
              onPressed: uploading ? null : () => _showUploadOptions(context),
              icon: uploading
                  ? SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: secondary,
                      ),
                    )
                  : Icon(Icons.upload_outlined, color: secondary),
            ),
        ],
      ),
    );
  }
}

class _SelectedDocument {
  final String fileName;
  final int sizeBytes;
  final String source;
  final String storageUrl;

  const _SelectedDocument({
    required this.fileName,
    required this.sizeBytes,
    required this.source,
    required this.storageUrl,
  });

  String get displayLabel {
    final kb = sizeBytes / 1024;
    final sizeText = kb >= 1024
        ? '${(kb / 1024).toStringAsFixed(1)} MB'
        : '${kb.toStringAsFixed(0)} KB';
    return '$fileName • $sizeText';
  }
}

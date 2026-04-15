import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../app/app_state.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../core/design_system/components/cs_components.dart';
import '../auth/auth_api_service.dart';

class LoanApplicationScreen extends StatefulWidget {
  final String loanType;
  final int initialStep;

  const LoanApplicationScreen({
    super.key,
    required this.loanType,
    this.initialStep = 1,
  });

  @override
  State<LoanApplicationScreen> createState() => _LoanApplicationScreenState();
}

class _LoanApplicationScreenState extends State<LoanApplicationScreen> {
  late int _step;
  double _loanAmount = 50000;
  int _tenure = 12;

  bool _showValidation = false;
  bool _hasCoApplicant = false;
  bool _submittingApplication = false;
  final Map<String, String> _errors = {};
  final AuthApiService _authApi = AuthApiService();

  final _lenders = const [
    'State Bank of India (SBI)',
    'Punjab National Bank (PNB)',
    'Bank of Baroda',
    'Canara Bank',
    'Union Bank of India',
    'Indian Bank',
  ];
  String _selectedLender = 'State Bank of India (SBI)';

  String _employmentType = 'Salaried';

  bool get _isStudent => _employmentType == 'Student';
  bool get _isSalaried => _employmentType == 'Salaried';

  final _nameCtrl = TextEditingController();
  final _mobileCtrl = TextEditingController();
  final _dobCtrl = TextEditingController(text: '15/08/1995');
  final _panCtrl = TextEditingController(text: 'ABCDE1234F');
  final _aadhaarCtrl = TextEditingController(text: '456712349876');
  final _emailCtrl = TextEditingController();
  final _addressCtrl = TextEditingController(text: '42, MG Road');
  final _cityCtrl = TextEditingController(text: 'Bengaluru');
  final _stateCtrl = TextEditingController(text: 'Karnataka');
  final _pincodeCtrl = TextEditingController(text: '560001');
  final _occupationCtrl = TextEditingController();
  final _employerCtrl = TextEditingController();
  final _incomeCtrl = TextEditingController();
  final _householdIncomeCtrl = TextEditingController();
  final _monthlyObligationCtrl = TextEditingController();

  final _coNameCtrl = TextEditingController();
  final _coRelationCtrl = TextEditingController();

  final _goldWeightCtrl = TextEditingController();
  final _goldTypeCtrl = TextEditingController(text: 'Jewellery');
  final _goldPurityCtrl = TextEditingController(text: '22K');
  final _goldItemCountCtrl = TextEditingController();
  final _goldValuationPerGramCtrl = TextEditingController();
  final _goldTotalValuationCtrl = TextEditingController();
  final _goldLtvCtrl = TextEditingController();

  final _propertyValueCtrl = TextEditingController();
  final _propertyLocationCtrl = TextEditingController();
  final _homePropertyTypeCtrl = TextEditingController(text: 'Flat');
  final _homePropertyStatusCtrl = TextEditingController(text: 'Ready');
  final _homeBuilderCtrl = TextEditingController();
  final _homeDownPaymentCtrl = TextEditingController();
  final _homeLtvCtrl = TextEditingController();
  final _homePurposeCtrl = TextEditingController(text: 'Buy');

  final _vehicleModelCtrl = TextEditingController();
  final _onRoadPriceCtrl = TextEditingController();
  final _collegeCtrl = TextEditingController();
  final _educationCourseCtrl = TextEditingController();
  final _educationSpecializationCtrl = TextEditingController();
  final _educationUniversityCtrl = TextEditingController();
  final _educationAdmissionStatusCtrl = TextEditingController(text: 'Pending');
  final _educationEntranceExamCtrl = TextEditingController();
  final _educationEntranceScoreCtrl = TextEditingController();
  final _educationCourseDurationCtrl = TextEditingController();
  final _educationYearCtrl = TextEditingController();
  final _educationTuitionCtrl = TextEditingController();
  final _educationHostelCtrl = TextEditingController();
  final _educationOtherExpensesCtrl = TextEditingController();
  final List<_AcademicPercentageEntry> _academicPercentageEntries = [];

  @override
  void initState() {
    super.initState();
    _step = widget.initialStep;
    final appState = context.read<AppState>();
    _nameCtrl.text = appState.borrowerName ?? '';
    _mobileCtrl.text = appState.borrowerMobile ?? '';
    _emailCtrl.text = appState.borrowerEmail ?? '';
    _academicPercentageEntries.addAll([
      _AcademicPercentageEntry(level: '10th'),
      _AcademicPercentageEntry(level: 'SSC'),
    ]);
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _mobileCtrl.dispose();
    _dobCtrl.dispose();
    _panCtrl.dispose();
    _aadhaarCtrl.dispose();
    _emailCtrl.dispose();
    _addressCtrl.dispose();
    _cityCtrl.dispose();
    _stateCtrl.dispose();
    _pincodeCtrl.dispose();
    _occupationCtrl.dispose();
    _employerCtrl.dispose();
    _incomeCtrl.dispose();
    _householdIncomeCtrl.dispose();
    _monthlyObligationCtrl.dispose();
    _coNameCtrl.dispose();
    _coRelationCtrl.dispose();
    _goldWeightCtrl.dispose();
    _propertyValueCtrl.dispose();
    _propertyLocationCtrl.dispose();
    _vehicleModelCtrl.dispose();
    _onRoadPriceCtrl.dispose();
    _collegeCtrl.dispose();
    _goldTypeCtrl.dispose();
    _goldPurityCtrl.dispose();
    _goldItemCountCtrl.dispose();
    _goldValuationPerGramCtrl.dispose();
    _goldTotalValuationCtrl.dispose();
    _goldLtvCtrl.dispose();
    _homePropertyTypeCtrl.dispose();
    _homePropertyStatusCtrl.dispose();
    _homeBuilderCtrl.dispose();
    _homeDownPaymentCtrl.dispose();
    _homeLtvCtrl.dispose();
    _homePurposeCtrl.dispose();
    _educationCourseCtrl.dispose();
    _educationSpecializationCtrl.dispose();
    _educationUniversityCtrl.dispose();
    _educationAdmissionStatusCtrl.dispose();
    _educationEntranceExamCtrl.dispose();
    _educationEntranceScoreCtrl.dispose();
    _educationCourseDurationCtrl.dispose();
    _educationYearCtrl.dispose();
    _educationTuitionCtrl.dispose();
    _educationHostelCtrl.dispose();
    _educationOtherExpensesCtrl.dispose();
    for (final entry in _academicPercentageEntries) {
      entry.dispose();
    }
    super.dispose();
  }

  void _addAcademicPercentageEntry() {
    setState(() {
      _academicPercentageEntries.add(_AcademicPercentageEntry());
    });
  }

  void _removeAcademicPercentageEntry(int index) {
    if (index < 0 || index >= _academicPercentageEntries.length) return;
    final entry = _academicPercentageEntries.removeAt(index);
    entry.dispose();
    _errors.remove('academicLevel_$index');
    _errors.remove('academicPercentage_$index');
    setState(() {});
  }

  String get _loanTitle {
    switch (widget.loanType) {
      case 'gold':
        return 'Gold Loan';
      case 'home':
        return 'Home Loan';
      case 'car':
        return 'Car Loan';
      case 'education':
        return 'Education Loan';
      default:
        return 'Personal Loan';
    }
  }

  double get _emi {
    final r = 0.12 / 12;
    final n = _tenure.toDouble();
    if (r == 0) return _loanAmount / n;
    return _loanAmount * r * math.pow(1 + r, n) / (math.pow(1 + r, n) - 1);
  }

  String? _fieldError(String key) => _showValidation ? _errors[key] : null;

  bool _isPositiveNumber(TextEditingController c) {
    final value = double.tryParse(c.text.trim().replaceAll(',', ''));
    return value != null && value > 0;
  }

  int? _optionalInt(TextEditingController c) {
    final text = c.text.trim();
    if (text.isEmpty) return null;
    return int.tryParse(text.replaceAll(',', ''));
  }

  double? _optionalDouble(TextEditingController c) {
    final text = c.text.trim();
    if (text.isEmpty) return null;
    return double.tryParse(text.replaceAll(',', ''));
  }

  Map<String, dynamic> _loanDetailsPayload() {
    List<Map<String, dynamic>> academicPercentages() {
      return _academicPercentageEntries
          .where(
            (entry) =>
                entry.levelCtrl.text.trim().isNotEmpty ||
                entry.percentageCtrl.text.trim().isNotEmpty,
          )
          .map(
            (entry) => {
              'level': entry.levelCtrl.text.trim(),
              'percentage':
                  double.tryParse(entry.percentageCtrl.text.trim()) ?? 0,
            },
          )
          .toList();
    }

    switch (widget.loanType) {
      case 'gold':
        return {
          'gold_type': _goldTypeCtrl.text.trim(),
          'total_weight_grams': _optionalDouble(_goldWeightCtrl),
          'purity_karat': _goldPurityCtrl.text.trim(),
          'item_count': _optionalInt(_goldItemCountCtrl),
          'valuation_per_gram': _optionalDouble(_goldValuationPerGramCtrl),
          'total_valuation': _optionalDouble(_goldTotalValuationCtrl),
          'ltv_ratio': _optionalDouble(_goldLtvCtrl),
          'approved_loan_amount': _loanAmount,
        };
      case 'home':
        return {
          'property_type': _homePropertyTypeCtrl.text.trim(),
          'property_status': _homePropertyStatusCtrl.text.trim(),
          'property_location': _propertyLocationCtrl.text.trim(),
          'builder_name': _homeBuilderCtrl.text.trim(),
          'property_value': _optionalDouble(_propertyValueCtrl),
          'down_payment': _optionalDouble(_homeDownPaymentCtrl),
          'loan_to_value': _optionalDouble(_homeLtvCtrl),
          'purpose': _homePurposeCtrl.text.trim(),
        };
      case 'education':
        return {
          'course_name': _educationCourseCtrl.text.trim(),
          'specialization': _educationSpecializationCtrl.text.trim(),
          'college_name': _collegeCtrl.text.trim(),
          'university_name': _educationUniversityCtrl.text.trim(),
          'admission_status': _educationAdmissionStatusCtrl.text.trim(),
          'entrance_exam': _educationEntranceExamCtrl.text.trim(),
          'entrance_score': _educationEntranceScoreCtrl.text.trim(),
          'course_duration': _optionalInt(_educationCourseDurationCtrl),
          'year_of_study': _optionalInt(_educationYearCtrl),
          'tuition_fee': _optionalDouble(_educationTuitionCtrl),
          'hostel_fee': _optionalDouble(_educationHostelCtrl),
          'other_expenses': _optionalDouble(_educationOtherExpensesCtrl),
          'academic_percentages': academicPercentages(),
        };
      default:
        return const {};
    }
  }

  bool _validateStep() {
    final e = <String, String>{};

    void required(String key, String label, TextEditingController c) {
      if (c.text.trim().isEmpty) e[key] = '$label is required';
    }

    if (_step == 1) {
      required('name', 'Full Name', _nameCtrl);
      required('mobile', 'Mobile Number', _mobileCtrl);
      required('dob', 'Date of Birth', _dobCtrl);
      required('pan', 'PAN', _panCtrl);
      required('aadhaar', 'Aadhaar Number', _aadhaarCtrl);
      required('email', 'Email Address', _emailCtrl);
      required('address', 'Address', _addressCtrl);
      required('city', 'City', _cityCtrl);
      required('state', 'State', _stateCtrl);
      required('pincode', 'PIN Code', _pincodeCtrl);
      required('occupation', 'Occupation', _occupationCtrl);
      required(
        'householdIncome',
        'Monthly Household Income',
        _householdIncomeCtrl,
      );
      if (!_isStudent) {
        required('income', 'Monthly Income', _incomeCtrl);
        required(
          'monthlyObligation',
          'Existing Monthly Obligations',
          _monthlyObligationCtrl,
        );
      }
      if (_isSalaried) {
        required('employer', 'Employer Name', _employerCtrl);
      }

      if (_isStudent) {
        required('coName', 'Co-Applicant Name', _coNameCtrl);
        required('coRel', 'Co-Applicant Relationship', _coRelationCtrl);
      }

      if (_mobileCtrl.text.replaceAll(RegExp(r'\D'), '').length != 10) {
        e['mobile'] = 'Enter a valid 10-digit mobile number';
      }
      if (!RegExp(
        r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$',
      ).hasMatch(_panCtrl.text.trim().toUpperCase())) {
        e['pan'] = 'Enter a valid PAN (e.g. ABCDE1234F)';
      }
      if (_aadhaarCtrl.text.replaceAll(RegExp(r'\D'), '').length != 12) {
        e['aadhaar'] = 'Enter a valid 12-digit Aadhaar number';
      }
      final email = _emailCtrl.text.trim();
      if (!(email.contains('@') && email.contains('.'))) {
        e['email'] = 'Enter a valid email address';
      }
      if (_pincodeCtrl.text.replaceAll(RegExp(r'\D'), '').length != 6) {
        e['pincode'] = 'Enter a valid 6-digit PIN code';
      }
      if (!_isStudent && !_isPositiveNumber(_incomeCtrl))
        e['income'] = 'Enter a valid monthly income';
      if (!_isPositiveNumber(_householdIncomeCtrl))
        e['householdIncome'] = 'Enter a valid monthly household income';
      if (!_isStudent && !_isPositiveNumber(_monthlyObligationCtrl))
        e['monthlyObligation'] = 'Enter a valid monthly obligation';

      if (_hasCoApplicant) {
        required('coName', 'Co-Applicant Name', _coNameCtrl);
        required('coRel', 'Co-Applicant Relationship', _coRelationCtrl);
      }
    }

    if (_step == 2) {
      if (_selectedLender.trim().isEmpty)
        e['lender'] = 'Please select a preferred lender';
      switch (widget.loanType) {
        case 'gold':
          required('goldType', 'Gold Type', _goldTypeCtrl);
          required('gold', 'Gold Weight', _goldWeightCtrl);
          required('goldPurity', 'Gold Purity', _goldPurityCtrl);
          if (!_isPositiveNumber(_goldWeightCtrl))
            e['gold'] = 'Enter a valid gold weight';
          if (_goldPurityCtrl.text.trim().isEmpty)
            e['goldPurity'] = 'Enter gold purity';
          break;
        case 'home':
          required('homeType', 'Property Type', _homePropertyTypeCtrl);
          required('homeStatus', 'Property Status', _homePropertyStatusCtrl);
          required('propValue', 'Property Value', _propertyValueCtrl);
          required('propLoc', 'Property Location', _propertyLocationCtrl);
          required('homeBuilder', 'Builder Name', _homeBuilderCtrl);
          required('homeDownPayment', 'Down Payment', _homeDownPaymentCtrl);
          required('homePurpose', 'Purpose', _homePurposeCtrl);
          if (!_isPositiveNumber(_propertyValueCtrl))
            e['propValue'] = 'Enter a valid property value';
          if (!_isPositiveNumber(_homeDownPaymentCtrl))
            e['homeDownPayment'] = 'Enter a valid down payment';
          break;
        case 'car':
          required('carModel', 'Vehicle Make & Model', _vehicleModelCtrl);
          required('carPrice', 'On-Road Price', _onRoadPriceCtrl);
          if (!_isPositiveNumber(_onRoadPriceCtrl))
            e['carPrice'] = 'Enter a valid on-road price';
          break;
        case 'education':
          required('course', 'Course Name', _educationCourseCtrl);
          required('college', 'College / University Name', _collegeCtrl);
          required(
            'eduStatus',
            'Admission Status',
            _educationAdmissionStatusCtrl,
          );
          required(
            'courseDuration',
            'Course Duration',
            _educationCourseDurationCtrl,
          );
          required('yearOfStudy', 'Year of Study', _educationYearCtrl);
          required('tuitionFee', 'Tuition Fee', _educationTuitionCtrl);
          if (!_isPositiveNumber(_educationCourseDurationCtrl))
            e['courseDuration'] = 'Enter a valid course duration';
          if (!_isPositiveNumber(_educationYearCtrl))
            e['yearOfStudy'] = 'Enter a valid year of study';
          if (!_isPositiveNumber(_educationTuitionCtrl))
            e['tuitionFee'] = 'Enter a valid tuition fee';
          var hasAcademicPercentage = false;
          for (var i = 0; i < _academicPercentageEntries.length; i++) {
            final entry = _academicPercentageEntries[i];
            final level = entry.levelCtrl.text.trim();
            final percentageText = entry.percentageCtrl.text.trim();
            final isFilled = level.isNotEmpty || percentageText.isNotEmpty;
            if (!isFilled) continue;
            hasAcademicPercentage = true;
            if (level.isEmpty) {
              e['academicLevel_$i'] = 'Academic level is required';
            }
            final percentage = double.tryParse(percentageText);
            if (percentage == null) {
              e['academicPercentage_$i'] = 'Enter a valid percentage';
            } else if (percentage < 0 || percentage > 100) {
              e['academicPercentage_$i'] =
                  'Percentage must be between 0 and 100';
            }
          }
          if (!hasAcademicPercentage) {
            e['academicPercentages'] =
                'Add at least one academic percentage entry';
          }
          break;
      }
    }

    setState(() {
      _errors
        ..clear()
        ..addAll(e);
      _showValidation = true;
    });

    return e.isEmpty;
  }

  Future<void> _next() async {
    if (!_validateStep()) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please fill all required fields correctly.'),
        ),
      );
      return;
    }

    if (_step < 4) {
      setState(() => _step++);
      context.read<AppState>().saveResume(widget.loanType, _step);
    } else {
      final accessToken = context.read<AppState>().authToken;
      if (accessToken == null || accessToken.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Session expired. Please login again.')),
        );
        return;
      }

      setState(() => _submittingApplication = true);
      try {
        final created = await _authApi.createApplicationWithDetails(
          accessToken: accessToken,
          loanType: widget.loanType,
          loanAmount: _loanAmount.toInt(),
          employmentType: _employmentType,
          purpose: _loanTitle,
          loanDetails: _loanDetailsPayload(),
        );

        if (!mounted) return;
        setState(() => _submittingApplication = false);
        final encodedEmploymentType = Uri.encodeComponent(
          created.employmentType,
        );
        context.push(
          '/documents/${widget.loanType}?applicationId=${created.applicationId}&employmentType=$encodedEmploymentType',
        );
      } catch (e) {
        if (!mounted) return;
        setState(() => _submittingApplication = false);
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
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final secondary = isDark ? AppColors.secondaryDark : AppColors.secondary;
    final appState = context.watch<AppState>();

    return Scaffold(
      appBar: AppBar(
        title: Text(_loanTitle),
        actions: [
          TextButton(
            onPressed: () =>
                context.read<AppState>().saveResume(widget.loanType, _step),
            child: Text(
              'Save',
              style: AppTypography.caption.copyWith(color: secondary),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            if (appState.isOffline) const CsOfflineBanner(),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(AppSpacing.sm),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    CsStepIndicator(
                      currentStep: _step,
                      totalSteps: 4,
                      estimatedTime: '~5 min',
                    ),
                    const SizedBox(height: AppSpacing.md),
                    if (_step == 1) _personalStep(secondary),
                    if (_step == 2) _loanDetailsStep(isDark, secondary),
                    if (_step == 3) _amountStep(isDark, secondary),
                    if (_step == 4) _reviewStep(isDark, secondary),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(AppSpacing.sm),
              child: CsButton(
                label: _step == 4 ? 'Upload Documents' : 'Next',
                onPressed: _submittingApplication ? null : _next,
                isLoading: _submittingApplication,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _personalStep(Color secondary) {
    return Column(
      children: [
        CsInputField(
          label: 'Full Name*',
          controller: _nameCtrl,
          errorText: _fieldError('name'),
        ),
        const SizedBox(height: 10),
        CsInputField(
          label: 'Mobile Number*',
          controller: _mobileCtrl,
          keyboardType: TextInputType.phone,
          errorText: _fieldError('mobile'),
        ),
        const SizedBox(height: 10),
        CsInputField(
          label: 'Date of Birth*',
          controller: _dobCtrl,
          errorText: _fieldError('dob'),
        ),
        const SizedBox(height: 10),
        CsInputField(
          label: 'PAN*',
          controller: _panCtrl,
          errorText: _fieldError('pan'),
        ),
        const SizedBox(height: 10),
        CsInputField(
          label: 'Aadhaar Number*',
          controller: _aadhaarCtrl,
          keyboardType: TextInputType.number,
          errorText: _fieldError('aadhaar'),
        ),
        const SizedBox(height: 10),
        CsInputField(
          label: 'Email Address*',
          controller: _emailCtrl,
          errorText: _fieldError('email'),
        ),
        const SizedBox(height: 10),
        CsInputField(
          label: 'Address*',
          controller: _addressCtrl,
          errorText: _fieldError('address'),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: CsInputField(
                label: 'City*',
                controller: _cityCtrl,
                errorText: _fieldError('city'),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: CsInputField(
                label: 'State*',
                controller: _stateCtrl,
                errorText: _fieldError('state'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        CsInputField(
          label: 'PIN Code*',
          controller: _pincodeCtrl,
          keyboardType: TextInputType.number,
          errorText: _fieldError('pincode'),
        ),
        const SizedBox(height: 10),
        CsInputField(
          label: 'Occupation*',
          controller: _occupationCtrl,
          errorText: _fieldError('occupation'),
        ),
        const SizedBox(height: 10),
        _DropdownField(
          label: 'Employment Type*',
          value: _employmentType,
          items: const [
            'Salaried',
            'Self-Employed',
            'Business Owner',
            'Freelancer',
            'Student',
            'Unemployed',
          ],
          onChanged: (v) {
            if (v == null) return;
            setState(() {
              _employmentType = v;
              if (_isStudent) {
                _hasCoApplicant = true;
                _occupationCtrl.text = _occupationCtrl.text.trim().isEmpty
                    ? 'Student'
                    : _occupationCtrl.text;
              }
            });
          },
        ),
        const SizedBox(height: 10),
        if (_isSalaried) ...[
          CsInputField(
            label: 'Employer Name*',
            controller: _employerCtrl,
            errorText: _fieldError('employer'),
          ),
          const SizedBox(height: 10),
        ],
        CsInputField(
          label: _isStudent
              ? 'Monthly Income / Stipend (Rs)'
              : 'Monthly Income (Rs)*',
          controller: _incomeCtrl,
          keyboardType: TextInputType.number,
          errorText: _fieldError('income'),
        ),
        const SizedBox(height: 10),
        CsInputField(
          label: 'Monthly Household Income (Rs)*',
          controller: _householdIncomeCtrl,
          keyboardType: TextInputType.number,
          errorText: _fieldError('householdIncome'),
        ),
        const SizedBox(height: 10),
        CsInputField(
          label: _isStudent
              ? 'Existing Monthly Obligations (Rs)'
              : 'Existing Monthly Obligations (Rs)*',
          controller: _monthlyObligationCtrl,
          keyboardType: TextInputType.number,
          errorText: _fieldError('monthlyObligation'),
        ),
        const SizedBox(height: 8),
        if (_isStudent)
          Align(
            alignment: Alignment.centerLeft,
            child: Text(
              'Co-applicant is required for student applications.',
              style: AppTypography.caption.copyWith(color: AppColors.warning),
            ),
          )
        else
          Row(
            children: [
              Switch(
                value: _hasCoApplicant,
                activeColor: secondary,
                onChanged: (v) => setState(() => _hasCoApplicant = v),
              ),
              const Expanded(child: Text('Add Co-Applicant')),
            ],
          ),
        if (_hasCoApplicant) ...[
          CsInputField(
            label: 'Co-Applicant Name*',
            controller: _coNameCtrl,
            errorText: _fieldError('coName'),
          ),
          const SizedBox(height: 10),
          CsInputField(
            label: 'Co-Applicant Relationship*',
            controller: _coRelationCtrl,
            errorText: _fieldError('coRel'),
          ),
        ],
      ],
    );
  }

  Widget _loanDetailsStep(bool isDark, Color secondary) {
    return Column(
      children: [
        _DropdownField(
          label: 'Preferred Bank / Lender*',
          value: _selectedLender,
          items: _lenders,
          onChanged: (v) =>
              setState(() => _selectedLender = v ?? _selectedLender),
        ),
        if (_fieldError('lender') != null)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Text(
              _fieldError('lender')!,
              style: AppTypography.caption.copyWith(color: AppColors.error),
            ),
          ),
        const SizedBox(height: 10),
        if (widget.loanType == 'gold')
          Column(
            children: [
              _DropdownField(
                label: 'Gold Type*',
                value: _goldTypeCtrl.text,
                items: const ['Jewellery', 'Coins'],
                onChanged: (v) => setState(
                  () => _goldTypeCtrl.text = v ?? _goldTypeCtrl.text,
                ),
              ),
              const SizedBox(height: 10),
              CsInputField(
                label: 'Gold Weight (grams)*',
                controller: _goldWeightCtrl,
                keyboardType: TextInputType.number,
                errorText: _fieldError('gold'),
              ),
              const SizedBox(height: 10),
              CsInputField(
                label: 'Purity (e.g. 22K)*',
                controller: _goldPurityCtrl,
                errorText: _fieldError('goldPurity'),
              ),
              const SizedBox(height: 10),
              CsInputField(
                label: 'Item Count',
                controller: _goldItemCountCtrl,
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 10),
              CsInputField(
                label: 'Valuation Per Gram (Rs)',
                controller: _goldValuationPerGramCtrl,
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 10),
              CsInputField(
                label: 'Total Valuation (Rs)',
                controller: _goldTotalValuationCtrl,
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 10),
              CsInputField(
                label: 'Expected LTV %',
                controller: _goldLtvCtrl,
                keyboardType: TextInputType.number,
              ),
            ],
          ),
        if (widget.loanType == 'home') ...[
          _DropdownField(
            label: 'Property Type*',
            value: _homePropertyTypeCtrl.text,
            items: const ['Flat', 'House', 'Plot'],
            onChanged: (v) => setState(
              () =>
                  _homePropertyTypeCtrl.text = v ?? _homePropertyTypeCtrl.text,
            ),
          ),
          const SizedBox(height: 10),
          _DropdownField(
            label: 'Property Status*',
            value: _homePropertyStatusCtrl.text,
            items: const ['Ready', 'Under Construction'],
            onChanged: (v) => setState(
              () => _homePropertyStatusCtrl.text =
                  v ?? _homePropertyStatusCtrl.text,
            ),
          ),
          const SizedBox(height: 10),
          CsInputField(
            label: 'Property Value (Rs)*',
            controller: _propertyValueCtrl,
            keyboardType: TextInputType.number,
            errorText: _fieldError('propValue'),
          ),
          const SizedBox(height: 10),
          CsInputField(
            label: 'Property Location*',
            controller: _propertyLocationCtrl,
            errorText: _fieldError('propLoc'),
          ),
          const SizedBox(height: 10),
          CsInputField(
            label: 'Builder Name*',
            controller: _homeBuilderCtrl,
            errorText: _fieldError('homeBuilder'),
          ),
          const SizedBox(height: 10),
          CsInputField(
            label: 'Down Payment (Rs)*',
            controller: _homeDownPaymentCtrl,
            keyboardType: TextInputType.number,
            errorText: _fieldError('homeDownPayment'),
          ),
          const SizedBox(height: 10),
          CsInputField(
            label: 'Loan to Value %',
            controller: _homeLtvCtrl,
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: 10),
          CsInputField(
            label: 'Purpose*',
            controller: _homePurposeCtrl,
            errorText: _fieldError('homePurpose'),
          ),
        ],
        if (widget.loanType == 'car') ...[
          CsInputField(
            label: 'Vehicle Make & Model*',
            controller: _vehicleModelCtrl,
            errorText: _fieldError('carModel'),
          ),
          const SizedBox(height: 10),
          CsInputField(
            label: 'On-Road Price (Rs)*',
            controller: _onRoadPriceCtrl,
            keyboardType: TextInputType.number,
            errorText: _fieldError('carPrice'),
          ),
        ],
        if (widget.loanType == 'education')
          Column(
            children: [
              CsInputField(
                label: 'Course Name*',
                controller: _educationCourseCtrl,
                errorText: _fieldError('course'),
              ),
              const SizedBox(height: 10),
              CsInputField(
                label: 'Specialization',
                controller: _educationSpecializationCtrl,
              ),
              const SizedBox(height: 10),
              CsInputField(
                label: 'College / University Name*',
                controller: _collegeCtrl,
                errorText: _fieldError('college'),
              ),
              const SizedBox(height: 10),
              CsInputField(
                label: 'University Name',
                controller: _educationUniversityCtrl,
              ),
              const SizedBox(height: 10),
              _DropdownField(
                label: 'Admission Status*',
                value: _educationAdmissionStatusCtrl.text,
                items: const ['Confirmed', 'Pending'],
                onChanged: (v) => setState(
                  () => _educationAdmissionStatusCtrl.text =
                      v ?? _educationAdmissionStatusCtrl.text,
                ),
              ),
              const SizedBox(height: 10),
              CsInputField(
                label: 'Entrance Exam',
                controller: _educationEntranceExamCtrl,
              ),
              const SizedBox(height: 10),
              CsInputField(
                label: 'Entrance Score',
                controller: _educationEntranceScoreCtrl,
              ),
              const SizedBox(height: 10),
              CsInputField(
                label: 'Course Duration (years)*',
                controller: _educationCourseDurationCtrl,
                keyboardType: TextInputType.number,
                errorText: _fieldError('courseDuration'),
              ),
              const SizedBox(height: 10),
              CsInputField(
                label: 'Year of Study*',
                controller: _educationYearCtrl,
                keyboardType: TextInputType.number,
                errorText: _fieldError('yearOfStudy'),
              ),
              const SizedBox(height: 10),
              CsInputField(
                label: 'Tuition Fee (Rs)*',
                controller: _educationTuitionCtrl,
                keyboardType: TextInputType.number,
                errorText: _fieldError('tuitionFee'),
              ),
              const SizedBox(height: 10),
              CsInputField(
                label: 'Hostel Fee (Rs)',
                controller: _educationHostelCtrl,
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 10),
              CsInputField(
                label: 'Other Expenses (Rs)',
                controller: _educationOtherExpensesCtrl,
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Academic Percentages*',
                      style: AppTypography.body.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  TextButton(
                    onPressed: _addAcademicPercentageEntry,
                    child: const Text('Add'),
                  ),
                ],
              ),
              if (_fieldError('academicPercentages') != null)
                Align(
                  alignment: Alignment.centerLeft,
                  child: Padding(
                    padding: const EdgeInsets.only(top: 4, bottom: 6),
                    child: Text(
                      _fieldError('academicPercentages')!,
                      style: AppTypography.caption.copyWith(
                        color: AppColors.error,
                      ),
                    ),
                  ),
                ),
              ...List.generate(_academicPercentageEntries.length, (index) {
                final entry = _academicPercentageEntries[index];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Row(
                    children: [
                      Expanded(
                        flex: 5,
                        child: CsInputField(
                          label: 'Level*',
                          controller: entry.levelCtrl,
                          errorText: _fieldError('academicLevel_$index'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        flex: 4,
                        child: CsInputField(
                          label: 'Percentage*',
                          controller: entry.percentageCtrl,
                          keyboardType: const TextInputType.numberWithOptions(
                            decimal: true,
                          ),
                          errorText: _fieldError('academicPercentage_$index'),
                        ),
                      ),
                      const SizedBox(width: 6),
                      IconButton(
                        onPressed: _academicPercentageEntries.length > 1
                            ? () => _removeAcademicPercentageEntry(index)
                            : null,
                        icon: const Icon(Icons.remove_circle_outline),
                        color: AppColors.error,
                      ),
                    ],
                  ),
                );
              }),
            ],
          ),
      ],
    );
  }

  Widget _amountStep(bool isDark, Color secondary) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Center(
          child: Text(
            'Rs ${_loanAmount.toInt()}',
            style: AppTypography.heading.copyWith(
              color: secondary,
              fontSize: 34,
            ),
          ),
        ),
        Slider(
          value: _loanAmount,
          min: 5000,
          max: 500000,
          divisions: 99,
          activeColor: secondary,
          inactiveColor: secondary.withValues(alpha: 0.2),
          onChanged: (v) => setState(() => _loanAmount = v),
        ),
        const SizedBox(height: 6),
        Text(
          'Tenure',
          style: AppTypography.body.copyWith(fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 8),
        Row(
          children: [6, 12, 24, 36, 60]
              .map(
                (m) => Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _tenure = m),
                    child: Container(
                      margin: const EdgeInsets.only(right: 6),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: _tenure == m
                              ? secondary
                              : (isDark
                                    ? AppColors.borderDark
                                    : AppColors.borderLight),
                          width: _tenure == m ? 2 : 1,
                        ),
                        color: _tenure == m
                            ? secondary.withValues(alpha: 0.1)
                            : Colors.transparent,
                      ),
                      child: Center(child: Text('${m}M')),
                    ),
                  ),
                ),
              )
              .toList(),
        ),
      ],
    );
  }

  Widget _reviewStep(bool isDark, Color secondary) {
    return CsCard(
      child: Column(
        children: [
          _ReviewRow('Applicant', _nameCtrl.text.trim(), isDark),
          const Divider(height: 20),
          _ReviewRow('Loan Type', _loanTitle, isDark),
          const Divider(height: 20),
          _ReviewRow('Preferred Lender', _selectedLender, isDark),
          const Divider(height: 20),
          _ReviewRow('Loan Amount', 'Rs ${_loanAmount.toInt()}', isDark),
          const Divider(height: 20),
          _ReviewRow('Tenure', '$_tenure months', isDark),
          const Divider(height: 20),
          _ReviewRow('Estimated EMI', 'Rs ${_emi.toStringAsFixed(0)}', isDark),
          const Divider(height: 20),
          _ReviewRow(
            'Household Income',
            'Rs ${_householdIncomeCtrl.text.trim()}',
            isDark,
          ),
          const Divider(height: 20),
          _ReviewRow(
            'Existing Obligations',
            'Rs ${_monthlyObligationCtrl.text.trim()}',
            isDark,
          ),
          if (_hasCoApplicant) ...[
            const Divider(height: 20),
            _ReviewRow('Co-Applicant', _coNameCtrl.text.trim(), isDark),
          ],
        ],
      ),
    );
  }
}

class _ReviewRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isDark;

  const _ReviewRow(this.label, this.value, this.isDark);

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: AppTypography.body.copyWith(
            color: isDark
                ? AppColors.textSecondaryDark
                : AppColors.textSecondaryLight,
          ),
        ),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: AppTypography.body.copyWith(fontWeight: FontWeight.w600),
          ),
        ),
      ],
    );
  }
}

class _DropdownField extends StatelessWidget {
  final String label;
  final String value;
  final List<String> items;
  final void Function(String?) onChanged;

  const _DropdownField({
    required this.label,
    required this.value,
    required this.items,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: AppTypography.caption.copyWith(
            color: isDark
                ? AppColors.textSecondaryDark
                : AppColors.textSecondaryLight,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 6),
        Container(
          decoration: BoxDecoration(
            color: isDark ? AppColors.surfaceDark : AppColors.backgroundLight,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isDark ? AppColors.borderDark : AppColors.borderLight,
            ),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: value,
              isExpanded: true,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              borderRadius: BorderRadius.circular(12),
              items: items
                  .map((i) => DropdownMenuItem(value: i, child: Text(i)))
                  .toList(),
              onChanged: onChanged,
            ),
          ),
        ),
      ],
    );
  }
}

class _AcademicPercentageEntry {
  final TextEditingController levelCtrl;
  final TextEditingController percentageCtrl;

  _AcademicPercentageEntry({String level = '', String percentage = ''})
    : levelCtrl = TextEditingController(text: level),
      percentageCtrl = TextEditingController(text: percentage);

  void dispose() {
    levelCtrl.dispose();
    percentageCtrl.dispose();
  }
}

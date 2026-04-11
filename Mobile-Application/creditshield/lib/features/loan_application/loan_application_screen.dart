import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../app/app_state.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../core/design_system/components/cs_components.dart';

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
  final Map<String, String> _errors = {};

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

  final _nameCtrl = TextEditingController(text: 'Priya Sharma');
  final _mobileCtrl = TextEditingController(text: '9876543210');
  final _dobCtrl = TextEditingController(text: '15/08/1995');
  final _panCtrl = TextEditingController(text: 'ABCDE1234F');
  final _aadhaarCtrl = TextEditingController(text: '456712349876');
  final _emailCtrl = TextEditingController(text: 'priya.sharma@gmail.com');
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
  final _propertyValueCtrl = TextEditingController();
  final _propertyLocationCtrl = TextEditingController();
  final _vehicleModelCtrl = TextEditingController();
  final _onRoadPriceCtrl = TextEditingController();
  final _collegeCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _step = widget.initialStep;
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
    super.dispose();
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
      required('income', 'Monthly Income', _incomeCtrl);
      required('householdIncome', 'Monthly Household Income', _householdIncomeCtrl);
      required('monthlyObligation', 'Existing Monthly Obligations', _monthlyObligationCtrl);
      if (_employmentType == 'Salaried') required('employer', 'Employer Name', _employerCtrl);

      if (_mobileCtrl.text.replaceAll(RegExp(r'\D'), '').length != 10) {
        e['mobile'] = 'Enter a valid 10-digit mobile number';
      }
      if (!RegExp(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$').hasMatch(_panCtrl.text.trim().toUpperCase())) {
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
      if (!_isPositiveNumber(_incomeCtrl)) e['income'] = 'Enter a valid monthly income';
      if (!_isPositiveNumber(_householdIncomeCtrl)) e['householdIncome'] = 'Enter a valid monthly household income';
      if (!_isPositiveNumber(_monthlyObligationCtrl)) e['monthlyObligation'] = 'Enter a valid monthly obligation';

      if (_hasCoApplicant) {
        required('coName', 'Co-Applicant Name', _coNameCtrl);
        required('coRel', 'Co-Applicant Relationship', _coRelationCtrl);
      }
    }

    if (_step == 2) {
      if (_selectedLender.trim().isEmpty) e['lender'] = 'Please select a preferred lender';
      switch (widget.loanType) {
        case 'gold':
          required('gold', 'Gold Weight', _goldWeightCtrl);
          if (!_isPositiveNumber(_goldWeightCtrl)) e['gold'] = 'Enter a valid gold weight';
          break;
        case 'home':
          required('propValue', 'Property Value', _propertyValueCtrl);
          required('propLoc', 'Property Location', _propertyLocationCtrl);
          if (!_isPositiveNumber(_propertyValueCtrl)) e['propValue'] = 'Enter a valid property value';
          break;
        case 'car':
          required('carModel', 'Vehicle Make & Model', _vehicleModelCtrl);
          required('carPrice', 'On-Road Price', _onRoadPriceCtrl);
          if (!_isPositiveNumber(_onRoadPriceCtrl)) e['carPrice'] = 'Enter a valid on-road price';
          break;
        case 'education':
          required('college', 'College / University Name', _collegeCtrl);
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

  void _next() {
    if (!_validateStep()) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill all required fields correctly.')),
      );
      return;
    }

    if (_step < 4) {
      setState(() => _step++);
      context.read<AppState>().saveResume(widget.loanType, _step);
    } else {
      context.push('/documents/${widget.loanType}');
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
            onPressed: () => context.read<AppState>().saveResume(widget.loanType, _step),
            child: Text('Save', style: AppTypography.caption.copyWith(color: secondary)),
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
                    CsStepIndicator(currentStep: _step, totalSteps: 4, estimatedTime: '~5 min'),
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
              child: CsButton(label: _step == 4 ? 'Upload Documents' : 'Next', onPressed: _next),
            ),
          ],
        ),
      ),
    );
  }

  Widget _personalStep(Color secondary) {
    return Column(
      children: [
        CsInputField(label: 'Full Name*', controller: _nameCtrl, errorText: _fieldError('name')),
        const SizedBox(height: 10),
        CsInputField(label: 'Mobile Number*', controller: _mobileCtrl, keyboardType: TextInputType.phone, errorText: _fieldError('mobile')),
        const SizedBox(height: 10),
        CsInputField(label: 'Date of Birth*', controller: _dobCtrl, errorText: _fieldError('dob')),
        const SizedBox(height: 10),
        CsInputField(label: 'PAN*', controller: _panCtrl, errorText: _fieldError('pan')),
        const SizedBox(height: 10),
        CsInputField(label: 'Aadhaar Number*', controller: _aadhaarCtrl, keyboardType: TextInputType.number, errorText: _fieldError('aadhaar')),
        const SizedBox(height: 10),
        CsInputField(label: 'Email Address*', controller: _emailCtrl, errorText: _fieldError('email')),
        const SizedBox(height: 10),
        CsInputField(label: 'Address*', controller: _addressCtrl, errorText: _fieldError('address')),
        const SizedBox(height: 10),
        Row(children: [
          Expanded(child: CsInputField(label: 'City*', controller: _cityCtrl, errorText: _fieldError('city'))),
          const SizedBox(width: 8),
          Expanded(child: CsInputField(label: 'State*', controller: _stateCtrl, errorText: _fieldError('state'))),
        ]),
        const SizedBox(height: 10),
        CsInputField(label: 'PIN Code*', controller: _pincodeCtrl, keyboardType: TextInputType.number, errorText: _fieldError('pincode')),
        const SizedBox(height: 10),
        CsInputField(label: 'Occupation*', controller: _occupationCtrl, errorText: _fieldError('occupation')),
        const SizedBox(height: 10),
        _DropdownField(
          label: 'Employment Type',
          value: _employmentType,
          items: const ['Salaried', 'Self-Employed', 'Business Owner', 'Freelancer'],
          onChanged: (v) => setState(() => _employmentType = v ?? _employmentType),
        ),
        const SizedBox(height: 10),
        CsInputField(label: 'Employer Name${_employmentType == 'Salaried' ? '*' : ''}', controller: _employerCtrl, errorText: _fieldError('employer')),
        const SizedBox(height: 10),
        CsInputField(label: 'Monthly Income (Rs)*', controller: _incomeCtrl, keyboardType: TextInputType.number, errorText: _fieldError('income')),
        const SizedBox(height: 10),
        CsInputField(
          label: 'Monthly Household Income (Rs)*',
          controller: _householdIncomeCtrl,
          keyboardType: TextInputType.number,
          errorText: _fieldError('householdIncome'),
        ),
        const SizedBox(height: 10),
        CsInputField(
          label: 'Existing Monthly Obligations (Rs)*',
          controller: _monthlyObligationCtrl,
          keyboardType: TextInputType.number,
          errorText: _fieldError('monthlyObligation'),
        ),
        const SizedBox(height: 8),
        Row(children: [
          Switch(value: _hasCoApplicant, activeColor: secondary, onChanged: (v) => setState(() => _hasCoApplicant = v)),
          const Expanded(child: Text('Add Co-Applicant')),
        ]),
        if (_hasCoApplicant) ...[
          CsInputField(label: 'Co-Applicant Name*', controller: _coNameCtrl, errorText: _fieldError('coName')),
          const SizedBox(height: 10),
          CsInputField(label: 'Co-Applicant Relationship*', controller: _coRelationCtrl, errorText: _fieldError('coRel')),
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
          onChanged: (v) => setState(() => _selectedLender = v ?? _selectedLender),
        ),
        if (_fieldError('lender') != null)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Text(_fieldError('lender')!, style: AppTypography.caption.copyWith(color: AppColors.error)),
          ),
        const SizedBox(height: 10),
        if (widget.loanType == 'gold') CsInputField(label: 'Gold Weight (grams)*', controller: _goldWeightCtrl, keyboardType: TextInputType.number, errorText: _fieldError('gold')),
        if (widget.loanType == 'home') ...[
          CsInputField(label: 'Property Value (Rs)*', controller: _propertyValueCtrl, keyboardType: TextInputType.number, errorText: _fieldError('propValue')),
          const SizedBox(height: 10),
          CsInputField(label: 'Property Location*', controller: _propertyLocationCtrl, errorText: _fieldError('propLoc')),
        ],
        if (widget.loanType == 'car') ...[
          CsInputField(label: 'Vehicle Make & Model*', controller: _vehicleModelCtrl, errorText: _fieldError('carModel')),
          const SizedBox(height: 10),
          CsInputField(label: 'On-Road Price (Rs)*', controller: _onRoadPriceCtrl, keyboardType: TextInputType.number, errorText: _fieldError('carPrice')),
        ],
        if (widget.loanType == 'education') CsInputField(label: 'College / University Name*', controller: _collegeCtrl, errorText: _fieldError('college')),
      ],
    );
  }

  Widget _amountStep(bool isDark, Color secondary) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Center(child: Text('Rs ${_loanAmount.toInt()}', style: AppTypography.heading.copyWith(color: secondary, fontSize: 34))),
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
        Text('Tenure', style: AppTypography.body.copyWith(fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        Row(children: [6, 12, 24, 36, 60].map((m) => Expanded(
          child: GestureDetector(
            onTap: () => setState(() => _tenure = m),
            child: Container(
              margin: const EdgeInsets.only(right: 6),
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: _tenure == m ? secondary : (isDark ? AppColors.borderDark : AppColors.borderLight), width: _tenure == m ? 2 : 1),
                color: _tenure == m ? secondary.withValues(alpha: 0.1) : Colors.transparent,
              ),
              child: Center(child: Text('${m}M')),
            ),
          ),
        )).toList()),
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
          _ReviewRow('Household Income', 'Rs ${_householdIncomeCtrl.text.trim()}', isDark),
          const Divider(height: 20),
          _ReviewRow('Existing Obligations', 'Rs ${_monthlyObligationCtrl.text.trim()}', isDark),
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
        Text(label, style: AppTypography.body.copyWith(color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight)),
        Flexible(child: Text(value, textAlign: TextAlign.right, style: AppTypography.body.copyWith(fontWeight: FontWeight.w600))),
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
        Text(label, style: AppTypography.caption.copyWith(color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight, fontWeight: FontWeight.w500)),
        const SizedBox(height: 6),
        Container(
          decoration: BoxDecoration(
            color: isDark ? AppColors.surfaceDark : AppColors.backgroundLight,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: isDark ? AppColors.borderDark : AppColors.borderLight),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: value,
              isExpanded: true,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              borderRadius: BorderRadius.circular(12),
              items: items.map((i) => DropdownMenuItem(value: i, child: Text(i))).toList(),
              onChanged: onChanged,
            ),
          ),
        ),
      ],
    );
  }
}

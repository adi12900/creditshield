import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppState extends ChangeNotifier {
  String _language = 'English';
  bool _isLoggedIn = false;
  String? _authToken;
  String? _borrowerName;
  String? _borrowerEmail;
  String? _borrowerMobile;
  bool _kycCompleted = false;
  bool _onboardingDone = false;
  bool _isOffline = false;
  String? _resumeLoanType;
  int _resumeStep = 0;
  DateTime? _lastActivity;

  String get language => _language;
  bool get isLoggedIn => _isLoggedIn;
  String? get authToken => _authToken;
  String? get borrowerName => _borrowerName;
  String? get borrowerEmail => _borrowerEmail;
  String? get borrowerMobile => _borrowerMobile;
  bool get kycCompleted => _kycCompleted;
  bool get onboardingDone => _onboardingDone;
  bool get isOffline => _isOffline;
  String? get resumeLoanType => _resumeLoanType;
  int get resumeStep => _resumeStep;
  bool get hasPendingResumeApplication =>
      _resumeLoanType != null && _resumeStep > 0;

  /// Req 20.2 — returns true if session has been inactive for 30+ minutes
  bool get isSessionExpired {
    if (!_isLoggedIn || _lastActivity == null) return false;
    return DateTime.now().difference(_lastActivity!).inMinutes >= 30;
  }

  void recordActivity() {
    _lastActivity = DateTime.now();
  }

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _language = prefs.getString('language') ?? '';
    _isLoggedIn = prefs.getBool('isLoggedIn') ?? false;
    _authToken = prefs.getString('authToken');
    _borrowerName = prefs.getString('borrowerName');
    _borrowerEmail = prefs.getString('borrowerEmail');
    _borrowerMobile = prefs.getString('borrowerMobile');
    _kycCompleted = prefs.getBool('kycCompleted') ?? false;
    _onboardingDone = prefs.getBool('onboardingDone') ?? false;
    _resumeLoanType = prefs.getString('resumeLoanType');
    _resumeStep = prefs.getInt('resumeStep') ?? 0;
    notifyListeners();
  }

  Future<void> setLanguage(String lang) async {
    _language = lang;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('language', lang);
    notifyListeners();
  }

  Future<void> setLoggedIn(bool val) async {
    _isLoggedIn = val;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('isLoggedIn', val);
    notifyListeners();
  }

  Future<void> setAuthSession({
    required String token,
    required String name,
    required String email,
    required String mobile,
    bool kycCompleted = false,
  }) async {
    _authToken = token;
    _borrowerName = name;
    _borrowerEmail = email;
    _borrowerMobile = mobile;
    _kycCompleted = kycCompleted;
    _isLoggedIn = true;

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('authToken', token);
    await prefs.setString('borrowerName', name);
    await prefs.setString('borrowerEmail', email);
    await prefs.setString('borrowerMobile', mobile);
    await prefs.setBool('kycCompleted', kycCompleted);
    await prefs.setBool('isLoggedIn', true);
    notifyListeners();
  }

  Future<void> setKycCompleted(bool value) async {
    _kycCompleted = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('kycCompleted', value);
    notifyListeners();
  }

  Future<void> clearAuthSession() async {
    _authToken = null;
    _borrowerName = null;
    _borrowerEmail = null;
    _borrowerMobile = null;
    _kycCompleted = false;
    _isLoggedIn = false;

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('authToken');
    await prefs.remove('borrowerName');
    await prefs.remove('borrowerEmail');
    await prefs.remove('borrowerMobile');
    await prefs.remove('kycCompleted');
    await prefs.setBool('isLoggedIn', false);
    notifyListeners();
  }

  Future<void> setOnboardingDone(bool val) async {
    _onboardingDone = val;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('onboardingDone', val);
    notifyListeners();
  }

  void setOffline(bool val) {
    _isOffline = val;
    notifyListeners();
  }

  Future<void> saveResume(String loanType, int step) async {
    _resumeLoanType = loanType;
    _resumeStep = step;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('resumeLoanType', loanType);
    await prefs.setInt('resumeStep', step);
    notifyListeners();
  }

  Future<void> clearResume() async {
    _resumeLoanType = null;
    _resumeStep = 0;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('resumeLoanType');
    await prefs.remove('resumeStep');
    notifyListeners();
  }
}

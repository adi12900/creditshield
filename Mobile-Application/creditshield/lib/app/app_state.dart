import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppState extends ChangeNotifier {
  String _language = 'English';
  bool _isLoggedIn = false;
  bool _onboardingDone = false;
  bool _isOffline = false;
  String? _resumeLoanType;
  int _resumeStep = 0;
  DateTime? _lastActivity;

  String get language => _language;
  bool get isLoggedIn => _isLoggedIn;
  bool get onboardingDone => _onboardingDone;
  bool get isOffline => _isOffline;
  String? get resumeLoanType => _resumeLoanType;
  int get resumeStep => _resumeStep;

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

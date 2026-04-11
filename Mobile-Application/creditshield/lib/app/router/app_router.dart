import 'package:go_router/go_router.dart';
import 'package:creditshield/app/app_state.dart';
import 'package:creditshield/features/splash/splash_screen.dart';
import 'package:creditshield/features/onboarding/language_screen.dart';
import 'package:creditshield/features/onboarding/welcome_screen.dart';
import 'package:creditshield/features/onboarding/kyc_screen.dart';
import 'package:creditshield/features/onboarding/profile_setup_screen.dart';
import 'package:creditshield/features/home/home_screen.dart';
import 'package:creditshield/features/home/maintenance_screen.dart';
import 'package:creditshield/features/home/session_reauth_screen.dart';
import 'package:creditshield/features/eligibility/eligibility_screen.dart';
import 'package:creditshield/features/loan_type_selection/loan_type_screen.dart';
import 'package:creditshield/features/loan_application/loan_application_screen.dart';
import 'package:creditshield/features/document_upload/document_upload_screen.dart';
import 'package:creditshield/features/consent/consent_screen.dart';
import 'package:creditshield/features/consent/consent_dashboard_screen.dart';
import 'package:creditshield/features/compliance/rbi_compliance_screen.dart';
import 'package:creditshield/features/risk_score/risk_score_screen.dart';
import 'package:creditshield/features/lender_offers/lender_offers_screen.dart';
import 'package:creditshield/features/offer_selection/offer_selection_screen.dart';
import 'package:creditshield/features/loan_tracker/loan_tracker_screen.dart';
import 'package:creditshield/features/loan_agreement/loan_agreement_screen.dart';
import 'package:creditshield/features/loan_dashboard/loan_dashboard_screen.dart';
import 'package:creditshield/features/rejection_recovery/rejection_recovery_screen.dart';
import 'package:creditshield/features/notifications/notifications_screen.dart';
import 'package:creditshield/features/profile/profile_screen.dart';

GoRouter createRouter(AppState appState) {
  return GoRouter(
    initialLocation: '/splash',
    routes: [
      GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/language', builder: (_, __) => const LanguageScreen()),
      GoRoute(path: '/welcome', builder: (_, __) => const WelcomeScreen()),
      GoRoute(path: '/kyc', builder: (_, __) => const KycScreen()),
      GoRoute(path: '/profile-setup', builder: (_, __) => const ProfileSetupScreen()),
      GoRoute(path: '/eligibility', builder: (_, __) => const EligibilityScreen()),
      GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),
      GoRoute(path: '/maintenance', builder: (_, __) => const MaintenanceScreen()),
      GoRoute(path: '/session-reauth', builder: (_, __) => const SessionReauthScreen()),
      GoRoute(
        path: '/loan-type',
        builder: (context, state) {
          final preSelected = state.uri.queryParameters['preSelected'];
          return LoanTypeScreen(preSelected: preSelected);
        },
      ),
      GoRoute(
        path: '/loan-application/:loanType',
        builder: (context, state) {
          final loanType = state.pathParameters['loanType']!;
          final resumeStep = int.tryParse(state.uri.queryParameters['step'] ?? '1') ?? 1;
          return LoanApplicationScreen(loanType: loanType, initialStep: resumeStep);
        },
      ),
      GoRoute(
        path: '/documents/:loanType',
        builder: (context, state) {
          final loanType = state.pathParameters['loanType']!;
          return DocumentUploadScreen(loanType: loanType);
        },
      ),
      GoRoute(path: '/consent', builder: (_, __) => const ConsentScreen()),
      GoRoute(path: '/consent-dashboard', builder: (_, __) => const ConsentDashboardScreen()),
      GoRoute(path: '/rbi-compliance', builder: (_, __) => const RbiComplianceScreen()),
      GoRoute(path: '/risk-score', builder: (_, __) => const RiskScoreScreen()),
      GoRoute(path: '/lender-offers', builder: (_, __) => const LenderOffersScreen()),
      GoRoute(
        path: '/offer-selection/:offerId',
        builder: (context, state) {
          final offerId = state.pathParameters['offerId']!;
          return OfferSelectionScreen(offerId: offerId);
        },
      ),
      GoRoute(path: '/loan-tracker', builder: (_, __) => const LoanTrackerScreen()),
      GoRoute(path: '/loan-agreement', builder: (_, __) => const LoanAgreementScreen()),
      GoRoute(path: '/loan-dashboard', builder: (_, __) => const LoanDashboardScreen()),
      GoRoute(path: '/rejection-recovery', builder: (_, __) => const RejectionRecoveryScreen()),
      GoRoute(path: '/notifications', builder: (_, __) => const NotificationsScreen()),
      GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
    ],
  );
}

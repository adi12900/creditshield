# Design Document
## CreditShield — AI-Powered Loan Risk Assessment Flutter App

---

## Overview

CreditShield is a production-grade Flutter only UI mobile application targeting Android-first with iOS-ready architecture. It serves as the borrower-facing interface for an AI-powered loan risk assessment platform tailored to Indian borrowers. The app supports five loan types (Personal, Gold, Home, Car, Education), full Aadhaar eKYC onboarding, a pre-eligibility check, dynamic per-loan-type UI, risk score visualization, lender offer comparison, loan processing tracking, eSign, repayment dashboard, and offline-capable form filling.

The design follows Flutter Clean Architecture with BLoC/Cubit for state management, a data-driven Dynamic_UI configuration system for multi-loan extensibility, and a comprehensive design system built around Deep Blue (#0A2540) and Teal (#00A86B).

### Key Design Goals

- **Separation of concerns**: Domain logic is fully decoupled from UI and infrastructure
- **Offline-first**: Forms queue locally; sync on reconnect
- **Data-driven extensibility**: New loan types added via config, not code changes
- **Consent-first**: Every data-sharing action requires explicit borrower confirmation
- **Accessibility**: WCAG-aligned contrast, 48dp touch targets, TalkBack semantics

---

## Architecture

### Clean Architecture Layers

```
┌─────────────────────────────────────────────────────┐
│                  Presentation Layer                  │
│   Screens · Widgets · BLoC/Cubit · Route Guards     │
├─────────────────────────────────────────────────────┤
│                   Domain Layer                       │
│   Use Cases · Entities · Repository Interfaces      │
├─────────────────────────────────────────────────────┤
│                    Data Layer                        │
│   Repositories · Remote DS · Local DS · Models      │
├─────────────────────────────────────────────────────┤
│                Infrastructure Layer                  │
│   DI (get_it) · Secure Storage · Network · Cache   │
└─────────────────────────────────────────────────────┘
```

### Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| State management | BLoC/Cubit | Predictable state, testable, scales to complex flows |
| DI | get_it + injectable | Compile-time safe, no reflection overhead |
| Navigation | go_router | Declarative, deep-link support, guard-based auth |
| Local persistence | Hive + flutter_secure_storage | Fast NoSQL for drafts; secure for tokens |
| Network | Dio + retrofit | Interceptors for auth/retry; type-safe API clients |
| Offline queue | Hive outbox pattern | Persist queued mutations; replay on reconnect |
| Remote config | Firebase Remote Config | Loan type config updates without app release |
| Localization | flutter_localizations + ARB | 8 languages, runtime switch without restart |
| Property-based testing | dart_test + fast_check (dart) | Correctness properties across input space |

---

## Folder / Module Structure

```
lib/
├── app/
│   ├── app.dart                    # MaterialApp + router setup
│   ├── di/
│   │   └── injection.dart          # get_it registration
│   └── router/
│       ├── app_router.dart         # go_router configuration
│       └── route_guards.dart       # auth + session guards
│
├── core/
│   ├── constants/
│   │   ├── app_colors.dart
│   │   ├── app_typography.dart
│   │   ├── app_spacing.dart
│   │   └── app_icons.dart
│   ├── design_system/
│   │   ├── theme/
│   │   │   ├── app_theme.dart
│   │   │   ├── light_theme.dart
│   │   │   └── dark_theme.dart
│   │   └── components/
│   │       ├── cs_button.dart
│   │       ├── cs_card.dart
│   │       ├── cs_input_field.dart
│   │       ├── cs_bottom_nav.dart
│   │       ├── cs_step_indicator.dart
│   │       ├── cs_shimmer_loader.dart
│   │       ├── cs_empty_state.dart
│   │       ├── cs_gauge.dart
│   │       └── cs_offer_card.dart
│   ├── error/
│   │   ├── failures.dart
│   │   └── exceptions.dart
│   ├── network/
│   │   ├── dio_client.dart
│   │   ├── interceptors/
│   │   │   ├── auth_interceptor.dart
│   │   │   └── retry_interceptor.dart
│   │   └── connectivity_service.dart
│   ├── storage/
│   │   ├── secure_storage.dart
│   │   └── hive_storage.dart
│   ├── offline/
│   │   ├── offline_queue.dart
│   │   └── sync_service.dart
│   └── utils/
│       ├── validators.dart
│       ├── formatters.dart
│       └── extensions.dart
│
├── features/
│   ├── splash/
│   ├── onboarding/
│   ├── eligibility/
│   ├── loan_type_selection/
│   ├── loan_application/
│   ├── document_upload/
│   ├── consent/
│   ├── risk_score/
│   ├── lender_offers/
│   ├── offer_selection/
│   ├── loan_tracker/
│   ├── loan_agreement/
│   ├── loan_dashboard/
│   ├── rejection_recovery/
│   ├── notifications/
│   ├── profile/
│   └── home/
│
└── l10n/
    ├── app_en.arb
    ├── app_hi.arb
    ├── app_ta.arb
    ├── app_te.arb
    ├── app_kn.arb
    ├── app_bn.arb
    ├── app_mr.arb
    └── app_gu.arb
```

Each feature follows the same internal structure:

```
features/{feature}/
├── data/
│   ├── datasources/
│   │   ├── {feature}_remote_ds.dart
│   │   └── {feature}_local_ds.dart
│   ├── models/
│   │   └── {feature}_model.dart      # JSON serializable, extends entity
│   └── repositories/
│       └── {feature}_repository_impl.dart
├── domain/
│   ├── entities/
│   │   └── {feature}_entity.dart
│   ├── repositories/
│   │   └── {feature}_repository.dart  # abstract interface
│   └── usecases/
│       └── {usecase}.dart
└── presentation/
    ├── bloc/
    │   ├── {feature}_bloc.dart
    │   ├── {feature}_event.dart
    │   └── {feature}_state.dart
    ├── screens/
    │   └── {feature}_screen.dart
    └── widgets/
        └── {feature}_widget.dart
```

---

## State Management

### BLoC / Cubit Strategy

| Scope | Type | Rationale |
|---|---|---|
| Auth / Session | BLoC | Complex event-driven transitions |
| Loan Application Flow | BLoC | Multi-step, event-heavy, resumable |
| Eligibility Check | Cubit | Simple request/response |
| Risk Score | Cubit | Single async fetch |
| Lender Offers | BLoC | Expiry events, compare selection |
| Loan Tracker | BLoC | Real-time status push events |
| Consent | BLoC | Toggle events, expiry alerts |
| Notifications | Cubit | List + read state |
| Profile | Cubit | Form edits |
| Theme / Language | Cubit | App-wide, persisted |

### Global Providers (MultiBlocProvider at app root)

```dart
MultiBlocProvider(
  providers: [
    BlocProvider(create: (_) => sl<AuthBloc>()),
    BlocProvider(create: (_) => sl<ThemeCubit>()),
    BlocProvider(create: (_) => sl<LanguageCubit>()),
    BlocProvider(create: (_) => sl<ConnectivityCubit>()),
    BlocProvider(create: (_) => sl<NotificationCubit>()),
  ],
  child: AppRouter(),
)
```

Feature-scoped BLoCs are provided at the route level via `BlocProvider` in the router, ensuring they are disposed when the route is popped.

### Loan Application State Machine

The `LoanApplicationBloc` manages the multi-step application as a state machine:

```
Idle
  └─ StartApplication ──► StepLoading
                              └─ StepLoaded(step, data)
                                    ├─ ValidateStep ──► ValidationError(fields)
                                    ├─ NextStep ──► StepLoaded(step+1, data)
                                    ├─ PreviousStep ──► StepLoaded(step-1, data)
                                    ├─ SaveDraft ──► DraftSaved
                                    └─ SubmitApplication ──► Submitting
                                                                └─ Submitted(refNo)
                                                                └─ SubmissionError
```

---

## Navigation Architecture

### go_router Configuration

```
/                           → SplashScreen
/language                   → LanguageSelectionScreen
/onboarding                 → OnboardingWelcomeScreen
  /onboarding/kyc           → AadhaarKycScreen
  /onboarding/pan-fallback  → PanFallbackScreen
  /onboarding/profile-setup → ProfileSetupScreen
/home                       → HomeScreen (ShellRoute with bottom nav)
  /home/apply               → LoanTypeSelectionScreen
  /home/track               → LoanTrackerScreen
  /home/dashboard           → LoanDashboardScreen
  /home/profile             → ProfileScreen
/eligibility                → EligibilityCheckScreen
/loan-application/:loanType → LoanApplicationScreen
  /loan-application/:loanType/documents → DocumentUploadScreen
/consent                    → ConsentScreen
/risk-score                 → RiskScoreScreen
/lender-offers              → LenderOffersScreen
/offer-selection/:offerId   → OfferSelectionScreen
/loan-tracker/:applicationId → LoanTrackerDetailScreen
/loan-agreement/:applicationId → LoanAgreementScreen
/rejection-recovery         → RejectionRecoveryScreen
/notifications              → NotificationCenterScreen
/maintenance                → MaintenanceScreen
```

### Route Guards

```dart
// AuthGuard: redirects unauthenticated users to /onboarding
// SessionGuard: checks 30-min inactivity, redirects to OTP re-auth
// OnboardingGuard: skips language selection for returning users
```

Deep links from push notifications use the same go_router paths, enabling direct navigation to any screen.

---

## Components and Interfaces

### Design System Components

#### CsButton

```dart
enum CsButtonVariant { primary, secondary, ghost }

class CsButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;   // null = disabled state
  final CsButtonVariant variant;
  final bool isLoading;
  // height: 52dp, border-radius: 12dp
  // primary: bg #00A86B, text white 16sp semi-bold
  // secondary: border 1.5dp #00A86B, bg transparent
  // disabled: bg #E9ECEF, text #6C757D
}
```

#### CsCard

```dart
class CsCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets? padding;
  // border-radius: 16dp, elevation: 2dp (light) / 0dp + 1dp border (dark)
  // bg: white (light) / #161B22 (dark), padding: 16dp
}
```

#### CsInputField

```dart
class CsInputField extends StatelessWidget {
  final String label;
  final String? hint;
  final String? errorText;
  final TextEditingController controller;
  final TextInputType keyboardType;
  final bool enabled;
  // height: 56dp, border-radius: 12dp
  // focused border: 2dp #00A86B
  // error border: 2dp #DC3545
  // label: 12sp above field
}
```

#### CsGauge (Risk Score)

```dart
class CsGauge extends StatefulWidget {
  final int score;           // 0–1000
  final double confidence;   // 0.0–1.0
  // Animated arc gauge
  // Red: 0–400, Orange: 401–600, Green: 601–1000
  // Score displayed prominently in center
  // Confidence indicator below
}
```

#### CsStepIndicator

```dart
class CsStepIndicator extends StatelessWidget {
  final int currentStep;
  final int totalSteps;
  final String estimatedTime;
  // Horizontal dots + progress bar
  // Active: filled Secondary color
  // Completed: checkmark Secondary color
  // Pending: outlined muted
}
```

#### CsShimmerLoader

```dart
class CsShimmerLoader extends StatelessWidget {
  final double width;
  final double height;
  final double borderRadius;
  // base: #E9ECEF (light) / #21262D (dark)
  // highlight: #F8F9FA (light) / #30363D (dark)
  // animation: 1.2s loop
}
```

#### CsOfferCard

```dart
class CsOfferCard extends StatelessWidget {
  final LenderOffer offer;
  final bool isSelected;
  final bool isCompareMode;
  final VoidCallback onTap;
  final VoidCallback onCompareToggle;
  // Shows: lender name, amount, EMI, rate, tenure, total cost
  // Expanded state: processing fee, prepayment terms
}
```

### Key Screen Interfaces

#### Dynamic Loan Application Form

The `LoanApplicationScreen` renders fields dynamically from `LoanTypeConfig`:

```dart
class LoanTypeConfig {
  final LoanType loanType;
  final List<FormFieldConfig> fields;
  final List<DocumentConfig> documents;
  final List<String> stepSequence;
  final EligibilityParams eligibilityParams;
}

class FormFieldConfig {
  final String fieldKey;
  final FieldType type;           // text, dropdown, slider, date, number
  final String labelKey;          // i18n key
  final String? placeholderKey;
  final List<ValidationRule> validationRules;
  final bool mandatory;
  final Map<String, dynamic>? options;  // for dropdowns
}
```

This config is fetched from Firebase Remote Config on app start and cached locally, enabling new loan types without an app release.

#### Loan Tracker Timeline

```dart
class ApplicationStage {
  final String stageKey;
  final String labelKey;
  final StageStatus status;       // completed, active, pending, actionRequired
  final String? actionPromptKey;
  final DateTime? completedAt;
}

enum StageStatus { completed, active, pending, actionRequired }
```

The timeline renders stages in order, with visual differentiation per `StageStatus`.

---

## Data Models

### Core Entities

```dart
// Borrower profile
class BorrowerProfile {
  final String id;
  final String name;
  final String mobileNumber;
  final KycStatus kycStatus;
  final String? aadhaarToken;     // tokenized, never raw Aadhaar
  final String? panNumber;
  final Address address;
  final DateTime dateOfBirth;
  final String preferredLanguage;
  final int profileCompletionPercent;
}

// Loan application
class LoanApplication {
  final String id;
  final String referenceNumber;
  final LoanType loanType;
  final double requestedAmount;
  final ApplicationStatus status;
  final int currentStep;
  final Map<String, dynamic> formData;   // dynamic per loan type
  final List<UploadedDocument> documents;
  final DateTime createdAt;
  final DateTime? lastSavedAt;
  final bool isDraft;
}

// Risk score result
class RiskScoreResult {
  final int score;                        // 0–1000
  final RiskBand band;                    // poor, fair, good
  final double confidencePercent;
  final List<ScoreExplanationFactor> topFactors;
  final bool isPreApproved;
  final double? preApprovedAmount;
}

class ScoreExplanationFactor {
  final String labelKey;
  final String descriptionKey;
  final String improvementKey;
  final FactorImpact impact;              // positive, negative, neutral
}

// Lender offer
class LenderOffer {
  final String offerId;
  final String lenderName;
  final double offeredAmount;
  final double monthlyEmi;
  final double annualInterestRate;
  final int tenureMonths;
  final double totalRepaymentCost;
  final double processingFee;
  final String prepaymentTerms;
  final DateTime expiresAt;
  final bool isExpired;
}

// Consent record
class ConsentRecord {
  final String consentId;
  final DataCategory category;
  final bool isActive;
  final DateTime grantedAt;
  final DateTime expiresAt;
  final bool isExpiringSoon;    // within 7 days
}

enum DataCategory { bankStatements, upiHistory, utilityBills, mobileUsage }

// EMI schedule entry
class EmiEntry {
  final int installmentNumber;
  final DateTime dueDate;
  final double amount;
  final EmiStatus status;       // paid, upcoming, overdue
  final double? lateFee;
  final DateTime? paidAt;
}

// Notification
class AppNotification {
  final String id;
  final NotificationType type;
  final String titleKey;
  final String bodyKey;
  final Map<String, String> params;   // for i18n interpolation
  final String deepLinkPath;
  final bool isRead;
  final DateTime receivedAt;
}
```

### Offline Queue Model

```dart
class QueuedMutation {
  final String id;
  final MutationType type;
  final String endpoint;
  final Map<String, dynamic> payload;
  final DateTime queuedAt;
  final int retryCount;
  final MutationStatus status;    // pending, syncing, failed, synced
}
```

### Loan Type Configuration (Remote Config Schema)

```json
{
  "loanTypes": [
    {
      "type": "personal",
      "labelKey": "loan_type_personal",
      "iconAsset": "assets/icons/personal_loan.svg",
      "fields": [
        {
          "fieldKey": "income_amount",
          "type": "number",
          "labelKey": "field_income_amount",
          "mandatory": true,
          "validationRules": [
            { "rule": "min", "value": 5000, "messageKey": "validation_income_min" }
          ]
        }
      ],
      "documents": [
        {
          "docKey": "salary_slip",
          "labelKey": "doc_salary_slip",
          "formats": ["jpeg", "png", "pdf"],
          "maxSizeMb": 5,
          "mandatory": true,
          "count": 3
        }
      ],
      "stepSequence": ["personal_info", "employment", "income", "documents", "review"],
      "eligibilityParams": {
        "minIncomeRange": "10000-25000",
        "supportedCities": "all"
      }
    }
  ]
}
```

---

## Design System Implementation

### Theme Architecture

```dart
// AppTheme produces ThemeData for light and dark modes
// All colors reference semantic tokens, never hardcoded hex in widgets

class AppColors {
  // Brand
  static const primary = Color(0xFF0A2540);
  static const secondary = Color(0xFF00A86B);

  // Light mode
  static const backgroundLight = Color(0xFFFFFFFF);
  static const surfaceLight = Color(0xFFF5F7FA);
  static const cardLight = Color(0xFFFFFFFF);
  static const borderLight = Color(0xFFDDE1E7);

  // Dark mode
  static const backgroundDark = Color(0xFF0D1117);
  static const surfaceDark = Color(0xFF161B22);
  static const cardDark = Color(0xFF161B22);
  static const borderDark = Color(0xFF30363D);

  // Semantic
  static const success = Color(0xFF28A745);
  static const warning = Color(0xFFFD7E14);
  static const error = Color(0xFFDC3545);

  // Dark mode brand variants
  static const primaryDark = Color(0xFF1A6B9A);
  static const secondaryDark = Color(0xFF00C47E);
}
```

### Typography

```dart
class AppTypography {
  static const heading = TextStyle(fontSize: 24, fontWeight: FontWeight.bold);
  static const subheading = TextStyle(fontSize: 18, fontWeight: FontWeight.w600);
  static const body = TextStyle(fontSize: 14, fontWeight: FontWeight.normal);
  static const caption = TextStyle(fontSize: 12, fontWeight: FontWeight.normal);
  static const buttonLabel = TextStyle(fontSize: 16, fontWeight: FontWeight.w600);
  static const navLabel = TextStyle(fontSize: 10);
}
```

### Spacing

All spacing uses 8dp increments: `AppSpacing.xs = 8`, `sm = 16`, `md = 24`, `lg = 32`.

### Glassmorphism

Applied only to floating cards and modal overlays:

```dart
// Light: bg white 70% opacity, blur 10dp, border 1dp white 20% opacity
// Dark: bg #161B22 80% opacity, blur 10dp, border 1dp white 20% opacity
class GlassmorphicContainer extends StatelessWidget {
  // Uses BackdropFilter with ImageFilter.blur(sigmaX: 10, sigmaY: 10)
  // Applied only to: floating action sheets, modal overlays
  // NOT applied to: regular cards, list items, form fields
}
```

### Gradient Usage

Gradients are restricted to: splash screen, onboarding hero sections, risk score gauge.
Direction: 135° (top-left to bottom-right), from `#0A2540` to its 60%-lightened variant.

---

## Offline Support Strategy

### Architecture

```
User Action
    │
    ▼
ConnectivityService.isOnline?
    ├── YES → Direct API call via Dio
    └── NO  → Write to OfflineQueue (Hive)
                    │
                    ▼
            SyncService (background)
                    │
              On reconnect:
                    │
                    ▼
            Replay queued mutations
            in FIFO order
                    │
                    ▼
            Update local state
            Notify user of sync result
```

### Offline-Capable Operations

| Operation | Offline Behavior |
|---|---|
| Fill loan application form | Fully offline; saved to Hive draft |
| Document selection | Local file reference saved; upload queued |
| Consent toggles | Queued mutation |
| View saved drafts | Fully offline from Hive |
| View cached offers | Read from Hive cache (TTL: 4 hours) |
| View loan dashboard | Read from Hive cache (TTL: 2 hours) |
| Submit application | Queued; submitted on reconnect |

### Connectivity Banner

`ConnectivityCubit` monitors `connectivity_plus`. When offline, a persistent banner appears at the top of every screen. When reconnected, `SyncService` replays the queue and the banner dismisses.

### Cache Strategy

- **Hive boxes**: `drafts`, `offers_cache`, `dashboard_cache`, `notifications`, `loan_type_config`
- **TTL enforcement**: Each cached entry stores `cachedAt`; stale entries are refreshed on next online access
- **Secure data**: Auth tokens and Aadhaar tokens stored in `flutter_secure_storage`, never in Hive

---

## Security Considerations

### Identity and Token Handling

- Raw Aadhaar numbers are **never stored** — only UIDAI-compliant tokenized references
- Auth tokens stored in `flutter_secure_storage` (Android Keystore / iOS Secure Enclave backed)
- Session timeout: 30 minutes of inactivity triggers OTP re-authentication
- Biometric re-auth supported as an alternative to OTP for session resume

### Data in Transit

- All API calls over HTTPS with certificate pinning via Dio's `BadCertificateCallback`
- Sensitive fields (PAN, income) encrypted at the application layer before transmission

### Data at Rest

- Hive boxes containing PII use `HiveAesCipher` with key stored in `flutter_secure_storage`
- Application drafts containing financial data are encrypted at rest

### Consent Enforcement

- Every data-sharing action requires explicit `ConsentRecord` with `grantedAt` timestamp
- Consent state is validated server-side before any AA Framework data fetch
- Revoked consents trigger local cache purge within the app session

### Screen Security

- Screenshot prevention on sensitive screens (OTP entry, agreement review, risk score) via `FLAG_SECURE` on Android
- App backgrounding blurs sensitive content using an overlay

### Regulatory Compliance

- DPDPA 2023: Data deletion requests processed within 30 days; retention reasons disclosed
- RBI guidelines: Aadhaar tokenization per UIDAI; eSign via licensed ASP
- AA Framework: Consent artifacts stored with full audit trail

---

## Error Handling

### Error Hierarchy

```dart
abstract class Failure {
  final String messageKey;
  final String? technicalDetail;
}

class NetworkFailure extends Failure {}
class AuthFailure extends Failure {}
class ValidationFailure extends Failure {
  final Map<String, String> fieldErrors;
}
class ServerFailure extends Failure {
  final int statusCode;
}
class OfflineFailure extends Failure {}
class DocumentUploadFailure extends Failure {
  final String reason;   // size_exceeded, unsupported_format, server_error
}
```

### Error Presentation Rules

| Error Type | Presentation |
|---|---|
| Network error | Inline banner + Retry button; no navigation away |
| Validation error | Inline field-level error in Error Red (#DC3545) |
| Document upload failure | Inline error with retry; file reference retained |
| Full-screen error | Illustration + heading + message + "Try Again" button |
| Maintenance | Dedicated maintenance screen with ETA + "Notify Me" |
| Session expiry | OTP re-auth modal overlay; data retained |

### Retry Strategy

- Network requests: exponential backoff, max 3 retries (implemented in `RetryInterceptor`)
- Document uploads: manual retry; file reference held in memory until success or explicit cancel
- Offline queue: retry on reconnect with max 5 attempts per mutation; failed mutations surfaced to user

---

## Testing Strategy

### Unit Tests

- Use case logic (eligibility calculation, offer sorting, consent expiry checks)
- Validators (field validation rules, document format/size checks)
- Formatters (currency, date, EMI calculation)
- BLoC/Cubit state transitions with `bloc_test`
- Repository implementations with mocked data sources

### Widget Tests

- Design system components (CsButton, CsCard, CsInputField, CsGauge)
- Screen rendering with mocked BLoC states
- Shimmer loaders, empty states, error states

### Integration Tests

- Full onboarding flow (Aadhaar eKYC → profile setup)
- Loan application flow end-to-end (step navigation, save/resume)
- Offline queue: fill form offline → reconnect → verify sync
- Deep link navigation from push notifications

### Property-Based Testing

The app uses `package:test` with a property-based testing approach for core business logic. Properties are run with a minimum of 100 iterations each.

Tag format: `// Feature: creditshield-flutter-app, Property {N}: {property_text}`


---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

**Property Reflection:** Before finalizing, redundant properties were eliminated:
- Req 4.4 and 4.5 both describe Dynamic_UI loading from config → merged into Property 4
- Req 7.3 and 7.4 both describe document validation rules → merged into Property 6
- Req 13.2 and 13.3 both describe EMI reminder thresholds → merged into Property 10
- Req 19.1 (extensibility config) is subsumed by Property 4 (Dynamic_UI from config)

---

### Property 1: Language preference round-trip

*For any* language in the supported set (Hindi, English, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati), saving that language as the user's preference and then re-initializing the app state should restore exactly that language as the active locale.

**Validates: Requirements 1.3, 1.4**

---

### Property 2: Positive eligibility result completeness

*For any* positive eligibility result returned by the eligibility service, the rendered eligibility screen should contain all three required elements: an "Eligible" status indicator, a loan range expressed in Indian Rupees, and a "Continue Application" CTA button.

**Validates: Requirements 3.3**

---

### Property 3: Negative eligibility result completeness

*For any* negative eligibility result, the rendered eligibility screen should contain all three required elements: a "Not Eligible" status indicator, a plain-language rejection reason, and at least one actionable improvement suggestion.

**Validates: Requirements 3.4**

---

### Property 4: Dynamic UI matches loan type configuration

*For any* `LoanTypeConfig` in the configuration registry, selecting that loan type should cause the application form to render exactly the fields defined in that config's `fields` list — no more, no fewer — with the correct field types, labels, and validation rules.

**Validates: Requirements 4.4, 4.5, 19.1**

---

### Property 5: Consent toggle state consistency

*For any* set of data category consent toggles, after the borrower toggles any individual category, the resulting consent state should reflect exactly that toggle value, and the consent summary should accurately enumerate all currently active categories.

**Validates: Requirements 5.1, 5.2**

---

### Property 6: Consent non-blocking invariant

*For any* subset of data categories that a borrower declines, the loan application flow should remain unblocked — the "Proceed" action should remain available regardless of which categories are declined.

**Validates: Requirements 5.3**

---

### Property 7: Consent expiry threshold

*For any* `ConsentRecord`, the `isExpiringSoon` flag should be `true` if and only if `(expiresAt - now) <= 7 days`. This should hold for any consent record and any reference timestamp.

**Validates: Requirements 5.5**

---

### Property 8: Mandatory field validation completeness

*For any* `FormStepConfig` and any form submission where one or more mandatory fields are empty or invalid, the validation result should contain an error entry for every mandatory field that failed — and only for those fields.

**Validates: Requirements 6.3**

---

### Property 9: EMI calculation correctness

*For any* valid triple of (principal amount P, annual interest rate R, tenure in months N) where P > 0, R > 0, and N > 0, the calculated monthly EMI should satisfy the standard formula:

`EMI = P × r × (1+r)^N / ((1+r)^N − 1)` where `r = R / 12 / 100`

The calculated value should match the formula result within a tolerance of ₹1 (rounding).

**Validates: Requirements 6.7**

---

### Property 10: Document validation correctness

*For any* file submitted for document upload:
- If the file size exceeds 5MB, the validation result should be `size_exceeded`
- If the file format is not in `{jpeg, png, pdf}`, the validation result should be `unsupported_format`
- If both conditions hold, either error is acceptable
- If neither condition holds, the validation result should be `valid`

**Validates: Requirements 7.3, 7.4**

---

### Property 11: Risk score color band assignment

*For any* integer score S in [0, 1000], the assigned `RiskBand` should satisfy:
- `S ∈ [0, 400]` → `RiskBand.poor` (red)
- `S ∈ [401, 600]` → `RiskBand.fair` (orange)
- `S ∈ [601, 1000]` → `RiskBand.good` (green)

No score in [0, 1000] should produce an unassigned or invalid band.

**Validates: Requirements 8.1**

---

### Property 12: Lender offers sort invariant

*For any* non-empty list of `LenderOffer` objects, after applying the display sort, the resulting list should be ordered such that for every adjacent pair `(offers[i], offers[i+1])`, `offers[i].monthlyEmi <= offers[i+1].monthlyEmi`.

**Validates: Requirements 9.2**

---

### Property 13: Application stage status rendering invariant

*For any* list of `ApplicationStage` objects, each stage's rendered visual indicator should match its `StageStatus` — completed stages use filled icons in secondary color, the active stage uses an animated pulse indicator, and pending stages use outlined muted icons. No stage should render with a visual style inconsistent with its status.

**Validates: Requirements 11.2**

---

### Property 14: Loan agreement expiry threshold

*For any* loan agreement with a `generatedAt` timestamp and any reference `now` timestamp, the agreement's `isExpired` flag should be `true` if and only if `(now - generatedAt) >= 7 days`.

**Validates: Requirements 12.6**

---

### Property 15: EMI reminder threshold

*For any* `EmiEntry` with a `dueDate` and any reference `now` timestamp:
- `shouldSendEarlyReminder` should be `true` iff `(dueDate - now) <= 5 days` and the EMI is not yet paid
- `shouldSendFinalReminder` should be `true` iff `(dueDate - now) <= 1 day` and the EMI is not yet paid

**Validates: Requirements 13.2, 13.3**

---

### Property 16: Rejection recovery reduced amount

*For any* original requested loan amount A > 0, the "Apply with a lower amount" suggestion should pre-populate the new application with exactly `A × 0.5`, rounded to the nearest ₹1,000.

**Validates: Requirements 14.4**

---

### Property 17: Application draft persistence round-trip

*For any* `LoanApplication` draft object, serializing it to the local Hive store and then deserializing it should produce an object that is structurally equivalent to the original — all form data fields, step index, loan type, and document references should be preserved.

**Validates: Requirements 20.1**

---

### Property 18: Session expiry preserves draft data

*For any* `LoanApplication` draft saved before a session expiry event, the draft data should remain unchanged after the session expiry is processed — session expiry should only affect authentication state, not application draft state.

**Validates: Requirements 20.2**


# Requirements Document
## CreditShield — AI-Powered Loan Risk Assessment Flutter App (Borrower)

---

## Introduction

CreditShield is a production-grade Flutter mobile application (Android-first, IOS ready ) that serves as the borrower-facing interface of the AI-Powered Loan Risk Assessment Platform for India. It is the primary touchpoint through which Indian borrowers — including salaried employees, gig workers, students, and rural households — discover, apply for, and manage loans across multiple product types.

The app wraps the platform's Credit_Engine and backend services in a mobile-first experience designed for real Indian conditions: low digital literacy, intermittent connectivity, multilingual users, and a regulatory environment governed by RBI guidelines and the Digital Personal Data Protection Act 2023 (DPDPA). CreditShield is not a generic loan aggregator — it is an AI-driven, consent-first, explainability-focused application that gives every borrower a fair evaluation regardless of their formal credit history.

The app supports five primary loan types — Personal, Gold, Home, Car, and Education — each with a fully dynamic UI, custom input fields, document requirements, and verification flows. The design system uses soft gradients, subtle glassmorphism, rounded cards, and a Deep Blue / Teal color palette in both light and dark modes, projecting the trust and professionalism expected of a fintech product.

**Core value proposition for the borrower:**
- Check eligibility in seconds with minimal inputs
- Apply once, receive offers from multiple lenders
- Understand every decision in plain language
- Track loan status and repayments in one place
- Full control over data sharing and consent

---

## Glossary

| Term | Definition |
|---|---|
| App | The CreditShield Flutter mobile application |
| Borrower | An individual using the App to apply for and manage loans |
| Credit_Engine | The backend AI component that produces a Risk_Score for each application |
| Risk_Score | A numerical creditworthiness score (0–1000) produced by the Credit_Engine |
| Consent_Manager | The backend component managing borrower data consent per AA framework and DPDPA |
| Loan_Application_Flow | The in-app sequence of screens a borrower completes to submit a loan application |
| Loan_Type | One of the supported loan products: Personal, Gold, Home, Car, or Education |
| Dynamic_UI | UI components, fields, and flows that change based on the selected Loan_Type |
| Eligibility_Check | A lightweight pre-screening flow that estimates loan eligibility before full application |
| Offer_Card | A UI card displaying a single lender's offer (amount, EMI, rate, tenure) |
| Application_Status | The current lifecycle stage of a loan application, displayed in real time |
| Loan_Dashboard | The in-app screen showing active loan details, EMI schedule, and repayment status |
| eSign | Aadhaar-based electronic signature used to execute the Loan_Agreement |
| Loan_Agreement | The legally binding loan contract presented for borrower review and eSign |
| Onboarding_Flow | The sequence of screens for first-time registration and identity verification |
| Document_Upload | The in-app flow for uploading loan-type-specific supporting documents |
| Rejection_Recovery | The in-app flow shown when a loan application is rejected, with improvement guidance |
| Design_System | The visual language of the App: colors, typography, spacing, component library |
| AA_Framework | Account Aggregator framework — RBI-regulated consented data sharing infrastructure |
| DigiLocker | Government digital document repository used for KYC document retrieval |
| DPDPA | Digital Personal Data Protection Act 2023 |
| Offline_Mode | App behavior when network connectivity is unavailable or degraded |
| Step_Indicator | A visual progress component showing current step and total steps in a multi-step flow |
| Credit_Building_Tracker | A UI component showing how on-time repayments improve the borrower's Risk_Score |
| Lender_Offer | A structured response from a participating lender with loan terms |
| Anonymized_Profile | A borrower profile with direct identifiers removed, shared with lenders pre-selection |
| Verification_Workflow | The lender-side processing pipeline after Offer_Selection |
| Notification_Center | The in-app hub for all push notifications and status alerts |

---

## Requirements

### Requirement 1: Splash Screen, Branding, and Language Selection

**User Story:** As a first-time user, I want to see a professional branded launch experience and choose my preferred language, so that I feel confident in the app and can use it in a language I understand.

#### Acceptance Criteria

1. WHEN the App is launched, THE App SHALL display a splash screen showing the CreditShield logo, tagline, and a loading animation for a minimum of 2 seconds before transitioning to the next screen
2. WHEN the splash screen completes, THE Onboarding_Flow SHALL present a language selection screen offering: Hindi, English, Tamil, Telugu, Kannada, Bengali, Marathi, and Gujarati
3. WHEN a borrower selects a language, THE App SHALL render all subsequent screens — including labels, error messages, tooltips, button text, and notifications — in the selected language for the entire session
4. WHEN a returning borrower opens the App, THE App SHALL skip the language selection screen and use the previously saved language preference
5. THE App SHALL apply the Design_System color palette (Primary: #0A2540 Deep Blue, Secondary: #00A86B Teal/Green, Background: White / Light Grey) consistently across all screens in light mode
6. WHERE the device is set to dark mode, THE App SHALL apply a dark mode variant of the Design_System with appropriate contrast ratios for all text and interactive elements
7. THE App SHALL use rounded cards, soft gradients, and subtle glassmorphism effects as defined in the Design_System — heavy glassmorphism effects SHALL NOT be used

---

### Requirement 2: Onboarding and Identity Verification

**User Story:** As a new borrower, I want to register and verify my identity quickly using my Aadhaar or PAN, so that I can access loan products without visiting a branch.

#### Acceptance Criteria

1. WHEN a borrower initiates registration, THE Onboarding_Flow SHALL present welcome screens (maximum 3 slides) explaining the app's value proposition before requesting any personal information
2. WHEN a borrower proceeds past the welcome screens, THE Onboarding_Flow SHALL offer Aadhaar eKYC via OTP as the primary identity verification method
3. WHEN Aadhaar eKYC is completed successfully, THE Onboarding_Flow SHALL retrieve and pre-fill name, date of birth, and address from DigiLocker — the borrower SHALL review and confirm pre-filled data before proceeding
4. IF Aadhaar eKYC fails or is unavailable, THEN THE Onboarding_Flow SHALL present PAN card upload plus selfie liveness check as a fallback, with a plain-language explanation of why the primary method failed
5. WHEN a selfie liveness check is required, THE Onboarding_Flow SHALL guide the borrower through the liveness steps with on-screen instructions and SHALL complete the check within 60 seconds
6. WHEN identity verification is complete, THE Onboarding_Flow SHALL create a verified borrower profile and transition to the profile setup screen within 60 seconds
7. THE Onboarding_Flow SHALL NOT store raw Aadhaar numbers — only a tokenized reference compliant with UIDAI guidelines SHALL be retained
8. WHEN a borrower abandons onboarding mid-flow, THE Onboarding_Flow SHALL save progress locally and resume from the same step on the next app open without requiring re-verification
9. THE Onboarding_Flow SHALL display a Step_Indicator showing current step and total steps on every verification screen
10. WHEN a borrower completes identity verification, THE Onboarding_Flow SHALL present a plain-language summary of what data will be collected, why it is needed, and how it will be used — before requesting any data permissions

---

### Requirement 3: Pre-Eligibility Check

**User Story:** As a borrower, I want to check my loan eligibility in seconds with minimal inputs, so that I know whether it is worth completing a full application before investing time.

#### Acceptance Criteria

1. WHEN a borrower accesses the eligibility check, THE App SHALL present a screen titled "Check your eligibility in seconds" with exactly three inputs: income range (dropdown), loan type (selector), and city (searchable dropdown)
2. WHEN a borrower submits the eligibility check, THE App SHALL return an eligibility result within 10 seconds
3. WHEN the eligibility result is positive, THE App SHALL display: an "Eligible" status indicator, an approximate loan range in Indian Rupees (e.g., "₹25,000 – ₹1,00,000"), and a prominent CTA button labeled "Continue Application"
4. WHEN the eligibility result is negative, THE App SHALL display: a "Not Eligible" status indicator, the primary reason in plain language (e.g., "Your income range does not meet the minimum requirement for this loan type"), and at least one actionable suggestion
5. THE App SHALL NOT require login or identity verification to access the Pre-Eligibility Check — it SHALL be accessible to unauthenticated users
6. WHEN a borrower taps "Continue Application" after a positive eligibility result, THE App SHALL transition to the Loan_Type selection screen with the previously selected loan type pre-selected

---

### Requirement 4: Loan Type Selection

**User Story:** As a borrower, I want to select my loan type from a clear visual interface, so that the application flow adapts to my specific needs.

#### Acceptance Criteria

1. WHEN a borrower reaches the loan type selection screen, THE App SHALL display loan type options as cards in a grid layout, each showing: an icon, loan type name, and a brief descriptor (e.g., "Personal Loan — For any personal need")
2. THE App SHALL display the following five primary loan types: Personal Loan, Gold Loan, Home Loan, Car Loan, and Education Loan
3. WHEN a borrower selects a Loan_Type, THE App SHALL visually highlight the selected card with the secondary color (#00A86B) border and a checkmark indicator
4. WHEN a borrower confirms a Loan_Type selection, THE Dynamic_UI SHALL load the input fields, document requirements, and verification flow specific to that Loan_Type for all subsequent application screens
5. THE App SHALL display the following Dynamic_UI configurations per Loan_Type:
   - Personal Loan: income details, employment type, employer name, bank account data
   - Gold Loan: gold weight (grams), purity selection (18K/22K/24K), estimated valuation display
   - Home Loan: property value, property location, builder or project name, construction status
   - Car Loan: vehicle make and model, dealer name, on-road price, vehicle type (new/used)
   - Education Loan: college name, course name, course duration, total fee breakdown
6. WHEN a borrower changes their Loan_Type selection after partially completing an application, THE App SHALL warn the borrower that previously entered data for the prior loan type will be cleared, and require explicit confirmation before proceeding

---

### Requirement 5: Data Consent and Permissions Management

**User Story:** As a borrower, I want to understand and control exactly what data I share, so that I can trust the platform with my financial information.

#### Acceptance Criteria

1. WHEN a borrower is asked to share financial data, THE App SHALL present a consent screen listing each data category (bank statements, UPI history, utility bills, mobile usage) with: a plain-language description of its purpose, the benefit to the borrower, and an individual toggle for each category
2. WHEN a borrower toggles consent for a data category, THE App SHALL visually confirm the change immediately and display a summary of currently active consents before the borrower proceeds
3. IF a borrower declines to share a data category, THEN THE App SHALL allow the application to proceed with available data — the App SHALL NOT block progression or display a warning that implies the application will be rejected
4. THE App SHALL provide a dedicated Consent Dashboard accessible from the Profile & Settings screen, showing: all active consents, their expiry dates, data categories covered, and a revoke option for each
5. WHEN a consent is within 7 days of expiry, THE App SHALL display an in-app alert on the Consent Dashboard and send a push notification requesting renewal with a single-tap action
6. WHEN a borrower revokes a consent, THE App SHALL display a confirmation message stating that data collection for that category will stop and any cached data will be deleted within 24 hours
7. WHEN financial data is being fetched via the AA_Framework, THE App SHALL display a real-time status indicator showing which financial institution is being queried and the current fetch status
8. WHEN a borrower requests a data usage report, THE App SHALL display a confirmation that the report will be available within 48 hours, in compliance with DPDPA Section 11

---

### Requirement 6: Dynamic Loan Application Flow

**User Story:** As a borrower, I want to complete a loan application through a guided, step-by-step flow that adapts to my loan type, so that I only see fields relevant to my situation.

#### Acceptance Criteria

1. WHEN a borrower begins a loan application, THE Loan_Application_Flow SHALL display a Step_Indicator showing the current step number, total steps, and an estimated time to complete
2. THE Loan_Application_Flow SHALL auto-populate fields from the verified borrower profile (name, address, income category) to minimize manual data entry
3. WHEN a borrower submits a step, THE Loan_Application_Flow SHALL validate all mandatory fields and display inline validation errors in plain language adjacent to the relevant field before allowing progression to the next step
4. THE Loan_Application_Flow SHALL support a "Save & Resume Later" action on every step — tapping it SHALL save current progress locally and allow the borrower to return to the same step in a future session
5. WHEN the device has no network connectivity, THE Loan_Application_Flow SHALL display an Offline_Mode indicator and allow the borrower to continue filling fields — completed data SHALL be queued for submission when connectivity is restored
6. WHEN the device regains connectivity while in Offline_Mode, THE App SHALL automatically attempt to sync queued data and display a status message confirming successful sync or surfacing any sync errors
7. WHEN a borrower selects a loan amount, THE Loan_Application_Flow SHALL display an estimated EMI, indicative interest rate range, and available tenure options — updated in real time as the borrower adjusts the amount slider
8. THE Loan_Application_Flow SHALL present loan amount selection using a visual slider with pre-set anchor amounts (₹5,000 / ₹10,000 / ₹25,000 / ₹50,000 / ₹1,00,000) and allow custom amounts within configured limits
9. WHEN a borrower completes all steps and submits the application, THE App SHALL display a submission confirmation screen with a reference number and estimated processing time within 5 seconds of submission

---

### Requirement 7: Document Upload System

**User Story:** As a borrower, I want to upload the required documents for my loan type through a simple interface, so that I can complete my application without confusion about what is needed.

#### Acceptance Criteria

1. WHEN a borrower reaches the document upload step, THE App SHALL display only the documents required for the selected Loan_Type, with the following Dynamic_UI configurations:
   - Personal Loan: salary slips (last 3 months), bank statements (last 6 months)
   - Home Loan: property documents (sale deed / agreement), property tax receipt
   - Gold Loan: gold images (minimum 2 photos), self-declaration form
   - Education Loan: college admission letter, fee structure document
   - Car Loan: dealer invoice, vehicle quotation
2. WHEN a borrower uploads a document, THE App SHALL display a preview of the uploaded file (image thumbnail or PDF preview) and a "Re-upload" option adjacent to each document
3. WHEN a document upload fails, THE App SHALL display an inline error message specifying the failure reason (e.g., "File size exceeds 5MB" or "Unsupported file format") and prompt the borrower to retry
4. THE App SHALL accept documents in the following formats: JPEG, PNG, and PDF — maximum file size per document SHALL be 5MB
5. WHEN all required documents for the selected Loan_Type are uploaded, THE App SHALL enable the "Proceed" button and display a checklist confirming each document's upload status
6. WHEN a borrower has previously uploaded a document in a prior session, THE App SHALL display the previously uploaded document with its upload timestamp and offer the option to keep it or re-upload
7. THE App SHALL allow borrowers to upload documents from: device camera (capture), device gallery, and DigiLocker (for KYC documents)

---

### Requirement 8: Risk Score Visualization and Pre-Approved Offer

**User Story:** As a borrower, I want to see my risk score and pre-approved offer in a clear, visual format, so that I understand my creditworthiness and feel confident about the outcome.

#### Acceptance Criteria

1. WHEN the Credit_Engine produces a Risk_Score, THE App SHALL display a risk score screen showing: an animated gauge visualization with the score prominently displayed, a color-coded band (red: 0–400, orange: 401–600, green: 601–1000), and a plain-language label (e.g., "Good", "Fair", "Needs Improvement")
2. THE App SHALL display a Confidence_Indicator adjacent to the gauge showing data completeness as a percentage with a plain-language label (e.g., "Based on 3 data sources")
3. WHEN the Risk_Score qualifies the borrower for a pre-approved offer, THE App SHALL display a pre-approved message (e.g., "You are pre-approved for up to ₹50,000") with a prominent CTA to view lender offers
4. THE App SHALL display Explanation_Cards below the gauge showing the top 3 factors that contributed to the score in plain language — each card SHALL use an icon, a short label, and a one-sentence description
5. THE App SHALL NOT use technical terms such as "probability of default", "feature weight", "model score", or "confidence interval" in any borrower-facing text on this screen
6. WHEN a borrower taps an Explanation_Card, THE App SHALL expand it to show a brief description of what the factor means and how the borrower can improve it
7. WHEN the Risk_Score does not qualify the borrower for any offer, THE App SHALL transition to the Rejection_Recovery flow (Requirement 14) instead of displaying the pre-approved message

---

### Requirement 9: Lender Offers Screen

**User Story:** As a borrower, I want to compare loan offers from multiple lenders in a simple card layout, so that I can choose the best option for my needs without feeling overwhelmed.

#### Acceptance Criteria

1. WHEN at least one Lender_Offer is available, THE App SHALL display each offer as an Offer_Card showing: lender name, offered loan amount (in ₹), monthly EMI, annual interest rate, loan tenure, and total repayment cost
2. THE App SHALL display Offer_Cards in neutral order sorted by monthly EMI amount ascending — the App SHALL NOT visually promote, highlight, or rank any lender based on commercial arrangements
3. WHEN no Lender_Offer is available within 4 hours of application submission, THE App SHALL display a "No offers available" state with the top 2 actionable improvement steps and an option to reapply after 30 days
4. WHEN a Lender_Offer expires before the borrower selects it, THE App SHALL remove the expired Offer_Card from the display and notify the borrower via an in-app alert — if no valid offers remain, the App SHALL display the no-offers state
5. THE App SHALL display a "Compare" option allowing borrowers to select up to 3 Offer_Cards for a side-by-side comparison of key terms
6. WHEN a borrower taps an Offer_Card, THE App SHALL expand it to show additional details: processing fee, prepayment terms, and lender name with a brief descriptor

---

### Requirement 10: Offer Selection and Consent Confirmation

**User Story:** As a borrower, I want to select a lender offer and explicitly confirm what data I am sharing, so that I remain in control of my personal information throughout the process.

#### Acceptance Criteria

1. WHEN a borrower selects a Lender_Offer, THE App SHALL present a consent confirmation screen clearly stating: the lender's name, the data categories that will be shared with that lender, and the purpose of sharing
2. THE App SHALL require the borrower to actively tap a "Confirm and Share" button — passive scrolling or inaction SHALL NOT constitute consent
3. WHEN the borrower confirms Offer_Selection consent, THE App SHALL display a transition screen confirming that the application has been forwarded to the selected lender and update the Application_Status to "Submitted"
4. WHEN the borrower confirms Offer_Selection, THE App SHALL notify the borrower that non-selected lenders will not receive their personal data
5. IF a borrower declines the consent confirmation screen, THEN THE App SHALL return the borrower to the Lender Offers Screen without forwarding any data

---

### Requirement 11: Loan Processing Tracker

**User Story:** As a borrower, I want to track my loan application status in real time through a clear timeline, so that I always know where my application stands and what happens next.

#### Acceptance Criteria

1. WHEN a borrower views the application tracker, THE App SHALL display a vertical timeline UI showing the following Application_Status stages in order: Submitted → KYC Verified → Address Verified → Employment Verified → Financial Verification Complete → Under Review → Approved / Rejected → Agreement Sent → Agreement Signed → Disbursed
2. THE App SHALL visually differentiate completed stages (filled icon, secondary color), the current active stage (animated pulse indicator), and pending stages (outlined icon, muted color)
3. WHEN the Application_Status transitions to a new stage, THE App SHALL send a push notification and update the timeline in real time — the notification SHALL be in the borrower's preferred language
4. THE App SHALL display intermediate statuses — KYC Review Required, Compliance Review, Agreement Expired — as distinct states on the timeline with a plain-language description of what the borrower needs to do
5. WHEN the Application_Status is "KYC Review Required", THE App SHALL display an action prompt allowing the borrower to upload a corrected document directly from the tracker screen
6. WHEN the Application_Status is "Under Review", THE App SHALL display an estimated review completion time if available, or a message stating "We'll notify you as soon as there's an update"
7. THE App SHALL display the application reference number and submission timestamp persistently at the top of the tracker screen

---

### Requirement 12: Loan Agreement and eSign

**User Story:** As a borrower, I want to review my loan agreement in plain language and sign it digitally, so that I can complete the process without needing to visit a branch or print documents.

#### Acceptance Criteria

1. WHEN the Loan_Agreement is ready for review, THE App SHALL display the full agreement document with a plain-language summary of key terms: sanctioned amount, interest rate, EMI amount, tenure, processing fee, prepayment terms, and default consequences
2. THE App SHALL present the key terms summary before the full agreement document — the borrower SHALL be able to scroll through the full agreement at any time
3. THE App SHALL display the agreement in the borrower's preferred language
4. WHEN the borrower is ready to sign, THE App SHALL initiate Aadhaar-based eSign by sending an OTP to the borrower's registered mobile number and displaying an OTP entry screen
5. WHEN the OTP is verified, THE App SHALL confirm the eSign is complete, display a success message, and update the Application_Status to "Agreement Signed"
6. IF the Loan_Agreement is not signed within 7 days of generation, THE App SHALL display an expiry warning at day 5 and day 6, and mark the agreement as "Agreement Expired" on day 7 with a notification to the borrower
7. WHEN the eSign is complete, THE App SHALL provide a "Download Agreement" option that saves the signed agreement as a PDF to the device

---

### Requirement 13: Loan Dashboard and Repayment Tracking

**User Story:** As a borrower with an active loan, I want a dashboard showing my loan details, EMI schedule, and repayment progress, so that I can stay on top of my payments and build my credit profile.

#### Acceptance Criteria

1. WHEN a loan is disbursed, THE Loan_Dashboard SHALL display: active loan card (lender name, sanctioned amount, outstanding balance), EMI schedule (all upcoming EMI dates and amounts), payment status (paid / upcoming / overdue), and total interest paid to date
2. WHEN an EMI due date is 5 days away, THE App SHALL send a push notification and display an in-app reminder on the Loan_Dashboard
3. WHEN an EMI due date is 1 day away and the EMI has not been paid, THE App SHALL send a final reminder push notification
4. WHEN an EMI is marked as paid, THE Loan_Dashboard SHALL update the outstanding balance and payment status within 2 hours of payment confirmation
5. WHEN a borrower misses an EMI, THE Loan_Dashboard SHALL display the overdue amount with applicable late fees and a one-tap payment option
6. THE Loan_Dashboard SHALL display a Credit_Building_Tracker showing: current Risk_Score trend, the impact of on-time payments, and a projected score after the next 3 on-time payments
7. WHEN a borrower completes full loan repayment, THE App SHALL display a loan closure confirmation and provide a "Download Closure Certificate" option that saves a PDF to the device
8. THE Loan_Dashboard SHALL display the borrower's full repayment history including payment dates, amounts paid, and any late fees charged

---

### Requirement 14: Rejection Recovery Flow

**User Story:** As a borrower whose application was rejected, I want to understand why and know what I can do next, so that I don't feel discouraged and can take concrete steps to improve my chances.

#### Acceptance Criteria

1. WHEN a loan application is rejected, THE App SHALL display a Rejection_Recovery screen with: a clear, non-alarming rejection message, the top 3 plain-language reasons for rejection (e.g., "Your income appears irregular over the last 3 months"), and at least 2 specific actionable improvement steps
2. THE App SHALL NOT use technical terms such as "model score", "feature weight", or "probability of default" in the Rejection_Recovery screen
3. THE App SHALL display the following recovery options on the Rejection_Recovery screen: "Apply with a lower amount", "Try a different lender" (if other valid offers exist), and "Reapply later" with a suggested reapplication date
4. WHEN a borrower taps "Apply with a lower amount", THE App SHALL pre-populate a new application with the same loan type and a reduced amount (suggested as 50% of the original requested amount) and return the borrower to the Loan_Application_Flow
5. WHEN a borrower taps "Try a different lender", THE App SHALL display any remaining valid Lender_Offers from the current application — if none exist, the App SHALL display the no-offers state
6. WHEN a borrower taps "Reapply later", THE App SHALL allow the borrower to set a reminder notification for the suggested reapplication date
7. THE App SHALL display a "What can I improve?" section on the Rejection_Recovery screen showing a visual breakdown of the factors that most impacted the decision, using a horizontal bar chart

---

### Requirement 15: Notifications

**User Story:** As a borrower, I want to receive timely, relevant notifications about my application status and loan repayments, so that I never miss an important update or payment deadline.

#### Acceptance Criteria

1. THE App SHALL send push notifications for the following events: Application_Status transitions, EMI reminders (D-5 and D-1), missed EMI alerts, offer expiry warnings (24 hours before expiry), consent expiry warnings (7 days before expiry), and loan disbursement confirmation
2. WHEN a push notification is tapped, THE App SHALL deep-link directly to the relevant screen (e.g., tapping an EMI reminder opens the Loan_Dashboard)
3. THE App SHALL maintain a Notification_Center accessible from the home screen showing all recent notifications with timestamps, read/unread status, and the ability to mark all as read
4. WHEN a borrower has not opened the App in 7 days and has a pending action (unsigned agreement, expiring offer, upcoming EMI), THE App SHALL send a re-engagement push notification
5. THE App SHALL allow borrowers to configure notification preferences in the Profile & Settings screen — borrowers SHALL be able to disable non-critical notification categories (e.g., promotional) while retaining critical alerts (EMI reminders, status updates)
6. ALL push notifications SHALL be delivered in the borrower's preferred language

---

### Requirement 16: Profile and Settings

**User Story:** As a borrower, I want to manage my profile, language preference, and privacy settings in one place, so that I can keep my information up to date and control my experience.

#### Acceptance Criteria

1. THE App SHALL provide a Profile & Settings screen accessible from the bottom navigation bar showing: borrower name, verified mobile number, KYC status, and profile completion percentage
2. WHEN a borrower updates their profile information, THE App SHALL validate the changes and display a confirmation message — changes to KYC-verified fields (name, date of birth) SHALL require re-verification
3. THE App SHALL provide a language switch option in the Profile & Settings screen — WHEN a borrower changes their language, THE App SHALL immediately re-render all visible screens in the new language without requiring an app restart
4. THE App SHALL provide a Consent Dashboard link in the Profile & Settings screen (as defined in Requirement 5)
5. THE App SHALL provide a Privacy Controls section in the Profile & Settings screen allowing borrowers to: view all data collected, request a data usage report, and initiate a data deletion request under DPDPA Section 12
6. WHEN a borrower initiates a data deletion request, THE App SHALL display a confirmation screen explaining what data will be deleted, what data must be retained for regulatory compliance, and the expected completion timeline (30 days)
7. THE App SHALL display the app version, terms of service link, and privacy policy link in the Profile & Settings screen

---

### Requirement 17: Error and Edge State Handling

**User Story:** As a borrower, I want the app to handle errors and unusual situations gracefully, so that I am never left confused or stuck without guidance.

#### Acceptance Criteria

1. WHEN the device has no network connectivity, THE App SHALL display a "No Internet Connection" banner at the top of the current screen and allow the borrower to continue filling offline-capable forms
2. WHEN a network request fails, THE App SHALL display an inline error message with a "Retry" button — the App SHALL NOT navigate away from the current screen on a network error
3. WHEN no Lender_Offers are available, THE App SHALL display a dedicated "No Offers" state screen with an illustration, a plain-language explanation, and the top 2 improvement steps from the Credit_Engine
4. WHEN a verification step is pending (e.g., KYC Review Required), THE App SHALL display a "Verification Pending" state with a clear description of what is being verified and an estimated wait time if available
5. WHEN a loan application has expired (e.g., Agreement Expired), THE App SHALL display an "Expired Application" state with the expiry reason and a "Start New Application" CTA
6. WHEN a borrower has a partially completed application from a previous session, THE App SHALL display a "Resume Application" prompt on the home screen with the loan type, amount, and last saved step
7. IF a critical backend service is unavailable, THEN THE App SHALL display a maintenance screen with an estimated restoration time and a "Notify Me When Available" option that sends a push notification when the service is restored
8. WHEN a document upload fails due to a server error, THE App SHALL retain the locally selected file and allow the borrower to retry the upload without re-selecting the file

---

### Requirement 18: Design System and Accessibility

**User Story:** As a borrower, I want the app to be visually consistent, easy to read, and accessible regardless of my device or visual ability, so that I can use it confidently.

#### Acceptance Criteria

1. THE App SHALL implement the Design_System with the following specifications: Primary color #0A2540 (Deep Blue), Secondary color #00A86B (Teal/Green), Background White (#FFFFFF) / Light Grey (#F5F7FA), Success Green (#28A745), Warning Orange (#FD7E14), Error Red (#DC3545)
2. THE App SHALL use a consistent typography hierarchy: heading (24sp bold), subheading (18sp semi-bold), body (14sp regular), caption (12sp regular) — all text SHALL meet a minimum contrast ratio of 4.5:1 against its background
3. THE App SHALL use a consistent spacing system based on 8dp increments (8dp, 16dp, 24dp, 32dp) for all padding, margins, and component spacing
4. THE App SHALL implement bottom navigation with a maximum of 5 tabs: Home, Apply, Track, Dashboard, and Profile
5. THE App SHALL support dynamic font scaling — WHEN a device's accessibility font size is increased, THE App SHALL scale text proportionally without breaking layouts
6. THE App SHALL provide contextual tooltips (accessible via a "?" icon) on every screen containing financial or regulatory terms — each tooltip SHALL explain the term in plain language in the borrower's preferred language
7. THE App SHALL use Flutter's Semantics widget on all interactive elements to support screen readers (TalkBack on Android)
8. THE App SHALL display realistic Indian dummy data in all UI previews and empty states: Indian names (e.g., "Priya Sharma"), ₹ amounts (e.g., "₹45,000"), Indian cities (e.g., "Mumbai, Maharashtra"), and realistic loan scenarios
9. WHERE the device is set to dark mode, THE App SHALL apply the following dark mode color tokens: Background #0D1117, Surface/Card #161B22, Primary Text #E6EDF3, Secondary Text #8B949E, Border/Divider #30363D, Primary (Dark) #1A6B9A, Secondary (Dark) #00C47E
10. THE Design_System SHALL define the following semantic color tokens: disabled background #E9ECEF (light) / #21262D (dark); disabled text #6C757D (light) / #484F58 (dark); muted text #6C757D (light) / #8B949E (dark); hover state overlay: primary color at 8% opacity; pressed/ripple state overlay: primary color at 16% opacity (Flutter InkWell ripple); focus ring: 2dp border in Secondary color (#00A86B)
11. THE Design_System SHALL define the following Card component rules: border-radius 16dp, elevation 2dp (light) / 0dp with 1dp border #30363D (dark), background white (light) / #161B22 (dark), padding 16dp on all sides
12. THE Design_System SHALL define the following Primary Button rules: height 52dp, border-radius 12dp, background Secondary (#00A86B), text white 16sp semi-bold, minimum width 120dp; disabled state: background #E9ECEF, text #6C757D
13. THE Design_System SHALL define the following Secondary Button rules: height 52dp, border-radius 12dp, border 1.5dp Secondary color, background transparent, text Secondary color 16sp semi-bold
14. THE Design_System SHALL define the following Input Field rules: height 56dp, border-radius 12dp, border 1dp #DDE1E7 (light) / #30363D (dark); focused border 2dp Secondary (#00A86B); error border 2dp Error Red (#DC3545); disabled background #F8F9FA (light) / #21262D (dark); label 12sp displayed above the field
15. THE Design_System SHALL define the following Bottom Navigation rules: height 64dp, background white (light) / #161B22 (dark), active icon and label in Secondary color, inactive icon and label in muted color (#6C757D), icon size 24dp, label 10sp
16. WHEN content is loading, THE App SHALL display shimmer skeleton loaders matching the shape of the content being loaded — shimmer base color #E9ECEF (light) / #21262D (dark), highlight color #F8F9FA (light) / #30363D (dark), animation duration 1.2 seconds
17. WHEN a screen has no content to display, THE App SHALL display a centered empty state containing: an illustration (maximum 200dp height), a heading in 18sp semi-bold, a supporting message in 14sp regular muted color, and a primary CTA button where applicable
18. WHEN an inline error occurs, THE App SHALL display an error message in Error Red (#DC3545) with a retry icon button — WHEN a full-screen error occurs, THE App SHALL display an illustration, a heading, a message, and a "Try Again" primary button
19. THE App SHALL use a single consistent icon style: outlined icons for navigation and informational states, filled icons for active/selected states — icon size SHALL be 24dp for standard actions and 20dp for inline/compact contexts
20. THE App SHALL use the following icons for key actions: upload (upload_outlined), document (description_outlined), verified (verified_outlined / verified filled when complete), warning (warning_amber_outlined), info (info_outlined), close (close), back (arrow_back_ios)
21. THE App SHALL use illustrations in a flat design style consistent with the Deep Blue / Teal palette — illustrations SHALL NOT contain photographic elements
22. WHILE the device is in dark mode, all text SHALL meet a minimum contrast ratio of 4.5:1 — large text (18sp or larger bold, or 24sp or larger regular) SHALL meet a minimum contrast ratio of 3:1
23. ALL interactive touch targets SHALL have a minimum size of 48dp × 48dp — touch targets smaller than 48dp SHALL be padded to meet this minimum without changing the visual size of the element
24. THE App SHALL cap font scaling at 1.3× the base size to prevent layout overflow — text containers SHALL use flexible layouts (Expanded, Flexible) to accommodate scaled text — THE App SHALL NOT rely on color alone to convey state: every color-coded state (error, success, warning) SHALL also include an icon or text label
25. ALL screen content SHALL use 16dp horizontal padding as the standard page margin — inner card content SHALL use 16dp padding on all sides — all list items SHALL align text baselines consistently with primary text left-aligned and secondary metadata right-aligned or below primary text
26. Gradients SHALL be used only on the splash screen, onboarding hero sections, and the risk score gauge — gradient direction SHALL be top-left to bottom-right at 135°, from Primary (#0A2540) to a 60% lightened variant
27. Glassmorphism SHALL be applied only to floating cards and modal overlays — implementation: background white at 70% opacity (light) / #161B22 at 80% opacity (dark), with a 10dp blur and a 1dp border at 20% white opacity

---

### Requirement 19: Multi-Loan Type Extensibility

**User Story:** As a product manager, I want the app architecture to support adding new loan types without requiring a full rebuild, so that we can expand the product catalog efficiently.

#### Acceptance Criteria

1. THE App SHALL implement the Dynamic_UI system using a data-driven configuration model — each Loan_Type's fields, document requirements, and flow steps SHALL be defined in a configuration structure that can be extended without modifying core application logic
2. WHEN a new Loan_Type configuration is added (e.g., Loan Against Property, Business Loan, Consumer Durable Loan), THE App SHALL render the correct Dynamic_UI for that type without requiring a new app release — configuration updates SHALL be deliverable via a remote configuration mechanism
3. THE App SHALL support the following extensible Loan_Types in its configuration model (in addition to the five primary types): Loan Against Property, Business Loan, and Consumer Durable Loan
4. THE Dynamic_UI configuration for each Loan_Type SHALL define: input field list (field name, type, validation rules, placeholder), document requirement list (document name, format, max size, mandatory/optional), step sequence, and eligibility pre-check parameters

---

### Requirement 20: Application State Persistence and Session Management

**User Story:** As a borrower, I want my application progress to be saved automatically, so that I never lose my work due to an interruption or app closure.

#### Acceptance Criteria

1. THE App SHALL automatically save application progress after every completed step — saved state SHALL persist across app restarts and device reboots
2. WHEN a borrower's session expires due to inactivity (30-minute timeout), THE App SHALL require re-authentication via OTP before resuming — previously entered data SHALL be retained and not cleared on session expiry
3. WHEN a borrower logs out, THE App SHALL retain locally saved application drafts — drafts SHALL be accessible after the borrower logs back in with the same account
4. THE App SHALL support a maximum of one active loan application per borrower at a time — WHEN a borrower attempts to start a new application while one is in progress, THE App SHALL prompt the borrower to either resume the existing application or abandon it before starting a new one
5. WHEN a borrower abandons an in-progress application, THE App SHALL display a confirmation dialog explaining that the application data will be cleared, and require explicit confirmation before proceeding

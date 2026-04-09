# Requirements Document
## AI-Powered Loan Risk Assessment Platform — India

---

## Introduction

India's credit gap is structural. Over 400 million working-age adults — students, gig workers, daily wage earners, and rural households — are effectively invisible to traditional credit systems. They have income, they have financial behavior, but they lack the formal paper trail that legacy scoring models require. The result: deserving borrowers are rejected, lenders miss a massive addressable market, and financial inclusion stalls.

This platform addresses that gap directly. At its core is the Credit_Engine — an AI-powered risk prediction system that ingests both traditional financial data and alternative behavioral signals to compute a calibrated, explainable creditworthiness score for every applicant. The Credit_Engine is the primary decision-making intelligence of the platform: every lender offer, every approval, every rejection, and every actionable feedback message originates from its output. Built on a hybrid architecture combining rule-based eligibility filters with a trained machine learning model, it produces a Risk_Score (0–1000), a Confidence_Interval, and a ranked set of contributing factors — all within a defined latency budget.

The platform wraps this AI core in a mobile-first (Android) centralized loan access experience. A borrower submits a single application; the Credit_Engine evaluates their creditworthiness and the platform shares an anonymized, AI-scored profile with multiple participating lenders (banks and NBFCs). Each lender independently responds with their terms. The borrower reviews available offers in plain language and selects one — only at that point does the selected lender receive full borrower data, gated by explicit consent. It is built for real Indian conditions — low digital literacy, intermittent connectivity, multilingual users, and a regulatory environment governed by RBI guidelines and the Digital Personal Data Protection Act 2023 (DPDPA).

The system integrates natively with India Stack: Account Aggregator (AA) for consented data sharing, DigiLocker for KYC documents, UPI for transaction history, and Aadhaar eKYC for identity verification. Every decision is explainable in plain language, every data access is consent-gated, and every outcome is logged in an immutable audit trail.

**Core value proposition:**
- AI-Powered Risk Prediction: The Credit_Engine produces a calibrated Risk_Score from 20+ behavioral and financial features, enabling accurate credit decisions for borrowers with no formal credit history
- Accuracy: Richer data signals produce better risk estimates than CIBIL score alone
- Inclusion: Users without credit history get a fair evaluation based on real financial behavior
- Choice: A single application surfaces offers from multiple lenders without repeated data sharing
- Explainability: Every decision comes with a plain-language reason and actionable next steps derived from the Credit_Engine's feature outputs
- Trust: Consent-first design, transparent logic, and regulatory compliance at every layer

---

## System Objectives

1. **AI-Powered Risk Prediction** — Deploy the Credit_Engine as the central intelligence of the platform, producing calibrated Risk_Scores from a hybrid ML + rule-based model trained on both traditional and alternative financial data
2. **Financial Inclusion** — Enable credit access for borrowers with no or thin credit history by leveraging alternative data sources as primary inputs to the Credit_Engine
3. **Centralized Credit Access** — Allow a borrower to submit one application and receive AI-scored offers from multiple participating lenders without repeated data sharing or multiple hard enquiries
4. **Risk Accuracy** — Improve default prediction accuracy over traditional credit score-only models through the Credit_Engine's hybrid ML + rule-based scoring architecture
5. **Transparency** — Ensure every Credit_Engine decision is explainable to the borrower in their preferred language, at a level of detail they choose
6. **Trust and Consent** — Give borrowers full visibility and control over their data; no data is used without explicit, informed consent; full lender data access is gated behind borrower selection
7. **Regulatory Compliance** — Operate within RBI fair lending guidelines, AA framework rules, UIDAI tokenization requirements, and DPDPA 2023
8. **Operational Efficiency** — Reduce manual review burden for lenders through Credit_Engine automation while preserving human oversight for borderline cases
9. **Credit Building** — Create a feedback loop where responsible repayment behavior feeds back into the Credit_Engine to improve a borrower's future Risk_Score

---

## Glossary

| Term | Definition |
|---|---|
| Borrower | An individual applying for a loan through the platform |
| Lender | A financial institution (bank, NBFC) that disburses loans and bears credit risk |
| Loan_Officer | A lender-side employee who reviews flagged or borderline applications |
| Regulator | RBI or state-level financial authority with oversight over lending operations |
| Credit_Engine | The central AI component of the platform. Ingests structured feature vectors derived from traditional and alternative data, applies a rule-based eligibility layer followed by a trained ML model, and outputs a Risk_Score (0–1000), Confidence_Interval, feature importance rankings, and a Data_Completeness metric for every application |
| Explainability_Layer | The component that translates Credit_Engine outputs — Risk_Score, feature importances, and Confidence_Interval — into human-readable explanations for borrowers and technical reports for loan officers |
| Consent_Manager | The component that manages borrower data consent in compliance with the AA framework |
| Lender_Integration_Layer | The platform component that distributes anonymized borrower profiles to participating lenders and collects their responses |
| Anonymized_Profile | A borrower profile with all direct identifiers removed, shared with lenders during the offer-collection phase |
| Lender_Offer | A structured response from a participating lender containing: approval/rejection status, offered loan amount, interest rate, tenure options, and processing fee |
| Offer_Selection | The borrower's explicit act of choosing one lender's offer, which triggers full data sharing consent for that lender only |
| AA_Framework | Account Aggregator framework — RBI-regulated data-sharing infrastructure |
| DigiLocker | Government digital document repository for KYC documents |
| Risk_Score | A numerical representation of a borrower's creditworthiness (0–1000), produced by the Credit_Engine's ML model. Higher scores indicate lower predicted default probability. The score is calibrated so that a 100-point band corresponds to a meaningful difference in expected default rate |
| Alternative_Data | Non-traditional data signals (UPI transaction history, utility payments, mobile usage patterns) used as primary features by the Credit_Engine for borrowers with no formal credit history |
| Feature_Vector | The structured numerical representation of a borrower's data after extraction and normalization — the direct input to the Credit_Engine's ML model |
| Feature_Importance | A ranked list of the data signals that contributed most to a specific Risk_Score, produced by the Credit_Engine using SHAP (SHapley Additive exPlanations) values |
| Model_Registry | A versioned record of every Credit_Engine model deployed to production, including training data summary, feature list, exclusion list, and performance metrics |
| Probability_of_Default | The Credit_Engine's internal continuous output (0.0–1.0) representing the predicted likelihood of loan default — mapped to the 0–1000 Risk_Score scale before exposure to any external component |
| Audit_Log | An immutable, timestamped record of all system decisions and data access events |
| Onboarding_Flow | The sequence of steps a borrower completes to register and verify identity |
| Decision_Report | A structured document explaining the outcome of a loan application |
| FI | Financial Information — structured financial data shared via the AA framework |
| Confidence_Interval | A range indicating the reliability of a Risk_Score given available data completeness |
| Data_Completeness | A percentage metric indicating how much of the expected data set was available for scoring |
| DPDPA | Digital Personal Data Protection Act 2023 — India's primary data protection legislation |
| Verification_Workflow | The lender-side process executed after Offer_Selection, covering KYC, address, employment, financial, and fraud checks before final underwriting |
| DTI | Debt-to-Income ratio — total monthly debt obligations divided by gross monthly income; a key underwriting metric |
| AML | Anti-Money Laundering — regulatory checks to detect and prevent financial crime, required under PMLA 2002 |
| eSign | Aadhaar-based electronic signature — legally valid under the IT Act 2000 and used for loan agreement execution |
| Loan_Agreement | The legally binding contract between borrower and lender, executed via eSign before disbursement |
| Application_Status | The current lifecycle stage of a loan application, tracked and displayed to the borrower in real time |
| Underwriting_Decision | The lender's final credit decision made after completing the full Verification_Workflow on the borrower's data |
| Physical_Verification | An optional lender-initiated field visit to verify borrower address or business premises, applicable for loans above a lender-configured threshold |

---

## Stakeholder Summary

| Stakeholder | Role | Key Needs |
|---|---|---|
| Borrower | Applies for a loan; primary end user of the mobile app | Simple onboarding, fair evaluation, clear decision explanation, choice of lender, data privacy control |
| Lender (Bank/NBFC) | Participates in the platform; receives anonymized profiles; disburses loans to selected borrowers | Accurate risk scores, qualified lead flow, portfolio visibility, regulatory compliance, low operational overhead |
| Loan_Officer | Reviews borderline applications on the lender dashboard | Clear technical reports, efficient review workflow, override capability with audit trail |
| Regulator (RBI) | Oversees lending operations and data protection compliance | Auditability, fair lending evidence, model transparency, DPDPA compliance |
| Account Aggregator | Facilitates consented financial data sharing between FIPs and FIUs | Correct consent artifact format, reliable API integration, data minimization |
| Data Providers (FIPs) | Banks, utility companies, telecom providers sharing data via AA | Secure API calls, consent verification before data release |
| System Operator | Maintains platform infrastructure and monitors reliability | Uptime SLAs, scalability, security incident response, deployment controls |

---

## Requirements

### Requirement 1: Borrower Onboarding and Identity Verification

**User Story:** As a borrower with limited formal financial history, I want to register and verify my identity using government-issued documents, so that I can access loan products without needing a traditional credit score.

**Design Intent:** Onboarding is the first trust moment. It must be fast, reassuring, and require minimal effort from the user. Auto-fill from DigiLocker reduces friction. Plain-language data summaries build confidence before any permissions are requested.

#### Acceptance Criteria

1. WHEN a borrower downloads the app and opens it for the first time, THE Onboarding_Flow SHALL present a language selection screen supporting Hindi, English, Tamil, Telugu, Kannada, Bengali, Marathi, and Gujarati
2. WHEN a borrower selects their preferred language, THE Onboarding_Flow SHALL render all subsequent screens — including error messages, tooltips, and notifications — in that language
3. WHEN a borrower initiates identity verification, THE Onboarding_Flow SHALL offer Aadhaar eKYC via OTP as the primary verification method
4. WHEN Aadhaar eKYC is completed successfully, THE Onboarding_Flow SHALL retrieve and pre-fill name, date of birth, and address from DigiLocker — the borrower SHALL be able to review and confirm pre-filled data before proceeding
5. IF Aadhaar eKYC fails or is unavailable, THEN THE Onboarding_Flow SHALL offer PAN card + selfie liveness check as a fallback, with a clear explanation of why the primary method failed
6. WHEN a borrower completes identity verification, THE Onboarding_Flow SHALL create a verified borrower profile within 60 seconds
7. THE Onboarding_Flow SHALL NOT store raw Aadhaar numbers — only a tokenized reference compliant with UIDAI guidelines
8. WHEN a borrower completes identity verification, THE Onboarding_Flow SHALL present a plain-language summary of what data will be collected, why it is needed, and how it will be used — before requesting any data permissions
9. THE Onboarding_Flow SHALL include contextual tooltips (accessible via a "?" icon) on every screen explaining unfamiliar terms in simple language
10. WHEN a borrower abandons onboarding mid-flow, THE Onboarding_Flow SHALL save progress and allow resumption from the same step on next app open, without requiring re-verification

---

### Requirement 2: Data Consent and Permissions Management

**User Story:** As a borrower, I want full control over what data I share with lenders, so that I can trust the platform and make informed decisions about my privacy.

**Design Intent:** Consent is not a checkbox — it is an ongoing relationship. The Consent_Manager must make consent legible, revocable, and auditable. Borrowers who share less data should not be penalized; the system adapts to available signals.

#### Acceptance Criteria

1. WHEN a borrower is asked to share financial data, THE Consent_Manager SHALL present a consent screen listing each data category (bank statements, UPI history, utility bills, mobile usage) with a plain-language description of its purpose and the benefit to the borrower
2. WHEN a borrower grants consent for a data category, THE Consent_Manager SHALL record a consent artifact containing: borrower ID (tokenized), data category, purpose, timestamp, consent expiry date, and AA framework consent artifact ID
3. WHEN a borrower revokes consent for a data category, THE Consent_Manager SHALL stop all future data collection for that category within 24 hours, delete any cached data for that category, and notify the borrower with a confirmation
4. THE Consent_Manager SHALL provide a dedicated consent dashboard where borrowers can view all active consents, their expiry dates, and the data categories covered
5. WHEN a consent is within 7 days of expiry, THE Consent_Manager SHALL notify the borrower via push notification and in-app alert, and request renewal with a single-tap action
6. IF a borrower declines to share a data category, THEN THE Credit_Engine SHALL proceed with available data and adjust confidence levels accordingly — the application SHALL NOT be automatically rejected solely because optional data categories were withheld
7. THE Consent_Manager SHALL comply with the AA framework's consent artifact format as specified by Sahamati, including purpose codes, data life, and fetch type
8. WHEN financial data is fetched via the AA framework, THE Consent_Manager SHALL display a real-time status indicator showing which FI is being queried and the fetch status
9. THE Consent_Manager SHALL maintain a complete consent audit trail — every grant, renewal, and revocation event SHALL be logged with timestamp and borrower action type
10. WHEN a borrower requests a summary of all data ever collected about them, THE Consent_Manager SHALL generate and display a data usage report within 48 hours, in compliance with DPDPA Section 11

---

### Requirement 3: Loan Application Submission

**User Story:** As a borrower, I want to apply for a loan through a simple mobile interface, so that I can complete the process without needing financial literacy or visiting a branch.

**Design Intent:** The application flow must minimize cognitive load. Visual selectors replace text inputs wherever possible. Estimated costs are shown in real time. Offline resilience ensures rural users with intermittent connectivity are not disadvantaged.

#### Acceptance Criteria

1. WHEN a verified borrower initiates a loan application, THE Loan_Application_Flow SHALL present loan amount selection using a visual slider with pre-set anchor amounts (₹5,000 / ₹10,000 / ₹25,000 / ₹50,000 / ₹1,00,000) and allow custom amounts within lender-configured limits
2. WHEN a borrower selects a loan amount, THE Loan_Application_Flow SHALL display an estimated EMI, indicative interest rate range, and available tenure options in plain language — updated in real time as the borrower adjusts the slider
3. WHEN a borrower submits an application, THE Loan_Application_Flow SHALL validate all mandatory fields and surface inline validation errors in plain language before allowing submission
4. WHEN a borrower submits an application, THE Credit_Engine SHALL acknowledge receipt within 5 seconds and provide a reference number the borrower can use to track status
5. THE Loan_Application_Flow SHALL support offline form-filling — all fields SHALL be saveable locally, with automatic submission triggered when connectivity is restored
6. WHEN a borrower is in a low-connectivity area, THE Loan_Application_Flow SHALL display a connectivity indicator and queue the submission with a visible status message
7. WHEN a borrower has a partially completed application, THE Loan_Application_Flow SHALL save progress automatically after each step and allow resumption from the same step on next session
8. THE Loan_Application_Flow SHALL auto-populate fields from the verified borrower profile (name, address, income category) to minimize manual data entry
9. WHEN a borrower is applying for the first time, THE Loan_Application_Flow SHALL display a progress indicator showing how many steps remain and estimated time to complete

---

### Requirement 4: Alternative Data Collection and Processing

**User Story:** As a borrower without a formal credit history, I want the system to consider my financial behavior from everyday transactions, so that I have a fair chance of getting a loan.

**Design Intent:** Alternative data is the core differentiator. The system must extract meaningful signals from behavioral data while strictly avoiding proxies for protected characteristics. Missing data is handled gracefully — absence of data is not treated as negative evidence.

#### Acceptance Criteria

1. WHEN a borrower grants UPI transaction consent, THE Credit_Engine SHALL fetch up to 12 months of UPI transaction history via the AA framework and extract: income regularity score, spending pattern stability, merchant category distribution, and average monthly net flow
2. WHEN a borrower grants bank statement consent, THE Credit_Engine SHALL parse bank statements to extract: salary or business credit regularity, recurring payment obligations, average monthly balance, and balance volatility
3. WHEN a borrower grants utility bill consent, THE Credit_Engine SHALL retrieve electricity, water, and mobile bill payment history and compute an on-time payment ratio and payment consistency score
4. THE Credit_Engine SHALL normalize all alternative data signals to a common feature space before scoring, using documented normalization rules versioned in the model registry
5. WHEN alternative data is missing for a category, THE Credit_Engine SHALL assign a neutral weight to that category rather than penalizing the borrower — the Data_Completeness metric SHALL reflect the missing category
6. THE Credit_Engine SHALL NOT use data signals that are proxies for protected characteristics (religion, caste, gender, region of origin, mother tongue) as defined by RBI fair lending guidelines — a documented exclusion list SHALL be maintained and reviewed quarterly
7. WHEN processing alternative data, THE Credit_Engine SHALL complete feature extraction within 30 seconds of data receipt
8. THE Credit_Engine SHALL log which data sources contributed to each Risk_Score, enabling post-hoc auditability of the feature inputs used for any given decision
9. WHEN new consented data is provided by a borrower within 48 hours of initial scoring, THE Credit_Engine SHALL trigger a re-evaluation and update the Risk_Score accordingly

---

### Requirement 5: Risk Scoring and Credit Decision

**User Story:** As a lender, I want an accurate and auditable risk score for each applicant, so that I can make informed lending decisions while managing portfolio risk.

**Design Intent:** The Credit_Engine is the primary intelligence of the platform. Its architecture is deliberately hybrid: a deterministic rule-based layer enforces hard eligibility constraints that no ML model should override (age, income floor, blacklist status), while a trained gradient-boosted ML model handles the nuanced, non-linear risk estimation that traditional scorecards cannot capture. The ML model ingests a Feature_Vector of 20+ normalized signals spanning income behavior, payment history, spending patterns, and balance stability. It outputs a Probability_of_Default that is calibrated against historical default rates and mapped to the 0–1000 Risk_Score scale. Uncertainty is quantified via a Confidence_Interval derived from the model's prediction variance — not hidden. Human review is preserved for borderline cases and low-completeness applications. Every model version is tracked, every deployment is gated by shadow-testing, and every scoring decision is fully reproducible from the Audit_Log.

#### Acceptance Criteria

1. WHEN all consented data is collected, THE Credit_Engine SHALL produce a Risk_Score between 0 and 1000 within 120 seconds
2. THE Credit_Engine SHALL use a hybrid scoring architecture with two sequential layers: (a) a rule-based eligibility layer that applies hard filters (minimum age 18, income floor ≥ ₹5,000/month, active blacklist/fraud registry check) — applications failing any hard filter are rejected immediately without ML scoring; (b) a gradient-boosted ML model (e.g., XGBoost or LightGBM) that ingests the Feature_Vector of eligible applicants and outputs a Probability_of_Default
3. THE Credit_Engine's Feature_Vector SHALL include at minimum the following feature categories: (a) income signals — average monthly credit, income regularity score, income source diversity; (b) payment behavior — on-time payment ratio across utility bills and loan obligations, days-past-due history; (c) spending patterns — merchant category distribution, discretionary vs. essential spend ratio, spending volatility; (d) balance and liquidity — average end-of-month balance, minimum balance frequency, balance trend over 6 months; (e) debt obligations — identified recurring EMI payments, estimated DTI from bank statement debits
4. THE Credit_Engine SHALL map the ML model's Probability_of_Default output to the 0–1000 Risk_Score scale using a monotonic calibration function — the mapping SHALL be documented in the Model_Registry and consistent across model versions
5. WHEN the Risk_Score falls above the lender-configured approval threshold, THE Credit_Engine SHALL generate an approval decision with recommended loan amount and terms
6. WHEN the Risk_Score falls below the lender-configured rejection threshold, THE Credit_Engine SHALL generate a rejection decision with top contributing factors
7. WHEN the Risk_Score falls between the approval and rejection thresholds, THE Credit_Engine SHALL flag the application for Loan_Officer review with a summary of borderline factors
8. THE Credit_Engine SHALL attach a Confidence_Interval to every Risk_Score, expressed as a range (e.g., 620–680), derived from the model's prediction variance — wider intervals indicate lower data completeness or higher feature uncertainty
9. THE Credit_Engine SHALL compute Feature_Importance values for every scored application using SHAP (SHapley Additive exPlanations) — the top 5 contributing features SHALL be ranked and passed to the Explainability_Layer for decision communication
10. WHEN Data_Completeness is below 40%, THE Credit_Engine SHALL escalate the application to Loan_Officer review regardless of score, and surface the low completeness as the primary flag
11. THE Credit_Engine SHALL re-score an application if new consented data is provided within 48 hours of initial scoring, and notify the borrower of the updated outcome
12. THE Credit_Engine SHALL maintain a Model_Registry tracking: model version, training date, training dataset size and date range, feature list, exclusion list, and performance metrics (AUC-ROC, KS statistic, Gini coefficient, precision, recall at lender-configured thresholds) for every deployed model
13. WHEN a model is updated or replaced, THE Credit_Engine SHALL complete a shadow-testing period of at least 7 days — running the new model in parallel with the current model on live applications without affecting decisions — before production deployment; shadow-test results SHALL be logged in the Model_Registry
14. THE Credit_Engine SHALL be designed for model-agnosticism — the ML model component SHALL be replaceable (e.g., swapping XGBoost for a neural network) without changes to the feature extraction pipeline, scoring API contract, or Explainability_Layer interface
15. THE Credit_Engine SHALL expose a versioned internal scoring API with a defined request schema (Feature_Vector + application metadata) and response schema (Risk_Score, Confidence_Interval, Feature_Importance rankings, Data_Completeness, model version) — all downstream components (Explainability_Layer, Lender_Integration_Layer, Audit_Log) SHALL consume this API exclusively

---

### Requirement 6: Decision Explainability and Communication

**User Story:** As a borrower, I want to understand why my loan was approved or rejected in simple language, so that I can trust the system and know what to do next.

**Design Intent:** Explainability is not a compliance checkbox — it is a product feature. A borrower who understands their rejection is more likely to return, improve, and reapply. The system must communicate at two levels: simple summaries for borrowers, detailed technical reports for loan officers.

#### Acceptance Criteria

1. WHEN a loan decision is made, THE Explainability_Layer SHALL generate a Decision_Report within 10 seconds of the Credit_Engine producing a score
2. WHEN a loan is approved, THE Explainability_Layer SHALL communicate the approval with: loan amount, interest rate, tenure options, EMI amount, and total repayment cost — in the borrower's preferred language
3. WHEN a loan is rejected, THE Explainability_Layer SHALL provide the top 3 factors that contributed to the rejection in plain, non-technical language (e.g., "Your income appears irregular over the last 3 months" rather than "low income stability feature weight")
4. WHEN a loan is rejected, THE Explainability_Layer SHALL provide at least 2 specific, actionable steps the borrower can take to improve their chances in a future application (e.g., "Make your next 3 utility bill payments on time and reapply")
5. THE Explainability_Layer SHALL NOT use technical terms such as "model score", "feature weight", "probability of default", or "confidence interval" in borrower-facing communications
6. WHEN a borrower requests more detail about a decision, THE Explainability_Layer SHALL provide a factor breakdown showing the relative contribution of each data category (income, payment history, spending behavior) using a visual bar chart in the borrower's preferred language
7. WHEN a Loan_Officer reviews a flagged application, THE Explainability_Layer SHALL present a detailed technical report including: feature importances, Confidence_Interval, Data_Completeness percentage, data sources used, and model version
8. THE Explainability_Layer SHALL support two explanation modes: "Simple" (default for borrowers — plain language summary) and "Detailed" (opt-in — factor breakdown with visual chart)
9. WHEN a borrower's application status changes (submitted → under review → decided), THE Explainability_Layer SHALL send a push notification and in-app status update at each transition

---

### Requirement 7: Post-Loan Tracking and Repayment

**User Story:** As a borrower, I want to track my loan repayment schedule and receive timely reminders, so that I can stay on top of my payments and build my credit profile.

**Design Intent:** Post-disbursement engagement is critical for repayment rates and credit building. Reminders must be timely but not intrusive. The credit-building progress indicator creates a positive feedback loop that motivates on-time payments.

#### Acceptance Criteria

1. WHEN a loan is disbursed, THE Loan_Tracking_Module SHALL display a repayment schedule showing: all EMI dates, amounts, outstanding balance, and total interest paid to date
2. WHEN an EMI due date is 5 days away, THE Loan_Tracking_Module SHALL send a push notification and SMS reminder to the borrower
3. WHEN an EMI due date is 1 day away and the EMI has not been paid, THE Loan_Tracking_Module SHALL send a final reminder push notification
4. WHEN an EMI is paid, THE Loan_Tracking_Module SHALL update the outstanding balance and mark the payment as complete within 2 hours of payment confirmation
5. WHEN a borrower misses an EMI, THE Loan_Tracking_Module SHALL notify the borrower within 24 hours, display the overdue amount with applicable late fees, and provide a one-tap payment option
6. THE Loan_Tracking_Module SHALL display a credit-building progress indicator showing how on-time payments improve the borrower's Risk_Score over time, with a projected score after the next 3 on-time payments
7. WHEN a borrower completes full loan repayment, THE Loan_Tracking_Module SHALL generate a loan closure certificate (downloadable PDF) and update the borrower's profile with the completed loan record
8. THE Loan_Tracking_Module SHALL allow borrowers to view their full repayment history, including payment dates, amounts, and any late fees charged

---

### Requirement 8: Lender Dashboard and Portfolio Management

**User Story:** As a lender, I want a dashboard to monitor loan applications, portfolio performance, and risk exposure, so that I can manage my lending operations efficiently.

**Design Intent:** The lender dashboard is an operational tool, not just a reporting interface. Loan officers need fast access to decision context. Portfolio managers need trend visibility. Both need confidence that the system's decisions are defensible.

#### Acceptance Criteria

1. WHEN a Loan_Officer logs into the lender dashboard, THE Lender_Dashboard SHALL display all pending applications requiring manual review, sorted by submission time, with a summary card showing Risk_Score range, Data_Completeness, and flagging reason
2. WHEN a Loan_Officer selects an application, THE Lender_Dashboard SHALL display the full Decision_Report including: Risk_Score, Confidence_Interval, Data_Completeness, factor breakdown, data sources used, and model version
3. WHEN a Loan_Officer approves or rejects a manually reviewed application, THE Lender_Dashboard SHALL record the decision with: officer ID, timestamp, decision outcome, and optional free-text notes — this record SHALL be immutable after submission
4. THE Lender_Dashboard SHALL display portfolio-level metrics updated daily: approval rate, rejection rate, manual review rate, disbursement volume, average Risk_Score, and 30/60/90-day default rates
5. WHEN portfolio default rate exceeds a lender-configured threshold, THE Lender_Dashboard SHALL trigger an alert to the lender's risk management team via email and in-dashboard notification
6. THE Lender_Dashboard SHALL allow lenders to configure approval and rejection score thresholds within RBI-permitted ranges, with changes logged in the audit trail
7. THE Lender_Dashboard SHALL provide a Fair Lending view showing approval rates segmented by income band, geography, and occupation type — enabling lenders to self-monitor for disparate impact

---

### Requirement 9: Audit, Compliance, and Data Governance

**User Story:** As a regulator, I want all lending decisions to be auditable and compliant with RBI guidelines, so that I can ensure fair lending practices and data protection.

**Design Intent:** Compliance is not bolted on — it is structural. Every decision event is logged at creation and cannot be altered. Data governance is enforced at the system level, not left to operational discipline.

#### Acceptance Criteria

1. THE Audit_Log SHALL record every loan decision event with: borrower ID (tokenized), lender ID, Risk_Score, Confidence_Interval, decision outcome, timestamp, data sources used, Data_Completeness percentage, and model version
2. WHEN a decision is recorded in the Audit_Log, THE record SHALL be immutable — no modification or deletion shall be permitted after creation; any attempted modification SHALL trigger a security alert
3. THE Audit_Log SHALL be queryable by regulators with appropriate access credentials, with a retention period of 7 years per RBI data retention guidelines
4. THE Credit_Engine SHALL maintain a model registry tracking: model version, training date, training data summary, feature list, exclusion list, and performance metrics for every deployed model
5. WHEN a model is updated or replaced, THE Credit_Engine SHALL log the change in the model registry with a justification, approval record, and shadow-testing results
6. THE system SHALL comply with DPDPA 2023 — all personal data processing SHALL have a documented lawful basis, and a Data Processing Register SHALL be maintained
7. WHEN a borrower requests data deletion under DPDPA Section 12, THE Consent_Manager SHALL initiate deletion of all personal data within 30 days, except data required for regulatory retention under RBI guidelines
8. THE system SHALL generate a monthly Fair Lending Report showing approval rates segmented by income band, geography, and occupation type — to detect and flag statistically significant disparate impact
9. THE system SHALL conduct and document a Data Protection Impact Assessment (DPIA) before any new data source or processing activity is introduced
10. WHEN a consent artifact is used to fetch data, THE Audit_Log SHALL record the AA framework consent artifact ID, the FIP queried, the data categories fetched, and the fetch timestamp — creating an end-to-end data lineage record
11. THE Audit_Log SHALL record every step of the Verification_Workflow (KYC validation, address verification, employment verification, financial verification, fraud and AML checks, underwriting decision, eSign execution, and disbursement) — each event SHALL include: borrower ID (tokenized), lender ID, verification type, outcome, officer ID (where applicable), and timestamp
12. WHEN a lender issues an Underwriting_Decision (approval or rejection) after completing the Verification_Workflow, THE Audit_Log SHALL record the decision with: lender ID, officer ID, decision outcome, reason code, and timestamp — this record SHALL be immutable and queryable by regulators under the same 7-year retention policy

---

### Requirement 10: System Reliability and Performance

**User Story:** As a system operator, I want the platform to be reliable, scalable, and performant under peak load, so that borrowers and lenders experience consistent service quality.

**Design Intent:** Reliability is a trust signal. A borrower who submits an application and gets no response loses confidence in the system. SLAs must be defined, monitored, and enforced — not aspirational.

#### Acceptance Criteria

1. THE system SHALL maintain 99.5% uptime measured monthly, excluding scheduled maintenance windows communicated at least 48 hours in advance
2. WHEN loan application volume exceeds baseline by 3x, THE system SHALL scale horizontally to maintain response time SLAs without manual intervention
3. THE Credit_Engine SHALL process a loan application end-to-end (data fetch → scoring → decision → explainability) within 3 minutes under normal load
4. WHEN the Credit_Engine is unavailable, THE system SHALL queue incoming applications and process them within 1 hour of service restoration, notifying borrowers of the delay
5. THE system SHALL encrypt all data in transit using TLS 1.3 and all data at rest using AES-256
6. WHEN a security incident is detected, THE system SHALL alert the security operations team within 5 minutes and isolate affected components within 15 minutes
7. THE system SHALL perform automated daily backups of all application data, consent records, and audit logs — with a recovery time objective (RTO) of 4 hours and recovery point objective (RPO) of 24 hours
8. THE system SHALL expose a health check endpoint for each major component (Credit_Engine, Consent_Manager, Explainability_Layer, Audit_Log) that returns current status, latency, and error rate — queryable by the operations team

---

### Requirement 11: Multi-Lender Integration and Borrower Selection

**User Story:** As a borrower, I want to submit one loan application and receive offers from multiple lenders, so that I can choose the option that best suits my needs without sharing my personal data with every lender upfront.

**Design Intent:** The platform acts as a neutral intermediary. After the Credit_Engine scores a borrower, an anonymized profile is distributed to participating lenders. Each lender evaluates the profile against their own criteria and responds with an offer or a decline. The borrower sees available offers in a simple, card-based format — lender name, amount, rate, EMI, tenure — and selects one. Only after selection does the Consent_Manager release full borrower data to the chosen lender, under a new explicit consent artifact. This design protects borrower privacy, prevents unsolicited contact from non-selected lenders, and avoids the multiple hard-enquiry problem that damages credit scores in traditional multi-lender applications.

#### Acceptance Criteria

1. WHEN the Credit_Engine produces a Risk_Score for a borrower application, THE Lender_Integration_Layer SHALL distribute an Anonymized_Profile to all participating lenders whose configured eligibility criteria (minimum score, loan amount range, borrower segment) match the application — within 60 seconds of scoring completion

2. THE Anonymized_Profile shared with lenders SHALL contain: Risk_Score, Confidence_Interval, Data_Completeness percentage, requested loan amount, tenure preference, income band, and occupation category — it SHALL NOT contain: name, Aadhaar token, PAN, address, phone number, or any direct identifier

3. WHEN a participating lender receives an Anonymized_Profile, THE Lender_Integration_Layer SHALL provide a structured response API through which the lender can submit a Lender_Offer containing: lender ID, offered loan amount, interest rate (flat or reducing), tenure options, processing fee, and offer validity period — within 2 hours of profile receipt

4. IF a lender declines to make an offer, THE Lender_Integration_Layer SHALL record the decline with lender ID and timestamp — the borrower SHALL NOT be shown the identity of lenders who declined

5. WHEN at least one Lender_Offer is received, THE Borrower_App SHALL display available offers as simple cards showing: lender name, offered amount, monthly EMI, interest rate, tenure, and total repayment cost — in the borrower's preferred language

6. THE Borrower_App SHALL display offers in a neutral order (e.g., sorted by EMI amount ascending) — the platform SHALL NOT rank, promote, or visually differentiate lenders based on commercial arrangements

7. WHEN a borrower selects a Lender_Offer, THE Consent_Manager SHALL present a new, explicit consent screen clearly stating: which lender will receive full borrower data, what data categories will be shared, and the purpose — the borrower must actively confirm before data transfer proceeds

8. WHEN a borrower confirms Offer_Selection consent, THE Consent_Manager SHALL create a new consent artifact scoped to the selected lender only, and THE Lender_Integration_Layer SHALL transmit the full verified borrower profile (including KYC documents, financial data, and Decision_Report) to that lender via a secure, authenticated API call

9. WHEN a borrower confirms Offer_Selection, THE Lender_Integration_Layer SHALL notify all non-selected lenders that the application has been closed — non-selected lenders SHALL NOT receive any additional borrower data beyond the Anonymized_Profile already shared

10. WHEN no Lender_Offer is received within 4 hours of profile distribution, THE Borrower_App SHALL notify the borrower that no offers are currently available, provide the top 2 actionable improvement steps from the Explainability_Layer, and offer the option to reapply after 30 days

11. WHEN a Lender_Offer expires before the borrower selects it, THE Borrower_App SHALL remove the expired offer from the display and notify the borrower — if no valid offers remain, the system SHALL follow the no-offer notification flow defined in criterion 10

12. THE Audit_Log SHALL record every profile distribution event, lender response (offer or decline), borrower selection, and full data transfer — each event SHALL include: borrower ID (tokenized), lender ID, timestamp, and action type — creating a complete chain of custody for every data sharing event

13. THE Lender_Integration_Layer SHALL enforce that a lender's access to the Anonymized_Profile is read-only and time-limited to the offer validity period — after expiry or application closure, the lender's access SHALL be revoked and the profile purged from lender-side caches per the consent artifact terms

14. WHEN a lender is onboarded to the platform, THE Lender_Integration_Layer SHALL require the lender to register their eligibility criteria, API endpoint, and data handling agreement — lenders who fail to respond within the SLA window on more than 20% of distributed profiles in a rolling 30-day period SHALL be flagged for review by the System Operator

---

### Requirement 12: End-to-End Loan Processing and Verification Workflow

**User Story:** As a borrower who has selected a lender, I want the lender to complete all necessary verifications and communicate a final decision clearly, so that I know exactly where my application stands and what to expect at each step.

**Design Intent:** Offer_Selection is not loan approval — it is the start of the lender's formal processing pipeline. Real banks and NBFCs are required by RBI to complete KYC, address verification, employment or business verification, financial due diligence, fraud and AML screening, and credit underwriting before sanctioning a loan. This requirement formalizes that pipeline within the platform. The lender retains full authority to approve or reject after completing verification — even if they issued a preliminary offer. The borrower is kept informed at every stage through Application_Status updates. The platform facilitates data flow and status communication; the lender owns the underwriting decision.

#### Acceptance Criteria

**KYC Validation**

1. WHEN a lender receives the full borrower profile after Offer_Selection, THE Lender_Dashboard SHALL trigger a KYC validation step that cross-checks: PAN against the Income Tax database, Aadhaar token against UIDAI records, and name/date-of-birth consistency across documents
2. WHEN KYC validation is complete, THE Lender_Dashboard SHALL update the Application_Status to "KYC Verified" and notify the borrower via push notification and in-app status update
3. IF KYC validation fails due to a document mismatch or database discrepancy, THE Lender_Dashboard SHALL flag the application for Loan_Officer review, update the Application_Status to "KYC Review Required", and notify the borrower that additional verification is needed — the borrower SHALL be given the opportunity to upload a corrected document before the application is rejected

**Address Verification**

4. WHEN KYC validation passes, THE Lender_Dashboard SHALL initiate address verification using the following methods in order: (a) document-based — cross-check address on Aadhaar / utility bill / rental agreement; (b) digital — OTP sent to the registered mobile number linked to the address; (c) geolocation — optional, borrower-consented location check via the Borrower_App
5. FOR loans above a lender-configured threshold (default: ₹50,000), THE Lender_Dashboard SHALL allow the lender to initiate Physical_Verification — a field agent visit to the borrower's address — and record the outcome (verified / not verified / address mismatch) with agent ID and timestamp
6. WHEN address verification is complete, THE Lender_Dashboard SHALL update the Application_Status to "Address Verified" and log the verification method used in the Audit_Log

**Employment and Business Verification**

7. WHEN the borrower's occupation category is "salaried", THE Lender_Dashboard SHALL verify employment by one or more of: employer confirmation via official email domain, salary slip cross-check against bank statement credits, or EPFO employment record lookup — the verification method used SHALL be logged
8. WHEN the borrower's occupation category is "self-employed" or "business owner", THE Lender_Dashboard SHALL verify business existence by one or more of: GST registration lookup, Udyam (MSME) registration check, or ITR filing confirmation — the verification method used SHALL be logged
9. WHEN the borrower's occupation category is "gig worker" or "informal income", THE Lender_Dashboard SHALL accept platform-level income evidence (UPI transaction history, AA-fetched bank credits) as the primary employment verification signal, with a Loan_Officer review flag for manual confirmation
10. WHEN employment or business verification is complete, THE Lender_Dashboard SHALL update the Application_Status to "Employment Verified" and log the outcome in the Audit_Log

**Financial Verification**

11. WHEN employment verification passes, THE Lender_Dashboard SHALL perform financial verification by: (a) validating declared income against AA-fetched bank statement credits over the last 6 months; (b) computing the borrower's DTI ratio using all identified recurring obligations; (c) confirming average monthly balance is sufficient to service the requested EMI
12. WHEN the computed DTI ratio exceeds the lender's configured maximum (typically 50% per RBI guidelines), THE Lender_Dashboard SHALL flag the application for Loan_Officer review with the DTI value and a breakdown of identified obligations — the Loan_Officer MAY approve with a reduced loan amount or reject
13. WHEN financial verification is complete, THE Lender_Dashboard SHALL update the Application_Status to "Financial Verification Complete" and log the DTI value, income validation outcome, and balance adequacy result in the Audit_Log

**Fraud and AML Checks**

14. WHEN financial verification passes, THE Lender_Dashboard SHALL run automated fraud and AML checks including: (a) name and PAN screening against RBI defaulter lists and CIBIL fraud registry; (b) transaction pattern analysis for structuring, layering, or unusual cash activity; (c) negative news screening via integrated third-party API
15. IF any fraud or AML flag is raised, THE Lender_Dashboard SHALL immediately escalate the application to the lender's compliance team, freeze further processing, and update the Application_Status to "Compliance Review" — the borrower SHALL be notified that their application is under review without disclosing the specific flag
16. WHEN fraud and AML checks pass with no flags, THE Lender_Dashboard SHALL log the check outcome and proceed to underwriting — the Audit_Log SHALL record the check type, result, and timestamp for each check performed

**Credit Underwriting**

17. WHEN all verification steps are complete, THE Lender_Dashboard SHALL present the Loan_Officer with a consolidated underwriting summary containing: Risk_Score, Confidence_Interval, DTI ratio, income validation result, address verification method, employment verification result, fraud check outcome, and the original Decision_Report from the Credit_Engine
18. THE Loan_Officer SHALL have the authority to issue an Underwriting_Decision of: (a) Approved — with final sanctioned amount, interest rate, and tenure; (b) Approved with Conditions — reduced amount or modified terms; (c) Rejected — with a mandatory reason code selected from a lender-defined list
19. WHEN a lender issues a rejection Underwriting_Decision after Offer_Selection, THE platform SHALL accept this as a valid outcome — the borrower SHALL be notified of the rejection with a plain-language reason (e.g., "The lender was unable to verify your income details") and offered the option to reapply with a different lender if other offers are still valid
20. WHEN an Underwriting_Decision is recorded, THE Lender_Dashboard SHALL update the Application_Status to "Approved" or "Rejected" and log the decision with officer ID, reason code, and timestamp in the Audit_Log

**Loan Agreement and eSign**

21. WHEN the Underwriting_Decision is "Approved" or "Approved with Conditions", THE Lender_Dashboard SHALL generate a Loan_Agreement document containing: sanctioned amount, interest rate (flat or reducing), tenure, EMI schedule, processing fee, prepayment terms, and default consequences — in the borrower's preferred language
22. WHEN the Loan_Agreement is ready, THE Borrower_App SHALL present the document for review with a plain-language summary of key terms — the borrower SHALL be given at least 24 hours to review before being prompted to sign
23. WHEN the borrower is ready to sign, THE Borrower_App SHALL initiate Aadhaar-based eSign via an OTP sent to the borrower's registered mobile number — the signed agreement SHALL be stored as a tamper-evident PDF and linked to the application record in the Audit_Log
24. IF the borrower declines to sign the Loan_Agreement within 7 days of generation, THE platform SHALL mark the application as "Agreement Expired", notify the lender, and close the application — the borrower MAY reapply

**Bank Account Validation and Disbursement**

25. WHEN the Loan_Agreement is signed, THE Lender_Dashboard SHALL validate the borrower's disbursement bank account by initiating a penny-drop verification (₹1 credit + name match) to the account number provided — the validation result SHALL be logged in the Audit_Log
26. IF penny-drop validation fails, THE Lender_Dashboard SHALL notify the borrower to provide a corrected bank account number and allow up to 3 re-attempts before escalating to Loan_Officer review
27. WHEN bank account validation passes, THE Lender_Dashboard SHALL initiate loan disbursement via NEFT/IMPS/UPI within 1 business day of successful validation — the disbursement transaction reference SHALL be logged in the Audit_Log and displayed to the borrower in the Borrower_App
28. WHEN disbursement is confirmed, THE Borrower_App SHALL update the Application_Status to "Disbursed", display the disbursed amount and value date, and transition the borrower to the Loan_Tracking_Module (Requirement 7)

**Application Status Lifecycle**

29. THE platform SHALL maintain and display the following Application_Status transitions to the borrower in real time via the Borrower_App:
    - Submitted → KYC Verified → Address Verified → Employment Verified → Financial Verification Complete → Under Review → Approved / Rejected → Agreement Sent → Agreement Signed → Disbursed
    - Additional intermediate statuses: KYC Review Required / Compliance Review / Agreement Expired
30. WHEN the Application_Status transitions to any new state, THE Borrower_App SHALL send a push notification and update the in-app status tracker — the notification SHALL be in the borrower's preferred language and include a plain-language description of what the current status means and what happens next

---

## Credit_Engine Architecture

The Credit_Engine is the AI core of the platform. This section describes its internal structure, data flow, and design constraints to ensure it is implemented as a production-grade, auditable, and replaceable ML system.

### Inputs

The Credit_Engine receives a Feature_Vector assembled by the data processing pipeline from consented data sources. The feature set spans five categories:

| Category | Features |
|---|---|
| Income | Average monthly credit, income regularity score (coefficient of variation of monthly credits), income source count, salary vs. business credit classification |
| Payment Behavior | On-time payment ratio (utility bills), days-past-due count (existing obligations), payment streak length, missed payment frequency |
| Spending Patterns | Discretionary spend ratio, essential spend ratio, merchant category entropy, month-over-month spending volatility |
| Balance and Liquidity | Average end-of-month balance, minimum balance frequency (days balance < ₹500), 6-month balance trend (slope), balance-to-income ratio |
| Debt Obligations | Identified recurring EMI debits, estimated total monthly obligation, derived DTI ratio |

All features are normalized to a [0, 1] range using documented, version-controlled normalization rules before being passed to the ML model. Features derived from protected characteristic proxies are excluded per the documented exclusion list.

### Processing Pipeline

```
Raw Consented Data (AA Framework)
         │
         ▼
Feature Extraction Layer
    ├── UPI transaction parser → income + spending features
    ├── Bank statement parser → balance + obligation features
    └── Utility bill parser → payment behavior features
         │
         ▼
Normalization Layer
    ├── Per-feature min-max normalization (versioned rules)
    ├── Missing value imputation (neutral weight assignment)
    └── Data_Completeness calculation
         │
         ▼
Rule-Based Eligibility Layer
    ├── Hard filter: age ≥ 18
    ├── Hard filter: estimated income ≥ ₹5,000/month
    ├── Hard filter: not on RBI defaulter / fraud registry
    └── [FAIL] → Immediate rejection (no ML scoring)
         │
         ▼ [PASS]
ML Scoring Layer (Gradient-Boosted Model)
    ├── Input: normalized Feature_Vector (20+ features)
    ├── Output: Probability_of_Default (0.0–1.0)
    └── Calibration: isotonic regression against historical default rates
         │
         ▼
Score Mapping and Uncertainty Quantification
    ├── Probability_of_Default → Risk_Score (0–1000, monotonic mapping)
    ├── Confidence_Interval (derived from prediction variance)
    └── Feature_Importance (SHAP values, top 5 features ranked)
         │
         ▼
Credit_Engine Scoring API Response
    ├── Risk_Score
    ├── Confidence_Interval
    ├── Feature_Importance (ranked list)
    ├── Data_Completeness (%)
    └── Model version
```

### Model Governance

- Every model version is registered in the Model_Registry before deployment
- New models undergo a minimum 7-day shadow-testing period on live traffic before replacing the current model
- Model performance is monitored continuously; a drop of more than 5 points in AUC-ROC triggers an automatic alert to the system operator
- The ML model component is replaceable without changes to the feature extraction pipeline or scoring API contract — the interface is model-agnostic
- SHAP-based Feature_Importance is computed for every scored application, not just in aggregate — enabling per-decision auditability

### Relationship to Other Components

| Component | Relationship to Credit_Engine |
|---|---|
| Consent_Manager | Gates data access; Credit_Engine only receives features from consented data categories |
| Data Providers (AA) | Supply raw financial data that the feature extraction layer processes into the Feature_Vector |
| Explainability_Layer | Consumes Credit_Engine outputs (Risk_Score, Feature_Importance, Confidence_Interval) to generate borrower-facing and officer-facing explanations |
| Lender_Integration_Layer | Receives the Risk_Score and Confidence_Interval as the basis for Anonymized_Profile distribution to lenders |
| Audit_Log | Records every Credit_Engine scoring event with full input metadata, output values, and model version |
| Loan_Tracking_Module | Feeds repayment behavior back as training signal for future Credit_Engine model versions |

---

## Differentiation and Innovation

This section captures the strategic differentiators that distinguish this platform from conventional credit scoring systems.

### 1. Alternative Data for the Credit-Invisible

The platform is purpose-built for borrowers who are invisible to CIBIL and Experian. By ingesting UPI transaction history, utility payment records, and bank statement behavioral signals via the AA framework, the system can evaluate creditworthiness for users who have never held a formal loan. This is not a workaround — it is a more accurate signal set for this population.

### 2. Consent-First Architecture

Data is never collected without explicit, granular, purpose-bound consent. The Consent_Manager enforces this at the infrastructure level — not as a UI layer on top of unrestricted data access. Borrowers can revoke consent at any time, and the system adapts gracefully to reduced data availability.

### 3. Explainability as a Product Feature

Most credit systems treat explainability as a compliance obligation. This platform treats it as a retention and trust mechanism. A borrower who receives a clear rejection reason and actionable improvement steps is more likely to return, improve their profile, and reapply — converting a rejection into a future customer.

### 4. Dynamic Re-Evaluation

When a borrower provides new data or their financial behavior improves, the system can re-score within 48 hours. This creates a real-time feedback loop between borrower behavior and credit eligibility — a capability that static annual credit score updates cannot match.

### 5. Fair Lending by Design

Protected characteristic proxies are explicitly excluded from the feature set, documented in a versioned exclusion list, and reviewed quarterly. Monthly Fair Lending Reports give lenders and regulators visibility into approval rate disparities before they become systemic issues.

### 6. Single Application, Multiple Lender Access

A borrower submits one application and one set of consents. The platform handles distribution to participating lenders, collects their responses, and presents options without exposing the borrower's identity. Full data transfer happens only to the lender the borrower chooses. This eliminates the multi-application problem — where borrowers damage their credit score by applying to multiple lenders individually — and gives lenders access to pre-scored, pre-verified leads rather than raw applications.

---

## High-Level System Flow

```
Borrower App
    │
    ├── Language Selection & Onboarding
    ├── Aadhaar eKYC / DigiLocker KYC
    └── Loan Application Form (offline-capable)
         │
         ▼
Consent Manager
    │
    ├── Consent artifact creation (AA framework format)
    ├── Granular per-category consent capture
    └── Consent audit trail logging
         │
         ▼
Data Providers (via AA Framework)
    │
    ├── Bank / NBFC (bank statements, balance)
    ├── UPI PSP (transaction history)
    └── Utility / Telecom (bill payment history)
         │
         ▼
Credit Engine
    │
    ├── Rule-based eligibility layer (hard filters)
    ├── Feature extraction & normalization
    ├── ML risk model (hybrid scoring)
    ├── Confidence interval calculation
    └── Data completeness assessment
         │
         ▼
Explainability Layer
    │
    ├── Plain-language decision summary (borrower)
    ├── Factor breakdown with visual chart (opt-in)
    └── Technical report (loan officer)
         │
         ▼
Lender Integration Layer
    │
    ├── Anonymized_Profile distribution → Participating Lenders
    ├── Lender_Offer collection (amount, rate, tenure, fee)
    ├── Offer expiry management
    └── Audit log: profile distribution & lender responses
         │
         ▼
Borrower Offer Selection (Borrower App)
    │
    ├── Simple offer cards (lender name, EMI, rate, tenure)
    ├── Neutral ordering (no promoted placements)
    └── Borrower selects one lender
         │
         ▼
Consent Manager (Post-Selection)
    │
    ├── New explicit consent artifact (scoped to selected lender)
    ├── Full borrower profile transmitted to selected lender only
    └── Non-selected lenders notified of closure; access revoked
         │
         ▼
Lender Verification Workflow (Selected Lender Dashboard)
    │
    ├── [1] KYC Validation
    │       ├── PAN → Income Tax DB
    │       ├── Aadhaar token → UIDAI
    │       └── Status: KYC Verified / KYC Review Required
    │
    ├── [2] Address Verification
    │       ├── Document-based (Aadhaar / utility bill)
    │       ├── OTP / geolocation (digital)
    │       ├── Physical_Verification (field visit, loans > threshold)
    │       └── Status: Address Verified
    │
    ├── [3] Employment / Business Verification
    │       ├── Salaried: employer confirmation / EPFO lookup
    │       ├── Self-employed: GST / Udyam / ITR check
    │       ├── Gig / informal: AA bank credits + Loan_Officer review
    │       └── Status: Employment Verified
    │
    ├── [4] Financial Verification
    │       ├── Income validation vs. AA bank statement credits
    │       ├── DTI ratio calculation
    │       ├── Balance adequacy check
    │       └── Status: Financial Verification Complete
    │
    ├── [5] Fraud & AML Checks
    │       ├── RBI defaulter list / CIBIL fraud registry screening
    │       ├── Transaction pattern analysis (structuring / layering)
    │       ├── Negative news screening (third-party API)
    │       └── Status: Passed / Compliance Review
    │
    └── [6] Credit Underwriting (Loan_Officer)
            ├── Consolidated underwriting summary
            ├── Underwriting_Decision: Approved / Approved with Conditions / Rejected
            └── Status: Approved / Rejected
         │
         ▼
         [If Rejected] → Borrower notified with plain-language reason
                       → Option to select alternate lender (if valid offers remain)
         │
         ▼
         [If Approved]
         │
         ▼
Loan Agreement & eSign
    │
    ├── Loan_Agreement generated (amount, rate, EMI schedule, terms)
    ├── Borrower reviews in preferred language (min. 24-hour window)
    ├── Aadhaar-based eSign via OTP
    └── Signed agreement stored as tamper-evident PDF → Audit_Log
         │
         ▼
Bank Account Validation
    │
    ├── Penny-drop verification (₹1 credit + name match)
    └── Up to 3 re-attempts on failure before Loan_Officer escalation
         │
         ▼
Disbursement
    │
    ├── NEFT / IMPS / UPI within 1 business day of validation
    ├── Transaction reference logged → Audit_Log
    └── Application_Status → "Disbursed"
         │
         ▼
Audit Log (End-to-End)
    │
    ├── Immutable records: scoring, offer, selection, every verification step
    ├── Underwriting decision with officer ID and reason code
    ├── eSign execution and agreement reference
    ├── Disbursement transaction reference
    └── 7-year retention; queryable by regulators
         │
         ▼
Loan Tracking Module (Borrower App)
    │
    ├── Repayment schedule (EMI dates, amounts, outstanding balance)
    ├── Payment reminders (D-5, D-1)
    ├── Credit-building progress indicator
    └── Loan closure certificate on full repayment

Application Status Lifecycle (Borrower-Visible):
  Submitted → KYC Verified → Address Verified → Employment Verified
  → Financial Verification Complete → Under Review → Approved / Rejected
  → Agreement Sent → Agreement Signed → Disbursed
  (Intermediate: KYC Review Required / Compliance Review / Agreement Expired)
```

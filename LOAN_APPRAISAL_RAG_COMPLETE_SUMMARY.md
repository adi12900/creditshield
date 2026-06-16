# CreditShield Loan Appraisal + RAG: Complete Technical Summary

## 1) Executive Summary

This document summarizes how the CreditShield loan appraisal system is trained and executed, and what the RAG policy/rules model contains.

The platform is hybrid:
- Transaction analytics + rule engine for explainability and underwriting policy control.
- A trained ML classifier for repayment risk probability.
- RAG retrieval for policy/rule evidence (hard rules, soft review rules, KYC, credit, fraud).

Final decisioning combines deterministic policy logic with model probability and strict validation checks.

---

## 2) Loan Appraisal Model: Training Overview

### 2.1 Training script and dataset

Training is implemented in:
- `loan_appraisal_model/loan_appraisal_training.py`

Data source:
- CSV user transaction profiles from `dataset/synthetic_users/`
- Behavioral rules from `dataset/behavioral_rules_realistic.yaml` (preferred override path)

### 2.2 Feature creation for training

For each user CSV:
1. Load and normalize transaction data.
2. Extract behavioral and financial features.
3. Evaluate YAML rules and generate rule-derived numeric features.
4. Build a fixed feature vector.

Feature vector contains:
- Tier-encoded behavioral signals (critical/high/moderate/stable/strong mapped to numeric values).
- Numeric transaction features (salary, inflow/outflow, savings ratio, balance stress, EMI, BNPL, hidden loans, etc.).
- Rule-summary features:
  - rule_hit_count
  - rule_impact_sum
  - rule_critical_count
  - rule_high_count
  - rule_negative_impact_count
  - rule_positive_impact_count

Total feature count in current metrics artifact: 40.

### 2.3 Label generation strategy

The script uses pseudo-labeling from a heuristic score (weighted category score blend), then applies median thresholding:
- label 1 (safer): score >= threshold
- label 0 (risky): score < threshold

If labels collapse to one class, fallback thresholding is attempted using mean.

### 2.4 Model and algorithm

Classifier:
- RandomForestClassifier (scikit-learn)

Configured hyperparameters:
- n_estimators = 300
- max_depth = 10
- min_samples_leaf = 2
- class_weight = balanced
- random_state = 42

Train/test split:
- 75/25 split
- stratified split when possible

Detailed algorithm behavior (Random Forest):
- Type: supervised ensemble classification using bagging + feature randomness.
- Objective: classify each borrower profile as safer (1) or risky (0).
- Base learner: decision tree classifier.
- Ensemble size: 300 trees.
- Per-tree training data: bootstrap sample (sampling with replacement from train set).
- Split criterion: scikit-learn default Gini impurity for classification.
- Tree depth control: max_depth=10 limits overfitting and keeps decision paths interpretable.
- Leaf regularization: min_samples_leaf=2 prevents tiny leaf partitions.
- Class rebalancing: class_weight=balanced auto-adjusts class weights inversely proportional to class frequency.

Decision logic inside each tree:
1. Start at root with full bootstrap sample.
2. At each node, choose split feature and threshold that maximize impurity reduction.
3. Continue recursive partitioning until stopping criteria (depth, minimum leaf size, or pure leaf).
4. Store class distribution at each terminal leaf.

Forest prediction rule:
- Hard class: majority vote across trees.
- Probability of safer class: mean of per-tree safer probabilities.
- In code: `predict_proba(X)[:, 1]` gives safer probability.

Why this model fits current pipeline:
- Handles nonlinear interactions among engineered risk features.
- Tolerant to mixed feature scales (tier-encoded + continuous metrics).
- Robust to moderate noise in synthetic behavioral data.
- Produces stable probability estimates for hybrid score blending.

Pseudo-label generation algorithm used before training:
1. Compute category-level heuristic score from feature extractor output.
2. Add rule impact term (`rule_impact_sum * 15.0`) so labels reflect policy intensity.
3. Compute threshold using median of score distribution.
4. Assign label 1 if score >= threshold else 0.
5. If one-class collapse occurs, retry with mean threshold.

Heuristic score formula used by trainer:
- Income Stability weight: 0.25
- Credit Behavior weight: 0.20
- Financial Discipline weight: 0.20
- Loan Burden weight: 0.20
- Lifestyle Risk weight: 0.15

Compact representation:

$$
	ext{score}_{\text{heuristic}} = 0.25\,S_{income} + 0.20\,S_{credit} + 0.20\,S_{discipline} + 0.20\,S_{loan} + 0.15\,S_{lifestyle}
$$

$$
	ext{score}_{\text{label}} = \text{score}_{\text{heuristic}} + 15 \times \text{rule\_impact\_sum}
$$

Tier encoding used in vectors:
- critical -> 0.0
- high -> 1.0
- moderate -> 2.0
- stable -> 3.0
- strong -> 4.0

### 2.5 Training outputs

Artifacts:
- `loan_appraisal_model/loan_appraisal_trained_model.pkl` (model + feature metadata)
- `loan_appraisal_model/loan_appraisal_training_metrics.json`

Current metrics snapshot:
- rows_total: 133
- rows_train: 99
- rows_test: 34
- accuracy: 1.0
- roc_auc: 1.0
- labels: balanced (66 risky / 67 safer)

Note: These very high synthetic-data metrics should be interpreted carefully and validated on realistic OOT/live data.

---

## 3) Data Preprocessing and Feature Engineering

### 3.1 Transaction preprocessing

Primary logic is in:
- `loan_appraisal_model/loan_appraisal_features.py`
- `loan_appraisal_model/financial_data_processor.py` (robust generic CSV pipeline)

Core preprocessing steps:
1. Flexible column standardization across varied bank CSV formats.
2. Date parsing with fallback handling and row retention strategy.
3. Numeric cleaning for debit/credit/balance (commas, null-like tokens, invalid values).
4. Sorting and month extraction for temporal features.
5. Optional reconstruction of amount values from balance deltas for marker-style debit/credit files.

### 3.2 Robust monthly pipeline rules

Financial pipeline enforces:
- Full month-range inclusion from start month to end month.
- Missing months inserted with zero credit/debit.
- Monthly metrics computed as totals divided by full month count (not only active months).
- Multi-step consistency checks and tolerance-aware validation.

Validation examples:
- monthly_income * num_months ~= total_credit
- monthly_expense * num_months ~= total_debit
- monthly_savings * num_months ~= annual_savings

### 3.3 Behavioral and underwriting feature groups

Extracted signals include:
- Income stability: salary detection, salary consistency, variability, delays, employer switching.
- Cashflow quality: inflow/outflow, net savings, month-end stress, low-balance patterns.
- Debt behavior: EMI deductions, hidden liabilities, digital lending usage, BNPL dependence.
- Expense behavior: bills regularity, discretionary/lifestyle/addiction indicators.
- Risk context features: minimum balance, negative savings months, debt pressure indicators.

---

## 4) Rule Engine Used in Loan Appraisal

Implemented in:
- `loan_appraisal_model/loan_appraisal_rule_engine.py`
- Rules file: `dataset/behavioral_rules_realistic.yaml`

### 4.1 Rules currently configured (YAML)

YAML summary:
- version: 4.0
- generated_rules: 34
- categories:
  - income_stability
  - affordability
  - expense_behavior
  - liquidity_stress
  - debt_behavior
  - policy_overrides

Example rule patterns:
- Positive affordability band bonus when EMI-to-income is low.
- Critical penalties for stressed FOIR/EMI burden.
- RBI-aligned debit-to-income compliance bands (compliant, borderline, breach, severe breach).
- Penalties for negative post-EMI surplus.
- Hidden-loan and digital short-term borrowing risk penalties.
- Policy override boost for high-quality multi-signal profile.
- Reject guardrail for severe multi-indicator affordability stress.

### 4.2 Rule evaluation method

- Rule conditions are parsed safely with restricted AST evaluation (no arbitrary code execution).
- Rules fire only when required variables exist.
- Underwriting context metrics are computed and merged before evaluation:
  - estimated EMI
  - EMI-to-income ratio
  - expense-to-income ratio
  - DTI proxy
  - loan-size sensitivity
  - net surplus after EMI
  - income consistency score

### 4.3 Context-aware rule adjustment

Engine adapts rule impact using account type and product:
- Account-type classification: SALARIED / NON_SALARIED / BUSINESS / MIXED.
- Product detection: PERSONAL, MICRO, BUSINESS, EDUCATION, GOLD, BNPL, etc.
- Behavioral-factor suppression for non-applicable products.
- Severity down-weighting for micro-loans/non-salaried contexts where applicable.

### 4.4 Underwriting decision mapping

After rule impacts are summed:
- net_score thresholds map to APPROVE / APPROVE_WITH_CONDITIONS / REFER / DECLINE.
- Special MICRO_LOAN path applies additional critical-rule logic.

---

## 5) End-to-End Appraisal Pipeline (Runtime)

Implemented in:
- `loan_appraisal_model/loan_appraisal_engine.py`

Pipeline stages:
1. Data cleaning and transaction loading.
2. Feature engineering and stage payload construction.
3. Strict internal validation firewall.
4. Bedrock-based consistency audit validation.
5. Auto-correction loop (up to 3 rounds).
6. Rule + underwriting evaluation and final report generation.

If validation fails after retry loop, pipeline stops with failure.

Output contains:
- final_score, risk_level, recommendation
- category scores and behavioral flags
- fired rules with impact/severity/status
- underwriting explanation and traceable pipeline validation

---

## 6) Trained Model Inference and Hybrid Scoring

Implemented in:
- `loan_appraisal_model/loan_appraisal_inference.py`

Inference process:
1. Load model artifact and feature schema.
2. Recompute transaction + rule features for applicant.
3. Predict safe probability from RandomForest.
4. Run explainable rule engine appraisal.
5. Blend final score:
   - hybrid_score = 0.6 * rule_score + 0.4 * model_score
6. Apply guardrail for strong risky model signal.
7. Emit final risk level and recommendation.

Result includes model probabilities and hybrid contribution fields for transparency.

### 6.1 Inference artifact schema (what is loaded)

The pickle artifact includes:
- `model`: trained RandomForestClassifier
- `tier_map`: categorical tier to numeric mapping
- `tier_features`: ordered tier feature names
- `numeric_features`: ordered numeric + rule-metric feature names
- `feature_names`: full ordered schema used during fit
- `metrics`: training metadata snapshot

Inference must preserve this exact feature order. Any ordering mismatch can corrupt predictions.

### 6.2 Hybrid scoring algorithm (step-by-step)

1. Build model vector from current applicant features using artifact schema.
2. Get model outputs:
  - `prob_safe = P(y=1)`
  - `pred_safe = argmax class`
3. Run deterministic appraisal to get rule-driven score (`rule_score`).
4. Blend with weighted average:

$$
	ext{hybrid\_score} = 0.6 \times \text{rule\_score} + 0.4 \times (100 \times \text{prob\_safe})
$$

5. Apply risk guardrail: if `prob_safe <= 0.2` and blended score is overly optimistic, cap it.
6. Clamp to [0, 100].
7. Map to risk bands and recommendation.

Risk band mapping:
- score < 40 -> High Risk
- 40 <= score < 70 -> Moderate Risk
- score >= 70 -> Low Risk

Recommendation mapping:
- score < 35 -> Reject
- 35 <= score < 70 -> Approve with caution
- score >= 70 -> Approve

### 6.3 Why hybrid is used

- Rule engine gives policy faithfulness and explainability.
- ML probability gives nonlinear pattern sensitivity.
- Weighted blend reduces overdependence on any single mechanism.
- Guardrail protects against false comfort when model sees strong default risk.

---

## 7) RAG Model: Rules, Models, and Algorithms

### 7.1 RAG architecture

Core files:
- `ai_agent/rag/knowledge_base.py`
- `ai_agent/rag/embedder.py`
- `ai_agent/rag/retriever.py`
- `ai_agent/tools/policy_rag_tool.py`
- `ai_agent/tools/document_rag_tool.py`

RAG indexing pipeline:
1. Load static policy docs + all files under `ai_agent/rag/documents/rules/`.
2. Chunk text by token windows.
3. Embed each chunk.
4. Store vectors in retriever namespace `policy_global`.
5. Query-time retrieval by cosine similarity; fallback to keyword search if needed.

### 7.2 Embedding model path

Primary embedding model:
- Amazon Titan embeddings via Bedrock
- default model id: amazon.titan-embed-text-v2:0

Fallback chain:
1. Titan embedding via Bedrock runtime
2. sentence-transformers local model: all-MiniLM-L6-v2
3. deterministic mock 384-d vector (for mock mode / missing deps)

### 7.3 Retrieval algorithm

Retriever behavior:
- In-memory normalized vectors.
- Similarity metric: cosine similarity (dot product of normalized vectors).
- top_k from config (default 5).
- Optional keyword ranking fallback based on token counts.

Chunking config defaults:
- RAG_CHUNK_SIZE = 512 tokens
- RAG_CHUNK_OVERLAP = 50 tokens

Detailed retrieval math:
1. Every chunk embedding is normalized to unit length.
2. Query embedding is normalized to unit length.
3. Similarity computed as dot product of normalized vectors.
4. Since vectors are normalized, dot product equals cosine similarity.
5. Results sorted descending by similarity and top-k returned.

Formula:

$$
	ext{cosine}(q, v_i) = \frac{q \cdot v_i}{\lVert q \rVert\,\lVert v_i \rVert}
$$

With pre-normalized vectors, this reduces to:

$$
	ext{score}_i = q \cdot v_i
$$

Keyword fallback algorithm:
- Tokenize query into words.
- Count token frequency per chunk text.
- Rank by aggregated token count score.
- Return top-k when semantic retrieval has no hits.

### 7.6 RAG indexing algorithm in detail

Index build sequence:
1. Clear retriever state.
2. Load fixed policy docs (`rbi_digital_lending_2022`, hard/soft rules, product, IVL docs).
3. Load all files from `documents/rules/` with supported extensions.
4. Tokenize each document with `cl100k_base` tokenizer.
5. Create overlapping chunks (`size=512`, `overlap=50`).
6. Embed each chunk via configured embedder chain.
7. Insert into retriever namespace `policy_global` with source + part metadata.
8. Serialize retriever rows to JSON index file.

Complexity notes:
- Build time complexity roughly linear in number of chunks.
- Query time complexity in in-memory mode is linear scan over namespace vectors.
- For larger corpora, ANN/pgvector backend should be enabled to reduce query latency.

### 7.7 Embedding model fallback behavior (operational detail)

Embedding call path:
1. Try Bedrock Titan embedding model (`amazon.titan-embed-text-v2:0`).
2. If Bedrock call fails, use local sentence-transformers (`all-MiniLM-L6-v2`).
3. If local model unavailable, use deterministic mock Gaussian vector seeded by text hash.

Operational implications:
- Production quality expected with Titan.
- Local fallback preserves functionality in constrained environments.
- Mock fallback is suitable for tests/dev flows, not policy-grade semantic quality.

### 7.8 Policy retrieval tools behavior

`policy_rag_tool`:
- Namespace: `policy_global`.
- Returns text, source, similarity score, and regulation reference metadata.
- Purpose: fetch policy thresholds and wording with citations.

`document_rag_tool`:
- Namespace: `borrower_<arn>`.
- Searches borrower-uploaded document chunks.
- If no semantic hit, falls back to metadata-only references from data adapter.

### 7.9 Rule-family algorithm role in final decisioning

- Hard rules: high-confidence reject triggers and compliance-critical conditions.
- Soft rules: manual review routing for ambiguous or moderate-risk patterns.
- KYC rules: identity/address/watchlist consistency checks before final approval.
- Credit rules: affordability and bureau thresholds anchoring underwriting discipline.
- Fraud rules: integrity, identity conflict, and behavior velocity checks.

In practice, RAG retrieves the textual policy evidence while the appraisal engine executes numeric scoring logic; together they provide both decisioning and auditable explanation.

### 7.4 RAG rule sources currently indexed

Policy/rules text includes:
- hard_rules.txt (HR rules)
- soft_rules.txt (SR/manual-review rules)
- loan_rules.txt (credit/FOIR/bureau/stacking logic)
- kyc_rules.txt (PAN/Aadhaar/address/sanctions checks)
- fraud_rules.txt (tamper, identity mismatch, velocity, device risk)
- plus other policy references (RBI digital lending, loan products, IVL parameters)

### 7.5 Rule themes in RAG corpus

Hard rules (examples):
- FOIR breach rejection
- Document tamper rejection
- NPA/write-off rejection
- Verified-vs-declared income variance rejection
- Loan stacking rejection
- Bureau floor rejection
- Income below product minimum rejection

Soft/manual-review rules (examples):
- High income variability
- Missing ITR/GST for self-employed
- Mid fraud-probability band
- Salary credit gap
- New-to-credit cases

KYC rules:
- PAN format and name consistency
- Aadhaar consistency and triangulation
- Address validity/serviceability
- PEP/sanctions screening

Credit rules:
- FOIR formulas/caps
- Bureau floors by product
- Verified income binding logic
- obligations + stacking treatment

Fraud rules:
- Document integrity/tamper controls
- identity mismatch escalation
- loan/enquiry velocity
- device/IP behavior anomalies

---

## 8) Configuration Parameters That Control Behavior

From `ai_agent/config.py`:
- BEDROCK_MODEL_ID: meta.llama3-70b-instruct-v1:0 (LLM side)
- BEDROCK_EMBEDDING_MODEL: amazon.titan-embed-text-v2:0
- MOCK_MODE: env-driven; auto-enabled when AWS creds absent
- VECTOR_STORE: in_memory (pgvector flag exists but fallback to in-memory retrieval in current retriever code)
- RAG_TOP_K: 5
- RAG_CHUNK_SIZE: 512
- RAG_CHUNK_OVERLAP: 50

---

## 9) Practical End-to-End Flow

### Loan appraisal flow
1. Ingest bank statement CSV.
2. Normalize and validate monthly financial metrics.
3. Extract behavior + affordability features.
4. Evaluate YAML underwriting rules.
5. Run strict consistency checks (internal + Bedrock audit).
6. Score with rule engine and hybrid ML model.
7. Produce final decision package with explanations.

### RAG flow
1. Build index from policy and rule text files.
2. Embed chunks and store vectors.
3. At query time, retrieve top policy chunks (semantic, then keyword fallback).
4. Return citation-ready policy evidence to agent tools.

---

## 10) Key Observations and Recommendations

1. System design is strongly explainable due to rule traces + policy retrieval.
2. Training currently appears synthetic-heavy; keep OOT/real-world validation as mandatory gate before production calibration.
3. Strict validation firewall and correction loop are strong safeguards against inconsistent monthly metrics.
4. RAG rule corpus is well-structured by domain (hard, soft, KYC, fraud, credit), which improves policy-grounded responses.
5. pgvector option is signaled in config but current retriever behavior falls back to in-memory search path.

---

## 11) File Reference Map

- Loan model training: `loan_appraisal_model/loan_appraisal_training.py`
- Feature engineering: `loan_appraisal_model/loan_appraisal_features.py`
- Robust preprocessing pipeline: `loan_appraisal_model/financial_data_processor.py`
- Rule engine: `loan_appraisal_model/loan_appraisal_rule_engine.py`
- Runtime appraisal engine: `loan_appraisal_model/loan_appraisal_engine.py`
- Hybrid inference: `loan_appraisal_model/loan_appraisal_inference.py`
- Training metrics artifact: `loan_appraisal_model/loan_appraisal_training_metrics.json`
- Behavioral YAML rules: `dataset/behavioral_rules_realistic.yaml`
- RAG embedder/retriever: `ai_agent/rag/embedder.py`, `ai_agent/rag/retriever.py`
- RAG index builder: `ai_agent/rag/scripts/build_rag_index.py`
- RAG policy tool: `ai_agent/tools/policy_rag_tool.py`
- RAG borrower-doc tool: `ai_agent/tools/document_rag_tool.py`
- RAG rule docs: `ai_agent/rag/documents/rules/*.txt`

This completes the requested technical summary for model training, rules, algorithms, data preprocessing, and data pipeline behavior.


RandomForest internals: tree training logic, impurity-based splits, voting/probability behavior, and why these hyperparameters were chosen.
Pseudo-label generation algorithm with exact weighting and formulas.
Feature tier encoding map and vector construction details.
Inference artifact schema and strict feature-order dependency.
Hybrid score algorithm with math formula, guardrail logic, risk-band mapping, and recommendation mapping.
RAG retrieval math (cosine similarity), keyword fallback logic, and chunking/indexing algorithm details.
Embedding fallback chain behavior (Titan -> sentence-transformers -> mock) with operational implications.
Tool-level behavior for policy and borrower-document retrieval and how rule families are used in decisioning.
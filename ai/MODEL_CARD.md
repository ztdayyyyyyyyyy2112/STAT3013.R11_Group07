# Model card — Ghost Customer risk score

Status: **4+2+4 is the primary working scenario.** Scientific review of the label and split remains open (D-02, D-03, D-05). Results below come from the tracked evaluation artifacts.

## Intended use

- Rank Retailrocket visitors at a weekly snapshot T by the risk that their engagement in the next confirmation window falls below θ × their own baseline rate (the operational "Ghost" label, `ghost-baseline-ratio-v1-proposed`).
- Course research (STAT3013, RQ3) and the web demo. The demo shows the score next to the evaluation context.
- **Not for:** claims that a visitor has churned or left, causal statements about why, automated actions without human review, or any population other than the Retailrocket cohort it was trained on.

## Data

- Source: Retailrocket e-commerce events (Kaggle v2, CC BY-NC-SA 4.0). Anonymous `visitorid`, 2015-05-04 to 2015-09-14.
- Rows: visitor × weekly snapshot T from Lâm's cohort (scenario `b4_o2_c4`, ≥ 5 pre-T events, ≥ 2 active weeks, baseline activity > 0).
- Features: 41 pre-T `feature_*` columns (windows end strictly before T). IDs, dates, labels, and confirmation-window fields are excluded and checked by code.
- Label task (default): ghost = 1 vs active = 0. Inactive (zero future events), recovered, and unknown/censored rows are excluded. This follows the Decision Tree / Gaussian NB benchmark contract and still needs D-03 approval.

## Training and selection

- Split: visitor-aware temporal split (D-05 proposal). Each visitor belongs to one split. Earlier half-open label windows can end exactly at the beginning of the next split. The last mature week forms the held-out test.
- Candidates: majority, EDS rule, logistic regression, random forest, gradient boosting (XGBoost or HistGradientBoosting), and optionally SVM / Isolation Forest.
- Hyper-parameters and the served model are chosen on **validation PR-AUC**. Platt calibration is fitted on train out-of-fold scores and kept only if validation Brier improves.
- Operating threshold: minimum expected cost on validation with C_FN = 5, C_FP = 1. This is a business assumption; see `threshold_study.csv` for other operating points.

## 25 November 2026 real-data run

| Field | Value |
|---|---|
| model_version | `ghost-xgboost-cal-7751ac34` (XGBoost, max_depth 5, min_child_weight 1, Platt-calibrated) |
| scenario / label | `b4_o2_c4`, `ghost-baseline-ratio-v1-proposed`, θ = 0.5, task ghost vs active |
| split_version | `visitor-temporal-v2_tr2015-06-22_va2015-07-20_te2015-08-17_f50-25-25_s3013` |
| rows (train / validation / test) | 1,510 / 352 / 330 (Ghost 615 / 140 / 153) |
| input SHA-256 (features / labels) | `8b2fcd37…` / `ee1c3b30…` (exact hashes in `research/statistics/inference_audit.json`) |
| model artifact SHA-256 | See the exact hash in `ai/evaluation/model_meta.json`; the local binary is ignored by Git and gets a new hash on each timestamped rebuild. |
| test support / prevalence | 330 / 0.464 (no-skill PR-AUC 0.464) |
| test PR-AUC [95 % CI] | 0.910 [0.870, 0.939] (500 visitor bootstrap resamples from one week); EDS rule 0.848 |
| test ROC-AUC, Brier, ECE | 0.912, 0.121, 0.066 |
| operating threshold, precision, recall | 0.09 (validation min-cost, C_FN = 5, C_FP = 1); precision 0.683, recall 0.987; 67% of rows alerted |
| ablation without target-component features | XGBoost test PR-AUC 0.899, logistic 0.908; XGBoost baseline rate alone 0.723 |
| observation-only ablation | XGBoost test PR-AUC 0.807, logistic 0.808 using ten features from the two weeks before T |

## Known limitations

- **The score depends on baseline history.** The full XGBoost model reaches PR-AUC 0.910. Removing named target components leaves overlapping historical features and yields 0.899. Restricting inputs to the ten observation-period features lowers PR-AUC to 0.807.
- **Two effective risk bands.** The medium and high cutoffs both equal 0.09. A score of 0.09 or above is high; a lower score is low. The cutoff flags 221 of 330 test rows, with 70 false positives and two false negatives.

- **Operational proxy label.** "Ghost" is a rule over session counts, not observed churn or intent. Results change with θ, the windows, and the session gap (see E-02).
- **Circularity.** The label divides future sessions by `feature_baseline_sessions_per_week`, which is also an input. `feature_decay_ratio` and `feature_eds` are derived from the same rate. Predictive claims must show both the overlapping-window and observation-only ablations.
- **Right-censoring and limited time coverage.** There are 10 mature snapshot weeks. Purging and visitor assignment leave two train weeks, one validation week, and one test week. Visitor bootstrap intervals do not measure uncertainty across weeks.
- **Sample selection.** Only visitors with enough pre-T history are scored. Inactive and recovered visitors are excluded from the default task, but the deployed model still scores them.
- **Repeated snapshots.** Rows from the same visitor are dependent. CIs resample visitors, not rows.
- **Observational data.** Feature attributions and coefficients describe associations. Acting on a high score is not evidence that an intervention helps.
- **Calibration.** Probabilities are calibrated on 2015 Retailrocket data only and drift under any other traffic mix.

## Explanations

`top_factors` in the API is the change in score when one feature is set to its training median (probability points, interactions ignored). Global views: permutation importance on validation, plus SHAP when the `shap` package is installed.

## Ownership

Kiệt (model, split, card), Long (API integration), Lâm (features/labels), Thành (review, Decision Tree benchmark).

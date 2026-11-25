**Run:** `ghost-xgboost-cal-7751ac34` · split `visitor-temporal-v2_tr2015-06-22_va2015-07-20_te2015-08-17_f50-25-25_s3013` · label task `ghost_vs_active` (label version `ghost-baseline-ratio-v1-proposed`, scenario `b4_o2_c4`) · generated 2026-11-25T08:36:02Z

**Table ML-1. Visitor-aware temporal split.**

| split | rows | visitors | positives | prevalence | snapshot_min | snapshot_max | label_end_max |
|---|---|---|---|---|---|---|---|
| train | 1510 | 1074 | 615 | 0.407 | 2015-06-15 | 2015-06-22 | 2015-07-20 |
| validation | 352 | 352 | 140 | 0.398 | 2015-07-20 | 2015-07-20 | 2015-08-17 |
| test | 330 | 330 | 153 | 0.464 | 2015-08-17 | 2015-08-17 | 2015-09-14 |

12023 of 14215 supervised rows are not used because of label purging or visitor bucketing.

**Table ML-2. Model comparison (selection on validation PR-AUC; test evaluated once).**

| name | family | val_pr_auc | test_pr_auc | test_pr_auc_ci95 | test_roc_auc | test_recall | test_precision | test_f1 | test_brier | threshold |
|---|---|---|---|---|---|---|---|---|---|---|
| majority | baseline | 0.398 | 0.464 | [0.4121, 0.5152] | 0.500 | 1.000 | 0.464 | 0.633 | 0.252 | 0.400 |
| rule_eds | baseline | 0.806 | 0.848 | [0.8051, 0.8881] | 0.851 | 0.771 | 0.819 | 0.795 | 0.169 | 0.050 |
| logistic_regression | linear | 0.896 | 0.913 | [0.8773, 0.9425] | 0.916 | 0.967 | 0.664 | 0.787 | 0.122 | 0.160 |
| random_forest | tree | 0.907 | 0.920 | [0.8848, 0.9464] | 0.923 | 0.967 | 0.692 | 0.806 | 0.108 | 0.210 |
| xgboost | boosting | 0.919 | 0.910 | [0.8696, 0.9391] | 0.912 | 0.980 | 0.691 | 0.811 | 0.138 | 0.030 |
| svm_rbf | optional | 0.896 | 0.905 | [0.8662, 0.9367] | 0.907 | 0.954 | 0.646 | 0.770 | — | 0.370 |
| isolation_forest | optional | 0.433 | 0.497 | [0.4351, 0.581] | 0.594 | 1.000 | 0.468 | 0.637 | — | 0.020 |
| xgboost+platt | boosting | 0.919 | 0.910 | [0.8696, 0.9391] | 0.912 | 0.987 | 0.683 | 0.807 | 0.121 | 0.090 |

No-skill PR-AUC equals test prevalence = 0.464. Rank-only models (SVM, Isolation Forest) have no Brier score because their outputs are not probabilities.

**Selected model:** xgboost+platt with {'max_depth': 5, 'min_child_weight': 1}; calibration: {'method': 'Platt on visitor-grouped train out-of-fold scores', 'val_brier_raw': 0.10114, 'val_brier_calibrated': 0.09709, 'applied': True}.

**Operating point (chosen on validation):** threshold 0.09 (min expected cost on validation, C_FN=5.0, C_FP=1.0); risk bands {'high': 0.09, 'medium': 0.09}.

**Test at the operating threshold:** support 330, Ghost 153 (prevalence 0.464), precision 0.683, recall 0.987, F1 0.807, ROC-AUC 0.912, PR-AUC 0.910, Brier 0.121, ECE 0.066; confusion matrix [[TN, FP], [FN, TP]] = [[107, 70], [2, 151]].

**Table ML-3. Circularity ablation (label uses baseline sessions/week).**

| feature_set | model | n_features | val_pr_auc | test_pr_auc | test_roc_auc |
|---|---|---|---|---|---|
| full | xgboost | 41 | 0.919 | 0.910 | 0.912 |
| full | logistic_regression | 41 | 0.896 | 0.913 | 0.916 |
| no_target_components | xgboost | 36 | 0.920 | 0.899 | 0.899 |
| no_target_components | logistic_regression | 36 | 0.890 | 0.908 | 0.908 |
| observation_only | xgboost | 10 | 0.753 | 0.807 | 0.780 |
| observation_only | logistic_regression | 10 | 0.741 | 0.808 | 0.771 |
| baseline_only | xgboost | 1 | 0.746 | 0.723 | 0.835 |
| baseline_only | logistic_regression | 1 | 0.638 | 0.665 | 0.803 |

**Table ML-4. Permutation importance on validation (PR-AUC drop).**

| feature | pr_auc_drop_mean | pr_auc_drop_sd |
|---|---|---|
| feature_decay_ratio | 0.162 | 0.026 |
| feature_baseline_sessions_per_week | 0.090 | 0.008 |
| feature_recency_days | 0.008 | 0.005 |
| feature_n_distinct_items_pre | 0.006 | 0.004 |
| feature_views_4w | 0.003 | 0.002 |
| feature_events_6w | 0.002 | 0.002 |
| feature_events_4w | 0.002 | 0.002 |
| feature_baseline_events_per_week | 0.002 | 0.001 |
| feature_sessions_1w | 0.002 | 0.001 |
| feature_active_days_4w | 0.001 | 0.003 |

Explanations: {'permutation': 'validation PR-AUC drop, 10 repeats', 'local': 'baseline replacement (train medians), probability points', 'shap': 'SHAP (TreeExplainer), unit: model margin (log-odds for boosting, probability for forests), n=330 test rows'}. These are associations, not causal effects.

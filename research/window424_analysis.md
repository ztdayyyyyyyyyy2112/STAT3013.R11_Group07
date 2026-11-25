# Four-week confirmation analysis (working evidence)

**Scenario:** `b4_o2_c4` — 4-week baseline, 2-week observation, 4-week confirmation.  
**Dataset:** Retailrocket `events.csv`, 2,756,101 rows, SHA-256 `3745aa83238b1e6d44d8fda209807899f420084398f94ddf745f3cbcfecbf9e7`.  
**Pipeline:** `audit_compat`; feature and label hashes: `8b2fcd37349e67254364d9950fb4d5965b33e1cf1bb233c15de985cd85743997` and `ee1c3b300afc98c6753eb8e33df040225f618d0f57d59d5e4d9b5bba0781b2ae`.

This note is the current quantitative reference for Lâm's cohort, descriptive and sensitivity work and Long's inference, regression and forecast work. The results are reproducible artifacts from the pinned source, but are still exploratory because the team has not approved the cohort and operational label. Older documents may contain the superseded 4+2+2 analysis; do not combine those denominators or metrics with this note.

## Cohort and labels

The pipeline produced 97,489 history-eligible visitor snapshots across 14 weekly cutoffs. A 4-week confirmation period leaves 72,711 mature labels and 24,778 right-censored/unknown labels. The mature statuses are:

| Operational status | Snapshots |
| --- | ---: |
| Inactive | 56,374 |
| Active | 8,405 |
| Ghost | 5,810 |
| Recovered | 2,122 |
| Unknown/censored | 24,778 |

These are repeated visitor snapshots, not distinct customers. Descriptive summaries retain repeated snapshots and should be read as snapshot-level summaries. The visitor-level inference below deliberately selects one latest mature snapshot per visitor.

## Descriptive and inferential results

Current descriptive summaries are in `research/statistics/results.json` and local `data/processed/descriptive_statistics.json`. The distributions are right-skewed, so report medians and quartiles alongside means and sample standard deviations. For example, the active group's 4-week session count has *n* = 8,405, mean 7.29, SD 10.97 and median 4. The observed-label counts and all feature-specific missingness are in the generated table.

For the pre-snapshot recency comparison, the analysis takes each visitor's latest mature snapshot and then retains Ghost or Active only: 1,271 Ghost and 1,008 Active visitors (*n* = 2,279). Mean recency is 17.15 days for Ghost and 5.62 days for Active. The Ghost-minus-Active difference is 11.53 days (95% Welch CI [10.89, 12.17]), *t* = 35.48, df = 1,690.54, *p* = 1.44 × 10⁻²⁰⁶, Cohen's *d* = 1.37. This is an observational association under a proposed label; it is not a causal effect or validated churn finding.

Sensitivity outputs are regenerated locally in `data/processed/sensitivity.json`. Under the session-based label, changing the relative decline threshold from 0.5 to 0.4 to 0.3 changes the Ghost count from 5,810 to 5,322 to 3,549. Changing the session gap from 30 minutes to 15 or 60 changes the Ghost count from 5,810 to 6,079 or 5,561. The no-purchase variant moves 104 threshold-0.5 purchase-positive cases from Ghost to Active. These checks show that the operational label depends on design choices.

## Regression analyses

**OLS:** The outcome is future sessions per week across the 4-week confirmation horizon. The chronological evaluation uses 29,290 training rows (12,412 visitors) and 12,915 test rows, excluding 1,655 repeated test visitors from training. The multiple model uses 4-week sessions, views and recency as predictors; *R*² = 0.372, test MAE = 0.302 and RMSE = 0.718 sessions/week. The sessions coefficient is 0.118 (95% CI [0.094, 0.141]); views and recency are not statistically distinguishable from zero in this model. It produces 4,047 negative predictions on a nonnegative count outcome, so predictions need a stated limitation and a count-model alternative remains worth evaluating. It describes conditional association, not causation.

**Logistic regression:** This separate exploratory task is Ghost versus all other mature states (inactive and recovered are negatives), not the AI model's Ghost-versus-Active task. It has 72,711 eligible rows, with the final chronological test containing 5,816 rows and 386 Ghost cases (6.64% prevalence). At the validation-selected threshold 0.10, test PR-AUC is 0.156, ROC-AUC 0.671, precision 0.148, recall 0.373 and F1 0.212. The low precision and recall must be shown; this is not a strong standalone classifier.

Detailed coefficients and split policies are in `research/regression/results/ols_results.json` and `research/regression/results/logit_results.json`. Inputs and their hashes are recorded in ignored local `data/processed/regression/input_manifest.json`.

## Weekly forecast

The 4+2+4 setup supplies only 10 mature weekly Ghost-rate observations, from 15 June through 17 August 2015. The selected baseline is the last mature value, not ARIMA. A label-availability-aware backtest has two origins: MAE 0.00828, RMSE 0.00841 and sMAPE 10.10% on the rate scale. The two exploratory forecasts for 21 and 28 September are both 8.63%. There is no prediction interval. With ten history points and two backtest origins, the forecast is a dashboard demonstration and should not be described as reliable long-range forecasting.

## Rerun and evidence locations

From the repo root with the pinned source at `data/raw/events.csv`:

```powershell
python -m data.scripts.run_pipeline --mode audit_compat
python -m scripts.prepare_real_demo --from-processed
```

The source hash, row counts and generated local-file hashes are recorded in ignored `data/processed/manifest.json`. Aggregate inferential and forecast outputs are committed under `research/statistics/` and `research/forecasting/`; regression outputs are committed under `research/regression/results/`. Raw and row-level processed data remain local and ignored by Git.

## Current decision status

The 4-week confirmation horizon is the working analysis setting requested after course feedback. D-01 through D-05 remain subject to the team's final approval and evidence review, and SEM guidance remains open under D-07. Before submission, update report, IEEE paper, slides and demo narration from this evidence note and remove obsolete 4+2+2 figures from any artifact presented as current.

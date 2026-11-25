# Research decision log

Record the date, owner, alternatives, quantitative evidence, decision, and consequences before treating a working assumption as final. Entries below are open; examples are not approved thresholds.

| ID | Decision | Current state | Evidence needed | Owner |
| --- | --- | --- | --- | --- |
| D-01 | Dataset and permitted use | Retailrocket preferred for audit; fallback open | Source/license, coverage, repeat visitors, usable history | Lâm; Thành approves |
| D-02 | Baseline, observation and confirmation windows | Teaching assistant requested a 4-week confirmation horizon. Current reproducible pipeline uses `b4_o2_c4` (4 baseline, 2 observation, 4 confirmation) as the working setting; final team decision remains open | 97,489 history-eligible snapshots; 72,711 mature labels and 24,778 unknown/censored; scenario counts in local `data/processed/cohort_flow.json`, `data/processed/sensitivity.json`; current results and changed denominator in `research/window424_analysis.md` | Lâm; Thành approves |
| D-03 | Ghost/active/recovered/inactive label and decline threshold | Open; E-02 compares baseline-relative session/event labels at theta 0.5/0.4/0.3; no selection approved | Label counts, censoring, no-purchase variant, circularity risk; see local `data/processed/sensitivity.json` | Lâm; Thành approves |
| D-04 | Session boundary | Open; E-02 compares 15/30/60 minutes; no selection approved | Session and label sensitivity; see local `data/processed/sensitivity.json` | Lâm; Thành approves |
| D-05 | Temporal split and repeated visitors | Proposed by Kiệt, awaiting Long/Thành review: last 2 mature weeks test, previous 2 validation, strict label purge, visitor SHA-256 buckets 50/25/25 (`ai/training/split.py`); time-only run as sensitivity | Rows/visitors/prevalence per split and purge losses in `ai/evaluation/split_manifest.json` | Kiệt and Long |
| D-06 | Forecasting method | 4+2+4 yields 10 mature weekly rates; last-mature-value baseline produces two exploratory future points; current backtest has two origins and no interval; ARIMA is not supported by this short series; owner review open | `research/forecasting/analysis_manifest.json`, local `data/processed/forecasting/forecast.json`, `research/window424_analysis.md` | Long; Thành reviews |
| D-07 | SEM requirement | Clarification pending | Lecturer guidance and valid measurement model | Thành and Long |

## Decision record template

### D-XX — Short title

- Date and participants:
- Alternatives:
- Evidence (file, version, counts, plot):
- Decision and reason:
- Impact on data, API, analysis, and report:
- Revisit trigger:

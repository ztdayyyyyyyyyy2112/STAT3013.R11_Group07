# Ghost Customer Prediction from E Commerce Event Histories

STAT3013 full project report, 25 November 2026. The statistical setting is a **proposed** operational definition. All reported numerical results were reproduced from the pinned Retailrocket event file on the local demo machine. The report documents the completed research prototype and its unresolved scientific decisions; it does not claim lecturer approval, a completed SEM analysis, or completed academic integrity checks.

## Abstract

We study whether recent visitor behavior in an e-commerce event log can identify a later decline in engagement. We construct a weekly visitor snapshot with features measured before time T and a future operational Ghost label based on a visitor's own baseline session rate. The verified Retailrocket file contains 2,756,101 events. The proposed 4+2+4-week setting yields 97,489 history-eligible snapshots, of which 72,711 have a fully observed future horizon. Descriptive and visitor-level inferential analyses show higher pre-T recency for Ghost than Active visitors. An OLS regression describes future sessions per week; a separate logistic regression examines Ghost against all other mature states. A 10-week mature Ghost-rate series supports a short naive forecast, but does not support a defensible ARIMA selection. A visitor-disjoint temporal classifier reaches test PR-AUC 0.910 for the proposed Ghost-versus-Active task; when limited to observation-period counts, PR-AUC falls to 0.807. This large reduction shows that baseline history is central to the full model's score. The web demo serves the processed data and trained model through seven real API routes. The work demonstrates a reproducible analytic pipeline; it does not establish true churn, causal effects, or a production-ready intervention policy.

**Keywords:** customer engagement, operational Ghost label, temporal validation, class imbalance, statistical inference, forecasting, machine learning.

## 1 Introduction

### 1.1 Background and research problem

Digital commerce logs record visits, views, cart actions, and transactions, but a silent visitor does not supply a direct statement of intent. A decline in activity may indicate reduced interest, a temporary pause, or the end of a one-time task. We therefore study a measurable future behavior rather than treating the word Ghost as a verified customer state. At each Monday snapshot T, we ask whether the following confirmation period has low activity relative to that visitor's earlier baseline.

The project has four research questions. RQ1 asks how behavior observed before T differs between visitors later assigned Ghost and Active labels. RQ2 asks which pre-T variables are associated with future activity and with a binary Ghost outcome under explicitly different analysis populations. RQ3 asks whether predictive models rank future Ghost versus Active snapshots better than simple baselines on later, visitor-disjoint data. RQ4 asks whether the weekly proportion of known mature Ghost labels can be forecast with evidence appropriate to the available series length.

The practical objective is a transparent research prototype. The application must show exactly what the data and model artifacts contain, preserve missing or censored states, and explain evaluation context. It must not imply that a high score proves abandonment or that contacting a visitor would improve outcomes. The project requirements also list structural equation modeling (SEM). This event-log study currently lacks a justified latent-variable measurement design; Section 7 records that limitation and the question requiring lecturer clarification.

### 1.2 Objectives and contributions

The project contributes a pinned, auditable event-log pipeline, a transparent operational Ghost definition, several statistical tasks with clearly separated analysis populations, and a web demonstration that serves the resulting artifacts. Its methodological contribution is the explicit temporal availability rule: a feature belongs to the period before a prediction time T, whereas a label requires a fully observed later horizon. A visitor may appear at several weekly snapshots, so the report states when repeated rows are descriptive units and when one visitor or a visitor-disjoint split is required. These design choices are integral to the claims, not optional implementation details.

The first objective is to quantify which parts of the public log support a longitudinal cohort after historical eligibility and right censoring. The second is to compare pre-T behavior in operational Ghost and Active groups, with an inferential analysis whose unit is a visitor. The third is to fit and interpret continuous and binary regressions while checking response and error assumptions. The fourth is to evaluate a weekly Ghost-rate forecast only to the extent the mature history permits. The fifth is to compare several classifiers on a shared later test set, inspect calibration and threshold behavior, and measure sensitivity to the baseline variables used in the label. The final objective is to expose the outputs in an end-to-end research interface without filling missing values with mock scientific results.

### 1.3 Scope and evidence boundary

The unit called a “customer” in the interface is an anonymous Retailrocket visitor ID, not an authenticated person. The work is a study of observed interaction events from one historical site and a proposed relative-activity rule. It cannot determine customer intention, explain why engagement fell, or estimate whether a promotion would prevent churn. All model scores must be interpreted as estimates for the operational task under the chosen cohort and split. The dataset cannot validate a satisfaction construct for SEM, and its short mature weekly series cannot support a stable ARIMA choice. Those limitations determine the analysis rather than being hidden as an afterthought.

## 2 Related work and methodological position

### 2.1 Churn prediction and class imbalance

Neslin and colleagues [1] compared predictive accuracy of churn models on validation data. Their study motivates a common held-out comparison, but its outcome and business context differ from this operational event-log label. Burez and Van den Poel [2] studied class imbalance in customer churn prediction. Here the balance changes sharply with the denominator: Ghost is 6.0% of all history-eligible snapshots, 6.6% of the logistic test sample, and 46.4% of the Ghost-versus-Active ML test sample. Those are three different tasks and cannot share one unqualified prevalence claim.

Saito and Rehmsmeier [3] explain why precision-recall analysis is useful when the positive class is uncommon. We report PR-AUC with support and prevalence alongside ROC-AUC, precision, recall, and threshold. Guo and colleagues [4] discuss probability calibration. We check Brier score and calibration bins rather than assuming that good ranking yields reliable probabilities. Lundberg and Lee [5] introduced SHAP as a model attribution framework. We use attribution to describe fitted model behavior, not to identify causes or a customer’s reasons for inactivity.

No cited study validates the Ghost threshold for this dataset. The definition, session gap, windows, and split were selected for audit feasibility and remain open research decisions D-01 through D-05. The strongest methodological constraint is temporal: every feature must be observed before T, while a label requires the entire future confirmation interval. The second constraint is repeated visitors. We account for them differently by analysis: descriptive tables retain repeated snapshots and disclose dependence; the primary test uses one snapshot per visitor; model test partitions are visitor-disjoint.

### 2.2 Calibration, explanation, and the study gap

The literature supports evaluation principles rather than this exact outcome. A churn model can be compared fairly only after its target, population, time horizon, and costs have been specified. In this project the target is derived from the same event log used as input. The positive fraction ranges from approximately 7% to 46% across the regression and classification tasks because the reference class and split differ. Average precision therefore appears beside each task's support and prevalence. A high ROC-AUC alone would not reveal the number of false alerts at the selected threshold.

Probability calibration asks whether a numerical score corresponds to observed frequency under the test task. It does not turn an operational proxy into a verified churn probability. Likewise, a SHAP or permutation ranking describes which observed variables the fitted model uses, while correlated historical windows can share or exchange attribution. The most important gap in this work is therefore construct dependence: the Ghost label is a future-to-baseline ratio, and the full model sees past baseline activity. We explicitly compare a full model with restricted inputs to measure how strongly the impressive ranking depends on that design choice. This makes the project more useful than a score-only comparison, while keeping its conclusions narrower than real-world customer abandonment.

## 3 Data provenance and audit

### 3.1 Source integrity and event schema

The source is Retailrocket's public e-commerce dataset, Kaggle version 2 [6]. We extracted `events.csv` locally, verified its size of 94,237,913 bytes and SHA-256 `3745aa83238b1e6d44d8fda209807899f420084398f94ddf745f3cbcfecbf9e7`, and counted 2,756,101 events. The source field `visitorid` is an anonymous identifier, not a verified person or account. The processing code retains and flags exact duplicates; the documented duplicate-exclusion sensitivity changes little under the proposed label, but does not prove all anomalous behavior harmless. The source page identifies a CC BY-NC-SA 4.0 license. Raw and visitor-level processed files are excluded from Git.

[[TABLE:source_fields]]

The event file contains a millisecond timestamp, a visitor identifier, an event category, an item identifier and a transaction identifier when relevant. The analysis uses event occurrence and timing; it does not derive customer revenue or lifetime value because `events.csv` does not by itself establish an item price at the moment of every event. Item-property and category data are outside the present pinned analysis. This scope prevents a monetary interpretation that the implemented data join cannot support.

Event timestamps are milliseconds converted to UTC. A session begins after a 30-minute inactivity gap in the proposed setup. Weekly bins begin Monday at 00:00 UTC. The observation boundary is 14 September 2015. A candidate snapshot needs at least five prior events, two active history weeks, and baseline activity. The `audit_compat` cohort keeps historical eligibility visible; the stricter `research` eligibility also requires observation-period activity and is recorded separately in the cohort-flow output. No scientific decision has yet designated one as final.

### 3.2 Snapshot construction and temporal availability

[[FIG:study_design]]

Each eligible visitor may contribute more than one Monday snapshot. This is deliberate: a longitudinal research interface needs to show how an individual's activity changes as the cutoff moves. The same design also creates dependence among rows, because adjacent snapshots reuse much of the same history. Descriptive counts in this report refer to snapshots unless explicitly labeled as distinct visitors; no snapshot count is presented as a count of people. For inference, the primary comparison uses one latest mature row per visitor. For predictive evaluation, a visitor ID may enter only one train, validation, or test partition. Those safeguards answer different statistical questions and should not be conflated.

At a snapshot T, the baseline covers four earlier weeks and the observation window covers the two weeks immediately before T. Feature columns may summarize shorter or overlapping windows within that past. The four-week confirmation window after T is used solely to assign later labels. An outcome remains unknown when any required part of this future interval lies beyond observed data. The feature timestamp audit checks that the most recent source event used for a feature does not extend beyond T. A label-delay purge additionally prevents a training outcome from overlapping the start of validation or a validation outcome from overlapping the start of test. Together these rules remove avoidable temporal leakage, while the operational definition itself still needs scientific review.

The primary 4+2+4 setting uses four baseline weeks, two observation weeks, and four confirmation weeks. Across 14 snapshot dates, 97,489 rows satisfy the history rule, representing 27,327 distinct visitor IDs. Of these, 72,711 have a mature label and 24,778 are right-censored. The mature labels comprise 56,374 Inactive, 8,405 Active, 2,122 Recovered, and 5,810 Ghost snapshots. The display status `candidate` is a subset of Unknown and does not add to the mature counts.

[[FIG:cohort_status]]

[[TABLE:cohort_status]]

The label uses sessions per week. If the confirmation rate divided by the baseline rate is below θ = 0.5 and there are future events, the row is Ghost. If future events are zero, it is Inactive. An observation-period decline followed by recovery is Recovered. A fully observed row without those conditions is Active. Immature future horizons are Unknown, with a null target. This is a behavioral proxy. It does not measure true churn or motivation.

### 3.3 Label sensitivity and censoring

The 4+2+2 comparison retains 85,899 mature snapshots and censors 11,590. The 4+3+2 setting retains 86,629 mature snapshots and censors 13,511. The 6+2+4 setting retains 88,280 mature snapshots and censors 40,043. Under the primary 4+2+4 session label, changing θ from 0.5 to 0.4 or 0.3 changes the Ghost count from 5,810 to 5,322 or 3,549. A 15/30/60-minute session gap yields 6,079/5,810/5,561 Ghost rows. These are sensitivity counts for the study cohort. E-01 and E-02 record the inputs and cohort flow.

[[TABLE:sensitivity]]

The alternatives demonstrate why a large raw cohort is not necessarily a stronger supervised experiment. Longer confirmation periods increase the share of candidate rows whose outcomes have not matured by the source boundary. A threshold change can alter both the positive class and the interpretability of the problem, while a session-gap change alters the rate used in that threshold. No result here identifies a unique business-correct value. The current settings provide a reproducible working scenario, and the decision log explicitly leaves final selection open for team and lecturer review. Treating censored rows as negative would bias every late-week rate downward and inflate negative support, so the pipeline keeps a null target for those rows.

## 4 Descriptive statistics and visitor-level inference

### 4.1 Snapshot-level descriptive results

The processed descriptive table has 28 group and metric combinations. Each of the four mature label groups has seven pre-T features: sessions, views, carts, purchases, active days, recency, and decay ratio. The table includes observed sample size, missingness, mean, sample standard deviation, quartiles, and a histogram. Groups still contain repeated visitor snapshots.

[[TABLE:descriptive]]

The mean and median should be read together because event intensity has a long right tail. A small set of highly active visitors can raise the mean while the median remains near the low end of the distribution. Zero cart and purchase counts are common. The full seven-feature table therefore reports quartiles and missingness instead of relying on a single average. The group status is assigned using the future confirmation interval, while every displayed feature was measured before T. A snapshot-level comparison is useful for describing the population shown by the dashboard, but it is not an independent-sample test when a visitor appears repeatedly.

### 4.2 Visitor-level hypothesis test

We compare mean pre-T recency between Ghost and Active using each visitor's latest mature snapshot, then select the two groups. This leaves 1,271 Ghost and 1,008 Active visitors. Mean recency is 17.15 and 5.62 days, respectively. The Welch mean difference is 11.53 days (95% CI [10.89, 12.17], t = 35.48, df approximately 1,691, p = 1.44 × 10^-206). Cohen's d is 1.37. The Ghost share among the 2,279 selected visitors is 0.558 (Wilson 95% CI [0.537, 0.578]).

[[FIG:visitor_recency]]

[[TABLE:inference]]

The test assumes visitors are independent and that a large-sample mean comparison remains interpretable despite skew. Selecting the latest snapshot and conditioning on a future label can induce selection effects. The descriptive and inferential means differ because they use different units and inclusion rules. Neither the small p-value nor d establishes a cause or an intervention effect. The full hypothesis, sample, assumptions, and input hashes are in E-04.

The null hypothesis is equality of mean pre-T recency between the two selected visitor groups; the alternative is a two-sided difference. Welch's test does not require equal group variances. The resulting interval is expressed in days, which makes it more interpretable than the p-value alone. Cohen's d standardizes the contrast but does not correct cohort selection. The Wilson interval applies only to the selected mature Ghost/Active visitor set; it should not be called the Ghost rate among all 27,327 visitor IDs or all 97,489 snapshots. These sample definitions are preserved in the API's result metadata so the frontend does not silently mix denominators.

## 5 Regression analysis

### 5.1 Continuous future engagement

The OLS response is future sessions divided by the four-week confirmation horizon. Predictors are four-week pre-T sessions, four-week pre-T views, and recency. Training outcomes mature no later than 3 August 2015, and test snapshots begin 10 August. Test visitors seen in training are removed. This leaves 29,290 training rows from 12,412 visitors and 12,915 test rows.

The multiple OLS model has training R² of 0.372 and test RMSE of 0.718 sessions/week. The sessions-only model has test RMSE of 0.718 at the same precision. Clustered covariance accounts for repeated training visitors. The prior-session coefficient is 0.118 (95% CI [0.094, 0.141]). The adjusted intervals for views and recency include zero. VIFs are at most 1.69. The multiple model predicts negative session rates for 4,047 of 12,915 test rows, limiting its use to an explanatory comparison.

[[TABLE:ols]]

[[FIG:ols_residuals]]

The outcome is nonnegative, skewed and often close to zero, whereas an unconstrained linear model can predict any real number. The negative predictions are therefore a direct model-compatibility failure, not an error to hide by clipping after evaluation. The one-predictor benchmark is nearly as accurate on held-out RMSE, so the additional predictors do not provide a material gain for this particular response. Clustered covariance addresses the uncertainty of coefficients when training snapshots repeat a visitor, but it does not repair the response distribution or identify causal effects. Diagnostic plots and variance inflation factors are supplied to make these conditions visible. A future Poisson, negative-binomial or hurdle comparison would need checks for overdispersion and excess zeros before adoption.

### 5.2 Binary Ghost inference

The separate logistic model uses Ghost = 1 versus all other mature statuses = 0. It includes prior four-week sessions, pre-T recency, and the observation-minus-baseline change in sessions per week. The temporal split purges any training label ending after the validation start and any validation label ending after the test start, then removes visitors seen in earlier partitions. The fitted coefficients use cluster-robust covariance when visitors repeat in training. This sample is deliberately different from the Ghost-versus-Active ML classification task.

The logistic test has 5,816 rows, including 386 Ghost labels (prevalence 0.066). ROC-AUC is 0.671 and PR-AUC is 0.156. The validation-selected threshold of 0.10 yields precision 0.148 and recall 0.373, with 144 true positives, 826 false positives, and 242 missed Ghost rows. The operating point is unsuitable for practical alerts. E-05 contains the coefficients, diagnostics, and input hashes.

[[TABLE:logit]]

[[FIG:logit_roc_pr]]

The logistic task includes Inactive and Recovered as negatives, unlike the primary classifier that compares Ghost only with Active. Its coefficient signs must therefore be interpreted conditionally in a different population, not compared directly with the Ghost/Active descriptive means. The temporal train, validation and test construction purges labels whose confirmation interval overlaps a later partition and removes repeated visitors across partitions. This reduces the sample but better reflects the chronology of information availability. Its selected threshold was chosen on validation F1. Low recall on the later test shows that an above-prevalence PR-AUC can coexist with a poor practical alerting point. No claim of production utility follows from the odds ratios alone.

## 6 Weekly forecasting

For each Monday T, the weekly series divides Ghost labels by known mature Active, Ghost, Recovered and Inactive labels. It contains 10 mature weeks with no missing Mondays. A rate becomes available when its half-open confirmation window ends at or before the forecast origin.

The 10 mature rates support a last-mature-value forecast with two backtest origins. MAE is 0.00828 (0.828 percentage points), RMSE is 0.00841, and sMAPE is 10.10%. The two exploratory future points carry forward the last mature rate of 8.63%. The short history does not support ARIMA selection, and the naive forecast has no prediction interval.

[[FIG:weekly_forecast]]

[[TABLE:forecast]]

The forecast origin requires particular care. The weekly rate associated with a snapshot is computed only after its four-week confirmation horizon ends. At an origin, the latest calendar-week observation is not necessarily the latest *known* rate. The backtest admits only rows with `label_end` at or before the origin and then carries the last mature rate across the resulting delay gap. This avoids using information that would not yet have existed in a real forecast. Two historical origins exercise the rule and give a preliminary error estimate. They cannot establish seasonality or a stable distribution of errors. The unchanging two-week displayed prediction is a consequence of the naive method and should not be mistaken for a stable business process.

## 7 Structural equation modeling status

The STAT3013 outline lists SEM. An SEM result requires a substantive model of latent constructs, identified indicators, measurement quality, and an estimator appropriate to the variables. The available event log has behavioral counts and derived ratios, but no validated satisfaction or attitude measures and no pre-specified latent measurement model. Fitting an arbitrary diagram to those columns would not answer the outline's example question about satisfaction. We therefore report **no SEM coefficient, fit index, RMSEA, or path diagram**. `docs/sem_feasibility.md` records viable questions for the lecturer. If SEM is mandatory, the study needs a defensible model and data before submission; if a justified omission is allowed, the lecturer's decision must be recorded as D-07/E-09. No approval is presumed here.

An SEM path diagram would imply that observed variables measure particular latent constructs and that the direction of each structural relation has a substantive basis. Counts of views, carts and sessions are not automatically validated indicators of satisfaction or customer intention. Reusing the same derived activity measures as both latent indicators and outcomes would invite identification and interpretation problems. The course requirement can be satisfied only through a lecturer-approved scope decision or additional suitable measurement data and a justified model. The report keeps this section explicit so that a reader does not mistake an omitted result for a zero or a failed model. No synthetic questionnaire or invented fit statistic has been inserted to fill the gap.

## 8 Machine learning prediction of the operational Ghost label

### 8.1 Task population and temporal split

The primary supervised task is Ghost versus Active among fully mature rows. Inactive, Recovered, and Unknown rows are excluded from this model comparison. Every candidate uses the same pre-T feature matrix and visitor-disjoint temporal split. The split first chooses later weeks for validation and test, purges labels overlapping subsequent starts, and assigns visitors to only one partition. Preprocessing, including imputation and calibration, is trained without test data. Hyperparameters and the served family are selected using validation PR-AUC; the operating threshold is selected using validation costs, with a stated false-negative cost of five and false-positive cost of one.

The split retains 1,510 training rows (615 Ghost), 352 validation rows (140 Ghost), and 330 test rows (153 Ghost) from the single mature test week of 17 August 2015. The selected XGBoost plus Platt model has PR-AUC 0.910 (95% visitor-bootstrap CI [0.870, 0.939]), ROC-AUC 0.912, and Brier score 0.121. The EDS rule reaches PR-AUC 0.848, ML logistic regression 0.913, random forest 0.920, Decision Tree 0.894, and Gaussian NB 0.808. No-skill PR-AUC equals test prevalence, 0.464. Model selection used validation performance. The visitor bootstrap quantifies uncertainty within the test week and cannot estimate variation across weeks.

[[TABLE:ml_split]]

### 8.2 Shared test comparison and operating threshold

[[FIG:benchmark_pr_auc]]

[[TABLE:models]]

At the validation-selected threshold of 0.09, XGBoost plus Platt catches 151 of 153 Ghost rows and produces 70 false positives. Precision is 0.683, recall 0.987, and F1 0.807. The threshold flags 221 of 330 rows (67%). Because the high and medium cutoffs coincide, this run produces two bands: high and low. The cost ratio is an experimental assumption.

[[FIG:model_pr_roc]]

[[FIG:model_confusion_matrix]]

The threshold comes from an illustrative false-negative cost five times a false-positive cost. These are not measured merchant costs, and the chosen cutoff would generate a substantial review burden. A ranking score and an operational decision rule answer different questions: PR-AUC assesses ordering over possible thresholds, while precision and recall quantify what happens at one threshold. The strong test recall is for the constructed Ghost/Active task only. It does not mean the system finds every genuinely departing customer. Before any use in a business process, an analyst would need an agreed capacity or utility policy, a later external validation period and a separate intervention study.

### 8.3 Calibration, attribution and label dependence

[[FIG:model_calibration]]

The Ghost rule divides future sessions by baseline sessions per week, and baseline-derived features help predict this relative label. Removing the named target components while keeping overlapping history gives XGBoost PR-AUC of 0.899. Restricting XGBoost to ten observation-period features lowers PR-AUC from 0.910 to 0.807. The analogous logistic model reaches 0.808. This gap limits baseline-independent claims. SHAP and permutation importance describe the fitted model.

[[FIG:ablation_pr_auc]]

[[TABLE:ablation]]

[[FIG:importance]]

Platt calibration is fitted using training out-of-fold predictions and kept only if validation Brier score improves. The reliability plot describes the held-out sample but its high-score bins contain few observations, so it is not a certificate that a displayed percentage transfers to new traffic. Attribution is similarly conditional on a fitted model and correlated features; the importance order may move when overlapping windows are changed. The ablation is the more direct integrity check because it asks how much ranking remains when baseline-period counts cannot be reconstructed. Its decrease of approximately 0.103 PR-AUC points is a central finding and belongs beside the headline model score in any slide or demo.

## 9 Application and reproducibility

### 9.1 Research system and API

[[FIG:architecture]]

The application separates a Next.js frontend, a FastAPI backend, processed research artifacts, and an AI inference runtime. Seven API routes serve overview, paginated customers, dated customer detail, statistics, forecast, predictions, and model metrics. The model binary and feature table are read locally. The prediction path checks that the feature row was created before T; an unknown customer returns 404 and invalid date returns 422. The backend refuses model inference when the artifact is absent rather than making up a score. An explicit fixture mode supports interface development and visibly labels its data as illustrative.

[[TABLE:api]]

The interface is deliberately separated from the source of scientific evidence. It reads already computed aggregates and model artifacts through documented contracts. A dashboard percentage is meaningful only with its own denominator and dataset notice; it is not substituted for a statistical result table. The customer detail route uses both visitor ID and snapshot date because one visitor can appear at multiple Mondays. The prediction route also requires that pair. This prevents an ambiguous lookup from silently mixing features from one date with a label or score from another. API errors are part of the demonstration, not exceptional cases hidden from reviewers.

### 9.2 Demonstration and software checks

On 25 November 2026, the real-data run verified all 97,489 detail files and exercised seven API routes. It checked the model hash, a valid prediction, 404 for an unknown ID, and 422 for an invalid date. The Python suite passed 127 tests. Frontend lint and TypeScript checks passed.

[[TABLE:verification]]

The reproducible command sequence is documented in `docs/runbook.md`. A new machine needs the licensed `events.csv` and must run `python -m scripts.prepare_real_demo`; raw and processed customer data and the trained model are not committed. The project should avoid publishing real visitor IDs in screenshots, examples, or repository artifacts. Evidence IDs E-00 through E-11 map report numbers to scripts and aggregate files in `docs/evidence_register.md`.

The demonstration route through the web application is Overview, Customers, dated customer detail, Statistics, Forecast, Predict, and Model Metrics. The interface displays the proposed cohort notice and the model version rather than presenting a score without context. The customer list can be filtered to a Ghost row and the same date carried into prediction. The statistics page gives the visitor-level test alongside descriptive groups, while the forecast page states that its two points come from a naive last-mature-value rule. The model page shows support, prevalence, PR-AUC, calibration and confusion. On a demonstration machine the backend and frontend run locally at ports 8000 and 3000 respectively. The report does not treat a successful browser walkthrough as evidence that the scientific labels are externally valid.

## 10 Discussion and recommendations

### 10.1 Findings by research question

RQ1 finds a large association between pre-T recency and the proposed future Ghost label in the selected independent visitor-level comparison. RQ2 finds that previous session activity helps explain future sessions per week, while the linear model's negative count predictions reveal a poor response distribution fit; the separate logistic model ranks above chance but misses most Ghost cases at its selected threshold. RQ3 finds strong prediction of the relative label with full history, but the observation-only ablation sharply reduces performance. RQ4 produces only a short naive forecast because the number of mature weekly points is small.

These results support a cautious product recommendation: display the score alongside its operational definition, model version, sample support, threshold, and uncertainty. An analyst can use the interface to inspect cohort behavior and generate hypotheses. The current score should not trigger automatic promotions or be treated as a true churn probability. Before any operational trial, the team would need a validated outcome, a cost policy, a more stable temporal test, monitoring under new traffic, and an intervention study that measures benefit and harm. The event log alone does not provide those outcomes.

### 10.2 Decision implications

The strongest usable output today is methodological. A business analyst could use the dashboard to examine whether a proposed relative-activity definition remains stable under a different session rule, threshold, or observation horizon. The score might help prioritize manual investigation within this research cohort, but its threshold would need to be tied to a measured review capacity and false-alert cost. The current five-to-one ratio is an experiment setting, not a merchant policy. A later intervention would require recording which visitors were contacted and comparing outcomes against a valid control group. Without that study, neither an increase in engagement nor a financial return can be attributed to this model.

For the research team, the large difference between full and observation-only PR-AUC is more important than the small ranking gaps among tree methods. It shows that the baseline used in a relative outcome is a substantial source of predictable structure. The team should decide whether the scientific question is to predict the proposed ratio using all available past history, or to detect a new deterioration signal from only the most recent observation window. Both are legitimate but distinct tasks. The report and model card currently present the first as the primary task and the second as a sensitivity analysis. A final submission should record which interpretation the lecturer accepts.

## 11 Limitations and next decisions

Ghost is defined from relative session activity. The 2015 event log does not observe customer intent, and anonymous visitor IDs may not represent durable customers. The 4+2+4 results are sensitive to the gap, threshold, and confirmation duration. The classifier uses baseline history and is tested on one week. The 10-point forecast has two backtest origins and no prediction interval. OLS generates negative rates, and the separate logistic threshold misses most positives. These observational results do not establish causal effects.

Before calling this a final study, the group must document decisions D-01 through D-05 and review the primary 4+2+4 run and report the 4+2+2 comparison separately. The lecturer must clarify D-07 for SEM. The submission also requires a 7–10-page IEEE paper in the official template, slides, a demo video, Turnitin evidence at or below the required similarity threshold, an AI-generation audit and explanation, and working course-system links. This AI-assisted report requires human editing, citation verification, and audit disclosure.

### 11.1 Internal and external validity

The operational Ghost rule is sensitive to session inference, eligible history and the confirmation ratio. Training and test labels come from the same site and historical period, so performance on this held-out task does not establish portability to a new store, current devices, different product categories or different identity tracking. Visitor IDs may not correspond to durable people, and a silent period has several possible explanations. The history rule also excludes many low-activity visitors, limiting the population to which the model could be applied. Temporal and visitor-disjoint evaluation reduces two important leakages but cannot remove a mismatch between the constructed outcome and true customer intent.

### 11.2 Academic and deployment decisions

Several course requirements are outside what repository code can verify. A lecturer must determine whether the SEM requirement permits a documented omission on an event-log dataset or calls for a separate measurement study. The instructor or team must approve the final cohort, label threshold, window design and split before describing the results as final. The institutional submission system, similarity checker and AI-content checker require authenticated human access. The report records their status without inventing screenshots or approvals. A narrated demo video and final class/group repository naming convention also require team-specific information. These are explicit completion items, not missing values to be filled with fictional evidence.

## 12 Conclusion

The project now runs end to end on a verified public event file. Its statistical tests, regressions, forecast baseline, classification comparisons, and web demo can be reproduced locally. The most defensible scientific result is narrower than a product claim: historical baseline activity helps predict the group's relative Ghost rule, but a model restricted to recent observation activity is substantially weaker. The application is ready for a transparent research demonstration, with research approvals and submission evidence still open.

## References

[1] S. A. Neslin et al., “Defection Detection: Measuring and Understanding the Predictive Accuracy of Customer Churn Models,” Journal of Marketing Research, vol. 43, no. 2, 2006, doi:10.1509/jmkr.43.2.204.

[2] J. Burez and D. Van den Poel, “Handling class imbalance in customer churn prediction,” Expert Systems with Applications, 2009, doi:10.1016/j.eswa.2008.05.027.

[3] T. Saito and M. Rehmsmeier, “The Precision-Recall Plot Is More Informative than the ROC Plot When Evaluating Binary Classifiers on Imbalanced Datasets,” PLOS ONE, 2015, doi:10.1371/journal.pone.0118432.

[4] C. Guo et al., “On Calibration of Modern Neural Networks,” Proceedings of ICML, 2017, <https://proceedings.mlr.press/v70/guo17a.html>.

[5] S. M. Lundberg and S.-I. Lee, “A Unified Approach to Interpreting Model Predictions,” NeurIPS, 2017, <https://proceedings.neurips.cc/paper_files/paper/2017/hash/8a20a8621978632d76c43dfd28b67767-Abstract.html>.

[6] Retailrocket, “Retailrocket recommender system dataset,” Kaggle, version 2, <https://www.kaggle.com/datasets/retailrocket/ecommerce-dataset>.

[7] STAT3013 course team, “Outline Project STAT3013 2026,” course requirements supplied to the project group, 2026.

## Appendix A Reproduction

The exact raw source SHA-256, scenario parameters, event and label schemas, source license, feature list, data processing commands, split manifest, output hashes, model card, and API contract are stored in `data/config/pipeline.json`, `docs/data_dictionary.md`, `docs/runbook.md`, `ai/evaluation/run_summary.json`, `ai/evaluation/model_meta.json`, `docs/api_contract.md`, and `docs/evidence_register.md`. The local `data/processed/manifest.json` carries hashes of ignored processed artifacts. Regenerate the analysis with `python -m scripts.prepare_real_demo`, then rebuild the report figures and Word document with `scripts/build_full_report_assets.py` and `scripts/build_uit_full_report.py`. The model binary is intentionally not in Git; its SHA-256 is recorded in the model metadata.

### A.1 Required source and environment

Obtain the licensed Retailrocket version 2 archive from the cited dataset page and place its verified `events.csv` in `data/raw/`. The pipeline rejects a different byte count or SHA-256. Use a virtual Python environment with `requirements-defense.txt` and the frontend lockfile with `npm ci`; keep the raw file, visitor-level output and binary model outside Git. Reproduction on a new machine is therefore a controlled build, not a simple clone-and-run shortcut. The code and aggregate outputs in the repository show what should be reproduced, while the raw event file must be acquired from its publisher.

### A.2 Ordered build and verification

Run `python -m scripts.prepare_real_demo` from the repository root. The orchestrator runs the data pipeline, exports sensitivity and detail artifacts, computes the visitor-level test, prepares the forecast series, executes the regressions and diagnostics, trains the ML candidates, reruns the two independent baselines, writes aggregate research files, checks schema integrity and calls the seven real API routes. The final smoke check asserts the model binary SHA-256, the feature and label hashes, a valid score, a 404 for an unknown ID and a 422 for an invalid date. Only after those checks should the FastAPI backend and Next.js frontend be started in real mode. The frontend's `NEXT_PUBLIC_API_MODE` and URL values are build-time settings and should be confirmed before the production build. The step-by-step commands are kept in `docs/runbook.md`.

### A.3 Traceability and interpretation

[[TABLE:evidence]]

The evidence register separates source provenance, cohort audit, descriptive statistics, inference, regressions, forecasting, classification, runtime and integration. Reproducing one file in isolation is not sufficient after a change to the label or windows: all dependent outputs, the web demo, report tables and slide figures must be regenerated together. The design log distinguishes an observed result from an unapproved scientific decision. For this report, a number is considered supported only when it appears in a tracked aggregate artifact or a locally rebuilt file whose input hash is recorded. Screenshots document display behavior but do not replace their numerical source tables.

## Appendix B Contributions and scope

The repo attributes the shared data pipeline and cohort audit to Lâm, the regression and forecasting algorithms and backend foundation to Long, the model training/evaluation and inference package to Kiệt, and the frontend integration, Decision Tree benchmark, current end-to-end reproducibility work, inferential adapter, and defense assembly to Thành. The current rerun of teammates' scripts does not transfer their original authorship. Every member should be able to explain the full design, not only their own module.

[[TABLE:roles]]

The contribution map combines the original division of work with the modules and aggregate artifacts currently in `develop`. It is a project record, not a claim that one person authored every rerun. The final signed report should be checked by all four members, especially where a teammate's model output is interpreted outside its original notebook. The team also needs to confirm class and group codes for the required GitHub repository name and the course instructor's preference for SEM treatment.

## Appendix C Submission evidence status

The repository includes a 12-slide defense deck and a seven-page provisional two-column paper draft. The latter still requires transfer to the official IEEE conference template and a pagination check. A narrated demonstration video, Turnitin similarity screenshot, AI-generation audit and the course-system upload records are not available in the research artifacts inspected for this report. The course asks for those materials, but recording them as completed without files would be misleading. The software checks and figures in this report support the local technical demonstration; they do not substitute for academic-integrity evidence or lecturer approval.

"""Create aggregate, reproducible figures for the English full report."""
from __future__ import annotations

import json
import shutil
from pathlib import Path

import matplotlib.pyplot as plt


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "reports/full-report/figures"
OUT.mkdir(parents=True, exist_ok=True)
NAVY, BLUE, TEAL, GREY = "#102c3c", "#14759c", "#3db8a7", "#748891"


def save(name: str) -> None:
    plt.savefig(OUT / name, dpi=220, bbox_inches="tight", facecolor="white")
    plt.close()


def design() -> None:
    fig, ax = plt.subplots(figsize=(9, 2.5))
    config = json.loads((ROOT / "data/config/pipeline.json").read_text(encoding="utf-8"))
    scenario_id = config["preferred_scenario_id"].split("_min", 1)[0]
    scenario = next(row for row in config["scenarios"] if row["id"] == scenario_id)
    widths = [scenario[key] for key in ("baseline_weeks", "observation_weeks", "confirmation_weeks")]
    labels = [f"{name} ({width} weeks)" for name, width in zip(("Baseline", "Observation", "Future label"), widths)]
    colors = [BLUE, TEAL, GREY]
    pos = 0
    for width, label, color in zip(widths, labels, colors):
        ax.barh(0, width, left=pos, height=.5, color=color)
        ax.text(pos + width / 2, 0, label, ha="center", va="center", color="white", fontsize=8.5, weight="bold")
        pos += width
    cutoff = sum(widths[:2])
    ax.axvline(cutoff, color=NAVY, lw=2)
    ax.text(cutoff - .1, .57, "T: score issued", ha="right", color=NAVY, fontsize=9, weight="bold")
    ax.set_xlim(0, sum(widths))
    ax.set_ylim(-.7, .8)
    ax.set_yticks([])
    ax.set_xlabel("Weeks; all model features end before T", fontsize=10)
    ax.spines[:].set_visible(False)
    ax.tick_params(axis="x", length=0)
    save("study_design.png")


def cohort() -> None:
    labels = ["Inactive", "Active", "Recovered", "Ghost", "Immature / unknown"]
    counts = json.loads((ROOT / "data/processed/manifest.json").read_text(encoding="utf-8"))["rows"]["label_status"]
    values = [counts[key] for key in ("inactive", "active", "recovered", "ghost", "unknown")]
    colors = [GREY, BLUE, TEAL, "#df8e50", "#b5c5cc"]
    fig, ax = plt.subplots(figsize=(8, 3.5))
    bars = ax.barh(labels[::-1], values[::-1], color=colors[::-1])
    for bar, value in zip(bars, values[::-1]):
        ax.text(value + 600, bar.get_y() + bar.get_height()/2, f"{value:,}", va="center", fontsize=9)
    ax.set_xlim(0, 79000)
    ax.set_xlabel("History-eligible weekly snapshots; one visitor may contribute multiple rows")
    ax.spines[["top", "right", "left"]].set_visible(False)
    ax.grid(axis="x", color="#e4e8eb", zorder=0)
    ax.set_axisbelow(True)
    save("cohort_status.png")


def recency() -> None:
    audit = json.loads((ROOT / "research/statistics/inference_audit.json").read_text(encoding="utf-8"))
    fig, ax = plt.subplots(figsize=(6.5, 3.6))
    values = [audit["active_mean_days"], audit["ghost_mean_days"]]
    groups = [f"{name.title()} (n={audit[f'{name}_visitors']:,})" for name in ("active", "ghost")]
    bars = ax.bar(groups, values, color=[BLUE, TEAL], width=.55)
    for bar, value in zip(bars, values):
        ax.text(bar.get_x() + bar.get_width()/2, value + .25, f"{value:.2f}", ha="center", fontsize=10)
    ax.set_ylabel("Mean pre-T recency (days)")
    ax.set_ylim(0, 20)
    test = json.loads((ROOT / "research/statistics/results.json").read_text(encoding="utf-8"))["tests"][0]
    interval = f"95% CI [{test['ci_low']:.2f}, {test['ci_high']:.2f}]"
    ax.text(.5, 19.2, f"Difference {audit['mean_difference_days']:.2f} days; {interval}", ha="center", fontsize=9, color=NAVY)
    ax.spines[["top", "right"]].set_visible(False)
    save("visitor_recency.png")


def benchmarks() -> None:
    ml = json.loads((ROOT / "ai/evaluation/run_summary.json").read_text(encoding="utf-8"))
    metrics = json.loads((ROOT / "ai/evaluation/metrics.json").read_text(encoding="utf-8"))
    eds = next(row for row in metrics["comparison"] if row["name"] == "rule_eds")
    def baseline(name: str) -> float:
        return json.loads((ROOT / f"research/baselines/{name}_results.json").read_text(encoding="utf-8"))["test"]["pr_auc"]
    values = {"No-skill fraction": ml["test"]["prevalence"], "Gaussian NB": baseline("gaussian_nb"),
              "EDS rule": eds["test_pr_auc"], "Decision Tree": baseline("decision_tree"),
              ml["selected_model"]["name"]: ml["test"]["pr_auc"]}
    fig, ax = plt.subplots(figsize=(7.5, 3.7))
    bars = ax.barh(list(values), list(values.values()), color=[GREY, "#a6bac4", BLUE, TEAL, NAVY])
    for bar, value in zip(bars, values.values()):
        ax.text(value + .012, bar.get_y() + bar.get_height()/2, f"{value:.3f}", va="center", fontsize=9)
    ax.set_xlim(0, 1.08)
    ax.set_xlabel(f"Test average precision (PR-AUC), shared {ml['test']['support']}-row Ghost/Active test")
    ax.spines[["top", "right", "left"]].set_visible(False)
    ax.grid(axis="x", color="#e4e8eb", zorder=0)
    ax.set_axisbelow(True)
    save("benchmark_pr_auc.png")


def ablation() -> None:
    labels = ["Full feature set", "Named components removed", "Observation-only"]
    metrics = json.loads((ROOT / "ai/evaluation/metrics.json").read_text(encoding="utf-8"))
    rows = {row["feature_set"]: row["test_pr_auc"] for row in metrics["comparison"]
            if row["name"] in ("xgboost", "ablation:xgboost")}
    values = [rows[key] for key in ("full", "no_target_components", "observation_only")]
    fig, ax = plt.subplots(figsize=(7.5, 3.0))
    bars = ax.barh(labels[::-1], values[::-1], color=["#df8e50", TEAL, NAVY])
    for bar, value in zip(bars, values[::-1]):
        ax.text(value + .015, bar.get_y()+bar.get_height()/2, f"{value:.3f}", va="center", fontsize=9)
    ax.set_xlim(0, 1.05)
    ax.set_xlabel("Test PR-AUC; removing baseline history changes the task signal")
    ax.spines[["top", "right", "left"]].set_visible(False)
    ax.grid(axis="x", color="#e4e8eb")
    ax.set_axisbelow(True)
    save("ablation_pr_auc.png")


def architecture() -> None:
    fig, ax = plt.subplots(figsize=(9, 2.7))
    boxes = [(0.0, "Retailrocket\nevents.csv"), (1.2, "Preprocess\nand labels"),
             (2.4, "Analyses\nand models"), (3.6, "FastAPI\nseven routes"),
             (4.8, "Next.js\nresearch UI")]
    for x, label in boxes:
        rect = plt.Rectangle((x, .2), 1.0, .65, facecolor="#e9f4f7", edgecolor=BLUE, lw=1.3)
        ax.add_patch(rect)
        ax.text(x+.5, .525, label, ha="center", va="center", fontsize=9, color=NAVY)
    for x in [1.0, 2.2, 3.4, 4.6]:
        ax.annotate("", xy=(x+.18, .525), xytext=(x+.02, .525), arrowprops=dict(arrowstyle="->", color=NAVY, lw=1.6))
    ax.set_xlim(-.05, 5.85)
    ax.set_ylim(0, 1.1)
    ax.axis("off")
    save("architecture.png")


design(); cohort(); recency(); benchmarks(); ablation(); architecture()
forecast = ROOT / "data/processed/forecasting/forecast.png"
if forecast.exists():
    shutil.copyfile(forecast, OUT / "weekly_forecast.png")
print(f"Wrote {len(list(OUT.glob('*.png')))} figures to {OUT}")

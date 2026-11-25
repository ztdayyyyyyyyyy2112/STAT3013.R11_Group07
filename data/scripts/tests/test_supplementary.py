import pandas as pd
import pytest

from data.scripts.config import DEFAULT_CONFIG
from data.scripts.export_supplementary import _gap_sensitivity, _label_sensitivity


def test_label_sensitivity_keeps_censored_unknown_and_separates_no_purchase():
    labels = pd.DataFrame({
        "visitorid": [1, 2, 3], "snapshot_date": pd.to_datetime(["2015-06-15"] * 3, utc=True),
        "label_end_utc": pd.to_datetime(["2015-06-29", "2015-06-29", "2015-06-29"], utc=True),
        "future_events": [1, 1, 0], "future_sessions": [1, 1, 0], "future_purchases": [1, 0, 0],
    })
    features = pd.DataFrame({
        "visitorid": [1, 2, 3], "snapshot_date": labels.snapshot_date,
        "feature_baseline_sessions_per_week": [4., 4., 4.],
        "feature_observation_sessions_per_week": [1., 1., 1.],
        "feature_baseline_events_per_week": [4., 4., 4.],
        "feature_observation_events_per_week": [1., 1., 1.],
    })
    config = {**DEFAULT_CONFIG, "time": {**DEFAULT_CONFIG["time"], "observed_through": "2015-06-28T00:00:00Z"}}
    rows = _label_sensitivity(labels, features, config)
    session_half = next(row for row in rows if row["engagement_unit"] == "sessions" and row["theta"] == .5)
    assert session_half["counts"] == {"unknown": 3}
    assert session_half["no_purchase_variant_counts"] == {"unknown": 3}


def test_mature_rows_without_active_label_do_not_raise_key_error():
    labels = pd.DataFrame({
        "visitorid": [1], "snapshot_date": pd.to_datetime(["2015-06-15"], utc=True),
        "label_end_utc": pd.to_datetime(["2015-06-29"], utc=True),
        "future_events": [1], "future_sessions": [1], "future_purchases": [1],
    })
    features = pd.DataFrame({
        "visitorid": [1], "snapshot_date": labels.snapshot_date,
        "feature_baseline_sessions_per_week": [4.], "feature_observation_sessions_per_week": [1.],
        "feature_baseline_events_per_week": [4.], "feature_observation_events_per_week": [1.],
    })
    rows = _label_sensitivity(labels, features, DEFAULT_CONFIG)
    session_half = next(row for row in rows if row["engagement_unit"] == "sessions" and row["theta"] == .5)
    assert session_half["no_purchase_variant_counts"] == {"active": 1}


@pytest.mark.parametrize("confirmation_weeks", [2, 4])
def test_gap_sensitivity_recalculates_future_sessions_for_each_gap(confirmation_weeks):
    snapshot = pd.Timestamp("2015-06-15", tz="UTC")
    timestamps = list(pd.date_range("2015-05-05", "2015-05-12", freq="D", tz="UTC")) + [
        pd.Timestamp("2015-06-05", tz="UTC"),
        snapshot + pd.Timedelta(hours=1),
        snapshot + pd.Timedelta(hours=1, minutes=45),
    ]
    if confirmation_weeks == 4:
        timestamps += [snapshot + pd.Timedelta(days=15), snapshot + pd.Timedelta(days=16)]
    events = pd.DataFrame({
        "visitorid": [1] * len(timestamps), "event_time_utc": timestamps,
        "source_row": range(len(timestamps)), "event_type": ["view"] * len(timestamps),
    })
    features = pd.DataFrame({"visitorid": [1], "snapshot_date": [snapshot]})
    labels = pd.DataFrame({
        "visitorid": [1], "snapshot_date": [snapshot],
        "label_end_utc": [snapshot + pd.Timedelta(weeks=confirmation_weeks)],
        "future_events": [confirmation_weeks], "future_sessions": [confirmation_weeks],
    })
    preferred_id = DEFAULT_CONFIG["preferred_scenario_id"].split("_min", 1)[0]
    scenarios = [
        {**scenario, "confirmation_weeks": confirmation_weeks} if scenario["id"] == preferred_id else scenario
        for scenario in DEFAULT_CONFIG["scenarios"]
    ]
    config = {**DEFAULT_CONFIG, "scenarios": scenarios}

    result = {row["gap_minutes"]: row["label_counts"] for row in _gap_sensitivity(events, features, labels, config)}

    assert result[30] == {"recovered": 1}
    assert result[60] == {"ghost": 1}

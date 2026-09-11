#!/usr/bin/env python3
"""Derive collision truth outside the neural adapter and score the feasibility bank."""
from __future__ import annotations

import csv
import hashlib
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "data" / "trials" / "feasibility-v1.json"
TRACES = ROOT / "evidence" / "traces"
OUT = ROOT / "evidence" / "feasibility.csv"

def canonical_hash(value: object) -> str:
    raw = json.dumps(value, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(raw).hexdigest()

def dot(a: list[float], b: list[float]) -> float:
    return sum(x*y for x, y in zip(a, b))

def norm(a: list[float]) -> float:
    return math.sqrt(dot(a, a))

def role_and_clearance(trial: dict, body_radius: float) -> tuple[str, float]:
    obj = trial["object"]
    p, v = obj["position"], obj["velocity"]
    horizon = (trial["durationMs"] - trial["onsetMs"]) / 1000.0
    vv = dot(v, v)
    if vv == 0:
        t = 0.0
        role = "static"
    else:
        t = max(0.0, min(horizon, -dot(p, v) / vv))
        role = "receding" if dot(p, v) >= 0 else "approach"
    closest = norm([p[i] + v[i]*t for i in range(3)])
    clearance = closest - (body_radius + obj["radius"])
    if role == "approach": role = "hit" if clearance <= 1e-12 else "near_miss"
    return role, clearance

def main() -> None:
    bank = json.loads(FIXTURES.read_text())
    trials = {t["id"]: t for t in bank["trials"]}
    truth = {k: role_and_clearance(v, bank["bodyRadius"]) for k, v in trials.items()}
    counts = {r: sum(1 for role, _ in truth.values() if role == r) for r in ("hit", "near_miss", "static", "receding")}
    if counts != {"hit": 4, "near_miss": 4, "static": 1, "receding": 1}:
        raise SystemExit(f"fixture composition is wrong: {counts}")

    params = json.loads((ROOT / "evidence" / "parameters.json").read_text())
    adapter_rows = list(csv.DictReader((TRACES / "adapter-runs.csv").open()))
    if len(adapter_rows) != 100:
        raise SystemExit(f"expected 100 runs, found {len(adapter_rows)}")
    fields = ["trial_id","trial_hash","fixture_role","closest_clearance_m","seed","condition","initial_state_hash",
              "parameters_hash","dt_ms","telemetry_bin_ms","input_onset_ms","first_escape_sim_ms","escaped",
              "lc4_spikes","lplc2_spikes","dnp01_spikes","simulated_duration_ms","wall_compute_ms","trace_file"]
    evidence_rows = []
    failures = []
    seen: set[tuple[str,str,str]] = set()
    for row in adapter_rows:
        path = TRACES / row["trace_file"]
        try:
            trace = json.loads(path.read_text())
            trial = trials[row["trial_id"]]
            expected_hash = canonical_hash(trial)
            if row["trial_hash"] != expected_hash or trace["trialHash"] != expected_hash:
                raise ValueError("trial hash mismatch")
            if trace["parametersHash"] != params["parametersSha256"]:
                raise ValueError("parameter hash mismatch")
            key = (row["trial_id"], row["seed"], row["condition"])
            if key in seen: raise ValueError("duplicate run")
            seen.add(key)
            timestamps = [e["tMs"] for e in trace["populationEvents"]]
            if timestamps != sorted(timestamps): raise ValueError("unordered telemetry")
            role, clearance = truth[row["trial_id"]]
            escape = trace["escapeSimMs"]
            evidence_rows.append({
                "trial_id":row["trial_id"], "trial_hash":expected_hash, "fixture_role":role,
                "closest_clearance_m":f"{clearance:.6f}", "seed":row["seed"], "condition":row["condition"],
                "initial_state_hash":trace["initialStateHash"], "parameters_hash":trace["parametersHash"],
                "dt_ms":trace["dtMs"], "telemetry_bin_ms":trace["telemetryBinMs"],
                "input_onset_ms":trace["inputOnsetSimMs"], "first_escape_sim_ms":"" if escape is None else escape,
                "escaped":str(escape is not None).lower(), "lc4_spikes":row["lc4_spikes"],
                "lplc2_spikes":row["lplc2_spikes"], "dnp01_spikes":row["dnp01_spikes"],
                "simulated_duration_ms":trace["simulatedDurationMs"], "wall_compute_ms":trace["wallComputeMs"],
                "trace_file":str(path.relative_to(ROOT)),
            })
        except Exception as exc:
            failures.append({"run": row, "error": str(exc)})
    with OUT.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields, lineterminator="\n"); writer.writeheader(); writer.writerows(evidence_rows)

    for trial_id in trials:
        for seed in ("41001","41002","41003","41004","41005"):
            pair = [r for r in evidence_rows if r["trial_id"] == trial_id and r["seed"] == seed]
            if len(pair) == 2 and pair[0]["initial_state_hash"] != pair[1]["initial_state_hash"]:
                failures.append({"trial":trial_id,"seed":seed,"error":"paired initial state hashes differ"})
    baseline = [r for r in evidence_rows if r["condition"] == "baseline"]
    hit = [r for r in baseline if r["fixture_role"] == "hit"]
    miss = [r for r in baseline if r["fixture_role"] == "near_miss"]
    hit_escapes = sum(r["escaped"] == "true" for r in hit)
    miss_stays = sum(r["escaped"] == "false" for r in miss)
    intervention = [r for r in evidence_rows if r["condition"] == "sensory_outputs_silenced"]
    sensory_spiking = sum(int(r["lc4_spikes"]) + int(r["lplc2_spikes"]) for r in intervention)
    summary = {
        "status": "complete" if not failures else "failed",
        "runsExpected": 100, "runsValid": len(evidence_rows), "failures": failures,
        "baselineHitSensitivity": {"escaped":hit_escapes,"total":len(hit),"fraction":hit_escapes/len(hit)},
        "baselineNearMissSpecificity": {"stayed":miss_stays,"total":len(miss),"fraction":miss_stays/len(miss)},
        "classificationAcceptance": hit_escapes/len(hit) >= .8 and miss_stays/len(miss) >= .8,
        "interventionSensorySpikes": sensory_spiking,
        "interventionSensoryNeuronsStillSpike": sensory_spiking > 0,
    }
    (ROOT / "evidence" / "summary.json").write_text(json.dumps(summary, indent=2) + "\n")
    (ROOT / "evidence" / "failures.json").write_text(json.dumps(failures, indent=2) + "\n")
    print(json.dumps(summary, indent=2))
    if failures: raise SystemExit(1)

if __name__ == "__main__": main()

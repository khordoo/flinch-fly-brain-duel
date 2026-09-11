#!/usr/bin/env python3
"""Build the selected Java engine and generate the paired 100-run trace bank."""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
CANDIDATE = ROOT / "candidates" / "fly-brain-minecraft"
FIXTURES = ROOT / "data" / "trials" / "feasibility-v1.json"
BUILD = ROOT / "build" / "feasibility"
OUT = ROOT / "evidence" / "traces"
FLYB = CANDIDATE / "src" / "main" / "resources" / "connectome" / "malecns-v1.0.flyb.gz"
ENGINE_COMMIT = "6cfa30175003ef25da68a237d5eda958f8047b82"
EXPECTED_DATASET_HASH = "e33df182bed7a6f3ea279daf4790a82b05706d3d41e819a6a80c0473e8c559f3"
ADAPTER_VERSION = "flinch-geometry-v1"
PARAMETERS = {
    "dtMs": 0.5,
    "telemetryBinMs": 5.0,
    "gain": 0.65,
    "spikeLogCapacity": 0,
    "encoder": "SensoryEncoders defaults; non-visual modalities disabled",
    "readout": "first DNp01 spike at or after input onset",
    "backgroundLuminance": 0.5,
    "objectLuminance": 0.05,
    "seeds": [41001, 41002, 41003, 41004, 41005],
    "intervention": "combined LC4 and LPLC2 outgoing transmission silenced",
    "stochasticAlignment": "single SplittableRandom remains aligned because spike reservoir sampling is disabled",
}

def canonical_bytes(value: object) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":")).encode()

def sha_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def run(cmd: list[str], cwd: Path | None = None) -> None:
    print("+", " ".join(cmd), flush=True)
    subprocess.run(cmd, cwd=cwd, check=True)

def main() -> int:
    if not CANDIDATE.exists():
        raise SystemExit("missing candidates/fly-brain-minecraft; clone the pinned commit first")
    configured_home = os.environ.get("JAVA_HOME")
    java_home = Path(configured_home) if configured_home else Path("/opt/homebrew/opt/openjdk")
    java = java_home / "bin" / "java"
    javac = java_home / "bin" / "javac"
    if not java.exists():
        raise SystemExit("OpenJDK not found; set JAVA_HOME or install Homebrew openjdk")
    if subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=CANDIDATE, text=True).strip() != ENGINE_COMMIT:
        raise SystemExit(f"candidate checkout is not pinned to {ENGINE_COMMIT}")
    tracked_changes = subprocess.check_output(
        ["git", "status", "--porcelain", "--untracked-files=no"], cwd=CANDIDATE, text=True
    ).strip().splitlines()
    if tracked_changes != [" M src/main/java/com/fruitfly/brain/LifNetwork.java"]:
        raise SystemExit(f"candidate has unexpected tracked changes: {tracked_changes}")
    reverse_check = subprocess.run(
        ["git", "apply", "--reverse", "--check", str(ROOT / "patches" / "fly-brain-minecraft-output-silencing.patch")],
        cwd=CANDIDATE,
    )
    if reverse_check.returncode:
        raise SystemExit("the frozen output-silencing patch is not applied exactly")
    fixture_data = json.loads(FIXTURES.read_text())
    if len(fixture_data["trials"]) != 10:
        raise SystemExit("fixture bank must contain exactly 10 trials")
    forbidden = {"isHit", "truth", "class", "correctAction", "score"}
    if any(forbidden.intersection(t) for t in fixture_data["trials"]):
        raise SystemExit("neural fixture bank contains a forbidden truth label")

    BUILD.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    for p in OUT.glob("*.json"): p.unlink()
    soma = OUT / "brain-soma.csv.gz"
    if soma.exists(): soma.unlink()
    adapter_csv = OUT / "adapter-runs.csv"
    if adapter_csv.exists(): adapter_csv.unlink()
    runtime = BUILD / "fixtures.tsv"
    with runtime.open("w") as f:
        f.write("id\thash\tonset\tduration\tpx\tpy\tpz\tvx\tvy\tvz\tradius\n")
        for t in fixture_data["trials"]:
            o = t["object"]
            trial_hash = sha_bytes(canonical_bytes(t))
            values = [t["id"], trial_hash, t["onsetMs"], t["durationMs"], *o["position"], *o["velocity"], o["radius"]]
            f.write("\t".join(map(str, values)) + "\n")

    env = os.environ.copy()
    env["JAVA_HOME"] = str(java_home)
    env["PATH"] = f"{java_home / 'bin'}:{env['PATH']}"
    print("+ sh gradlew classes --console=plain", flush=True)
    subprocess.run(["sh", "gradlew", "classes", "--console=plain"], cwd=CANDIDATE, env=env, check=True)
    adapter_classes = BUILD / "adapter-classes"
    if adapter_classes.exists(): shutil.rmtree(adapter_classes)
    adapter_classes.mkdir()
    engine_classes = CANDIDATE / "build" / "classes" / "java" / "main"
    engine_resources = CANDIDATE / "build" / "resources" / "main"
    run([str(javac), "--release", "21", "-cp", str(engine_classes), "-d", str(adapter_classes),
         str(ROOT / "adapter" / "src" / "com" / "fruitfly" / "flinch" / "FlinchTraceAdapter.java")])
    params_hash = sha_bytes(canonical_bytes(PARAMETERS))
    dataset_hash = sha_bytes(FLYB.read_bytes())
    if dataset_hash != EXPECTED_DATASET_HASH:
        raise SystemExit(f"dataset SHA-256 mismatch: {dataset_hash}")
    metadata = {
        "adapterVersion": ADAPTER_VERSION,
        "engineCommit": ENGINE_COMMIT,
        "enginePatchSha256": sha_bytes((ROOT / "patches" / "fly-brain-minecraft-output-silencing.patch").read_bytes()),
        "datasetPath": str(FLYB.relative_to(ROOT)),
        "datasetSha256": dataset_hash,
        "fixturePath": str(FIXTURES.relative_to(ROOT)),
        "fixtureBankSha256": sha_bytes(FIXTURES.read_bytes()),
        "parametersSha256": params_hash,
        "parameters": PARAMETERS,
    }
    (ROOT / "evidence").mkdir(exist_ok=True)
    (ROOT / "evidence" / "parameters.json").write_text(json.dumps(metadata, indent=2) + "\n")
    cp = f"{adapter_classes}:{engine_classes}:{engine_resources}"
    run([str(java), "-cp", cp, "com.fruitfly.flinch.FlinchTraceAdapter", str(FLYB), str(runtime), str(OUT),
         ENGINE_COMMIT, dataset_hash, params_hash, ADAPTER_VERSION])
    print(f"generated {len(list(OUT.glob('*.json')))} traces in {OUT}")
    return 0

if __name__ == "__main__":
    sys.exit(main())

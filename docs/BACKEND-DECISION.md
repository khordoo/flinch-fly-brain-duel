# FLINCH backend decision

**Decision: GO WITH ESCAPE-ONLY MODE.** Use `blendi-remade/fly-brain-minecraft` at commit `6cfa30175003ef25da68a237d5eda958f8047b82` as an offline trace generator. Build **Escape Duel** from the hit trajectories. Do not describe the model as classifying collisions versus near misses, and do not put near misses into a scored human-versus-model round.

This is an engineering feasibility result for one model and parameter set. It is not a measurement of a living fly's reaction time and does not establish biological necessity.

## Why this backend

The selected repository includes a runnable Java LIF engine, an auditable sensory encoder, stable population resolution, a DNp01 escape readout and the complete derived connectome needed to reproduce traces. Its code is MIT licensed. Its bundled `male-cns:v1.0` derivative is CC BY 4.0 with provenance and transformation details in the source repository's `PROVENANCE.md`.

The other inspected candidate, `vaibhavkedarisetti/fruit-fly-lab` at `26672e06427c12c61536ce1bd93dae7442944681`, has useful retinotopic Python and browser implementations, but no tracked software license was found. Its Python path also depends on missing FlyWire source/derived files: the test run ended with 13 passed, 7 failed and 54 errors. Its bundled browser data identifies FlyWire FAFB v783, 139,255 neurons and 3,732,460 retained pairs, but the license and reproducible Python-data path block adoption. Details are recorded in `evidence/inspection-failures.json`.

## Frozen source and model

| Item | Frozen value |
|---|---|
| Engine | `blendi-remade/fly-brain-minecraft` |
| Commit | `6cfa30175003ef25da68a237d5eda958f8047b82` |
| Code license | MIT |
| Dataset | neuPrint `male-cns:v1.0` |
| Data license | CC BY 4.0 |
| Dataset artifact | `candidates/fly-brain-minecraft/src/main/resources/connectome/malecns-v1.0.flyb.gz` |
| Artifact SHA-256 | `e33df182bed7a6f3ea279daf4790a82b05706d3d41e819a6a80c0473e8c559f3` |
| Neurons | 176,422 |
| Connections | 6,287,749 at a minimum weight of 5 synapses |
| Synapses represented | 90,296,905 |
| Soma positions | 141,781, stored in raw 8 nm neuPrint voxel coordinates |
| Retina entries | 9,619 |
| Sensory populations | LC4: 126; LPLC2: 185 |
| Escape readout | First DNp01 spike at or after visual input onset; DNp01 has 2 neurons |

The simulator source of record is `Connectome.java`, `LifConfig.java`, `LifNetwork.java`, `PopulationIndex.java`, `RetinaGeometry.java`, `SensoryEncoders.java`, `SensoryFrame.java` and `MotorDecoder.java` under `candidates/fly-brain-minecraft/src/main/java/com/fruitfly/brain/`. The integration adapter is `adapter/src/com/fruitfly/flinch/FlinchTraceAdapter.java`.

## Input and intervention

The adapter boundary uses meters and milliseconds with +Z forward, +Y up and +X right. For the backend's head convention, it maps forward to backend +x, up to backend +y and right to backend +z, then passes azimuth, elevation, angular diameter, expansion and angular speed to the existing `SensoryEncoders`. It also paints the object's dark disc onto the backend's retina columns. Collision truth is absent from the adapter input and is derived later by `tools/evaluate_feasibility.py` using closest approach.

The selected engine had no outgoing-silencing API. The reproducible MIT-licensed patch at `patches/fly-brain-minecraft-output-silencing.patch` adds `LifNetwork.setOutputSilenced`. A silenced LC4 or LPLC2 neuron still integrates and increments its observable spike count; `emitSpike` returns before scheduling its postsynaptic output. The intervention traces list all affected source body IDs. The intervention bank recorded 216,325 LC4+LPLC2 spikes, confirming that input neurons remained active while their transmission was suppressed.

Random seeds are paired between conditions. The spike reservoir is disabled, so its sampling cannot consume random values after circuit activity diverges. The same ordered calls to the Poisson stimulus generators therefore preserve the stimulus random stream. Initial-state hashes match within every baseline/intervention pair.

## Feasibility result

The frozen fixture bank is `data/trials/feasibility-v1.json`: four geometric hits, four approaching near misses, one static object and one receding object. Five seeds and two conditions produced 100 valid traces with no failed runs. Complete rows are in `evidence/feasibility.csv`; hashes and simulator parameters are in `evidence/parameters.json`; validation failures are in `evidence/failures.json`.

| Baseline measure | Result | Required for classification |
|---|---:|---:|
| Hit sensitivity | 20/20 = 100% | at least 80% |
| Near-miss specificity | 0/20 = 0% | at least 80% |
| Static stays | 5/5 | diagnostic only |
| Receding stays | 5/5 | diagnostic only |

The model responded to every approaching object in the hit and near-miss sets. That behavior fits a looming escape circuit but fails the classification gate. No tuning was performed on the evaluation bank. The implementation must use hit fixtures for a reaction-time duel and reserve near-miss traces for a clearly labeled methods/debug view if they are shown at all.

One verified pair is:

- normal: `evidence/traces/course-01-seed-41001-baseline.json`, escape at 110.5 ms simulation time;
- intervention: `evidence/traces/course-01-seed-41001-sensory_outputs_silenced.json`, no escape (`null`).

The absence of an intervention escape is a model result, not a claim that LC4/LPLC2 are necessary in a living animal.

## Runtime and execution mode

The measured machine was an Apple M1 Pro with 10 logical CPUs, 32 GiB RAM and OpenJDK 25.0.1. The engine used `dt=0.5 ms`, a 5 ms telemetry bin and its default 0.65 global gain. A trace simulates 800 ms. In the final complete run, baseline median wall time was 740.911 ms and p95 was 932.895 ms; silenced median was 672.187 ms and p95 was 1,084.245 ms. This has no safe 16.7 ms frame budget, so FLINCH must say **Precomputed neural replay** and load complete traces before play.

Model latency is `escapeSimMs - inputOnsetSimMs`. Human latency uses the browser's monotonic input clock from the displayed onset. Present the two values side by side, but do not subtract wall-clock trace-generation time from either.

## Frozen game geometry

`data/gameplay-v1.json` freezes the shared body radius at 6 mm and the obstacle radii in the fixture bank at 6 mm. A dodge moves the body 30 mm laterally over 120 ms at constant speed, opposite the obstacle's onset X offset, then holds that position. For a centered obstacle it moves toward +X. The latest guaranteed dodge start is 400 ms after onset. An analytic closest-approach calculation over each piecewise-linear segment handles collision, including exact touching. The verification test confirms that a dodge beginning at that deadline avoids all four hit fixtures. Rendering must interpolate this state and must never decide collision from rendered frames.

The future duel should use the four `hit` rows derived by `tools/evaluate_feasibility.py`. The static, receding and near-miss fixtures are feasibility controls. If the UI needs eight rounds, create additional hit geometries in a separate calibration bank and rerun this gate before scoring them; do not relabel the four failed near misses.

## Renderer data

`evidence/traces/brain-soma.csv.gz` contains the 141,781 available soma positions and body IDs extracted from the selected CC BY dataset. The values remain in raw neuPrint voxels. For display only, center each axis on its finite bounding-box midpoint and apply one uniform scale based on the largest axis extent. Preserve aspect ratio, keep axis mapping documented in the frontend, and label the view **dataset soma positions**. Trace telemetry is population-level LC4, LPLC2 and DNp01 activity; show it as labeled aggregates. Do not light arbitrary soma points as if individual spikes were recorded.

Use the same compact fly mesh, scale and collider in both lanes. Create that game mesh from original geometry; the Minecraft rendering assets are not part of this integration.

## Literal implementation handoff

From the FLINCH repository root on the tested macOS machine:

```sh
brew install openjdk
./tools/install-backend.sh
./tools/prepare-traces.sh
python3 -m unittest tests/test_feasibility.py -v
```

Expected backend test output ends with `BUILD SUCCESSFUL`. The repository currently passes all 55 upstream Java tests. Trace preparation prints `generated 100 traces` and the evaluator reports `runsValid: 100`, `classificationAcceptance: false`, hit sensitivity `1.0` and near-miss specificity `0.0`. The local evidence test ends with `Ran 4 tests` and `OK`.

For the frontend implementation:

```sh
mkdir -p public/data/flinch/traces
cp evidence/traces/*.json public/data/flinch/traces/
cp evidence/traces/brain-soma.csv.gz public/data/flinch/
cp data/trials/feasibility-v1.json data/gameplay-v1.json evidence/parameters.json evidence/summary.json public/data/flinch/
```

Load trace bundles from `/data/flinch/traces/<trace_file>`, using `trace_file` from `evidence/feasibility.csv`. Validate the trial hash, parameter hash, engine commit, ordered timestamps, finite numeric fields and nullable `escapeSimMs` before arming a round. The backend interface is the `TraceBundle` contract in `docs/FLINCH-PLAN.md`; the generated JSON conforms to it and adds `datasetSha256`.

Use `inputOnsetSimMs` as the trace time origin and schedule the simulated action only when `escapeSimMs` is non-null. Replay `populationEvents` in order at 5 ms source resolution. A visual replay may interpolate positions, but it must not alter timestamps or scoring.

| Failure | Recovery action |
|---|---|
| `candidates/fly-brain-minecraft` is missing or at the wrong commit | Run `./tools/install-backend.sh`; it clones, checks out the pinned commit and applies the intervention patch. |
| OpenJDK is missing | Run `brew install openjdk`, then set `JAVA_HOME=/opt/homebrew/opt/openjdk` if Java is installed elsewhere. |
| Dataset SHA mismatch | Delete the candidate checkout and rerun `./tools/install-backend.sh`; do not generate or play traces. |
| A trace or parameter hash does not match | Rerun `./tools/prepare-traces.sh` and copy the complete output set together; never mix generations. |
| `escapeSimMs` is `null` | Render a stay/no-escape outcome; never coerce it to zero. |
| Soma file cannot be decoded | Block the brain panel with a useful error; the duel may proceed only if it is relabeled as having unavailable neural visualization. |
| A proposed new fixture has no validated trace | Keep it out of scored play and rerun this feasibility workflow with a newly versioned fixture bank. |

Stop here for Phase 1. The next implementation task should build the side-by-side experience in `docs/FLINCH-PLAN.md` using this escape-only, precomputed backend decision.

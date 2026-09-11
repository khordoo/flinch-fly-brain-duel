# Candidate repo investigation — which backend for FLINCH

Date: 2026-09-11 · Scope: quick comparative investigation only. This is **not** the `BACKEND-DECISION.md` deliverable required by `docs/FEASIBILITY-PROMPT.md` — that still requires executed experiments and evidence. Nothing here overwrites existing work.

## Verdict (objective)

**Recommended primary: `fly-brain-minecraft`** — everything needed for the feasibility experiments is runnable today, with clean licenses and data bundled; its one missing mechanism (output silencing) is a small, already-drafted, verifiable patch.

**`fruit-fly-lab` is the scientifically purer fit** (exact-geometry encoder, native tested silencing, an experiment that is nearly the required protocol verbatim) but is currently blocked by two hard practical issues: **no code license** and **a gated manual data download** — nothing in it can run locally until the data is obtained.

If the FlyWire data download succeeds **and** the license question is resolved (author permission, or strict run-only-no-copy use), fruit-fly-lab becomes the stronger choice. Conditions for flipping are listed at the end.

## Evidence compared against FEASIBILITY-PROMPT criteria

| Criterion | fly-brain-minecraft @ `6cfa301` | fruit-fly-lab @ `26672e0` |
|---|---|---|
| Code license | **MIT** (`LICENSE` present) | **None — no LICENSE file.** All rights reserved; copying/adapting not permitted without author permission |
| Data license | male-cns v1.0 (neuPrint), **CC BY 4.0** | FlyWire FAFB v783, **CC BY-NC-SA 4.0** (non-commercial, share-alike — obligations attach to distributed derived traces) |
| Data availability | **Bundled in repo**: `src/main/resources/connectome/malecns-v1.0.flyb.gz` (22 MB), committed, rebuildable via `tools/` | **Not included.** Requires FlyWire account sign-in; "cannot be scripted" per its own README. `data/derived/` is **empty locally** — no experiment can run today |
| Headless operation | Yes — Gradle `brainBench`, `visionBench`, `embodiedBench` run without Minecraft; compiles locally (`build/classes` present) | Yes — Python, headless-first; `experiments/` are CLI-runnable (once data exists) |
| Sensory encoder (looming) | Analytic "painted" object channels onto LC4/LPLC2 (disclosed limitation); arbitrary object az/el/size/expansion accepted via `SensoryFrame.VisualObject` | **Exact geometry**: θ(t)=atan(l/d(t)), l/\|v\| parameterization from published experiments + retinotopy-derived receptive fields (`simulation/stimuli/looming.py`, `brain/sensory/retinotopy.py`) |
| Escape readout | LC4/LPLC2 → DNp01 (Giant Fibre) → **TTMn motor neuron** (full CNS incl. VNC; readout reaches real motor neurons) | LC4/LPLC2 → DNp01 (GF); **brain-only dataset, no VNC** — GF→motor output is largely electrical and absent; readout must stop at descending neurons |
| Intervention mechanism | **Not native.** Patch drafted at `patches/fly-brain-minecraft-output-silencing.patch`, already applied in working tree (+14 lines in `LifNetwork.java`): spikes recorded, outgoing transmission suppressed — exactly the required semantics. Needs verification via benches | **Native and tested**: `engine.silence()` implements Shiu et al. `silence()`; `test_silenced_neurons_still_spike_but_send_nothing` and `test_silencing_lc4_and_lplc2_abolishes_the_giant_fibre_response` prove it. `experiments/02_escape_controls.py` runs looming/receding/static ± LC4/LPLC2/both — nearly the exact required protocol |
| Determinism | Seeded (`SplittableRandom`, `cfg.seed`) | Seeded (`np.random.default_rng(seed)`) plus a cross-engine determinism verifier |
| Timestep / speed | dt 0.5 ms; 25–60 ms compute per 50 ms sim on 32 cores (≈ real-time; offline can run at compute speed) | dt 0.1 ms; ~10× slower than real time (300 ms trial ≈ 3 s wall). 100-run smoke ≈ ~5–10 min — acceptable offline |
| Population identifiers | neuPrint body IDs preserved; queryable by type/annotation | FlyWire root IDs preserved; queryable by cell type |
| Anatomy for neural panel | Real soma positions included | True anatomical coordinates included |
| Tests | 56 JUnit tests | 74 pytest tests (incl. data-provenance checksums, biological invariants) |
| Neuron count claim | README: 176,422 simulated (male-cns CNS) — must be verified against loaded graph, not baked into branding | 139,255 (FlyWire brain) — verified by its own test suite, but only after data download |

## Key risks per candidate

**fly-brain-minecraft**
- Near-miss discrimination is unproven: the analytic encoder responds to object size/expansion at a given az/el, so lateral-offset near misses *should* produce weaker/spatially shifted LC4/LPLC2 drive, but the 80% hit / 80% near-miss engineering target must be demonstrated in the smoke test. If it fails → Escape Duel mode (as the prompt prescribes).
- The silencing patch is ours, not upstream — it must be verified (baseline vs. silenced bench runs) before any trace is trusted.
- Looming drive is admittedly hand-built; FLINCH permits this only with the "Modeled visual input → connectome simulation" disclosure.

**fruit-fly-lab**
- **Blocker 1 (legal):** no LICENSE. We may clone and run it locally for evaluation, but cannot copy, adapt, or redistribute code without the author's permission. An adapter that imports it sits in a gray zone for a shipped product.
- **Blocker 2 (operational):** data requires a manual FlyWire account download (~1.5 GB, gated, unscriptable); `data/derived/` is empty here, so not even `experiments/02` can run today.
- **Constraint:** CC BY-NC-SA on the data — fine for a non-commercial demo, but share-alike/non-commercial terms attach to distributed trace bundles; must be labeled.
- Readout ends at descending neurons (no VNC/motor neurons); the GF's electrical output is absent by dataset limitation.

## Recommendation and flip conditions

Proceed with **fly-brain-minecraft** for the feasibility phase:

1. It is the only candidate where the prompt's first instruction — "get the smallest relevant native/headless experiment running" — can be executed immediately (data bundled, benches headless, project compiles, silencing patch already applied).
2. Its weaknesses are disclosed, small, and testable; FLINCH's honesty labels explicitly accommodate a modeled visual encoder.
3. Clean licenses (MIT / CC BY 4.0) remove legal risk from the two-day budget.

Flip to **fruit-fly-lab** if both of these become true:
- the author grants explicit reuse terms (or the user confirms run-only use is acceptable for this project), **and**
- the FlyWire v783 download completes and `pytest tests/` passes locally.

Also flip (to Escape Duel mode, or to fruit-fly-lab if unblocked) if the fly-brain-minecraft smoke test fails the 80%/80% hit/near-miss target or the silencing patch cannot be verified.

## Not verified here (deferred to the feasibility task)

- No experiment was executed for this report; all performance/timing numbers are README claims or source inspection.
- Actual loaded neuron counts, near-miss sensitivity/specificity, stochastic stream alignment under intervention, and measured wall-clock costs on this machine remain to be measured per `docs/FEASIBILITY-PROMPT.md`.

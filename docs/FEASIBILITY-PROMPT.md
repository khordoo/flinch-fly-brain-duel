# Phase 1 prompt — freeze a backend for FLINCH

You are evaluating the neural integration for the product specified in `docs/FLINCH-PLAN.md`. Read that file. Preserve its side-by-side product direction. Your job is to remove uncertain engineering decisions before a less capable model implements the UI.

## Scope

Inspect these two candidate repositories at pinned commits:

1. https://github.com/blendi-remade/fly-brain-minecraft
2. https://github.com/vaibhavkedarisetti/fruit-fly-lab

Treat README statements as hypotheses. Confirm code and data licenses, model assets, dependencies, source paths, simulator timing, sensory encoder, escape readout, population identifiers, intervention mechanism and telemetry. Do not assume that either project has a drop-in API or portable renderer. Do not copy unlicensed code/assets.

Spend the initial investigation on getting the smallest relevant native/headless experiment running, not launching an entire game. Record failed commands and actionable blockers. Investigate Doomfly or desktop-fly only if both first candidates fail for a stated reason. Do not create remote forks or deploy anything.

## Required experiments

Construct a deterministic ten-trajectory bank: four direct hits, four near misses with varied lateral offset, one static object and one receding object. Derive truth from geometry outside the adapter. Keep the observer fixed until escape. The neural input must use the existing geometry/visual encoder and must not see the truth labels.

Run each trajectory in baseline and verified combined sensory-output-silenced conditions using five seeds with matched initial state and seed for each pair. This is a 100-run feasibility smoke test, not a biological validation study. If compute is costly, prove one baseline/intervention pair first, measure cost, then finish the bank through offline generation. Do not substitute a single favorable run.

Record trial hash, seed, initial state, encoder parameters, simulation timestep, telemetry interval, input onset, first valid escape trigger, per-population spike counts, action outcome, simulated duration and wall-clock duration. Include no-escape outcomes as null; never coerce them to zero latency. Verify stochastic stream alignment or document its limitation under intervention.

Report baseline hit sensitivity and near-miss specificity, both counts and fractions. For this prototype only, classification mode requires at least 80% hit escapes and 80% near-miss stays across the tested seeds; this is an explicit engineering acceptance target, not a scientific standard. Freeze parameters before the evaluation bank; use separate calibration trajectories for any justified tuning and log all tuning. Do not maximize advantage over a human.

If the target fails, select Escape Duel and remove near-miss claims from the implementation decision. Do not solve classification by feeding collision truth into neurons.

For the intervention, check the actual code suppresses outgoing transmission or the explicitly documented neural mechanism. Distinguish input neurons still spiking from their outputs being silenced. Do not infer a biological necessity claim from one network model.

## Deliverables

1. `docs/BACKEND-DECISION.md`: one selected backend or concrete blocker, exact commit, dataset/version and counts, code/data licenses, target machine, commands actually executed, measured performance, source files/classes, caveats and supported game mode.
2. `evidence/feasibility.csv` plus machine-readable complete parameters and failed runs.
3. The smallest working adapter script and at least one normal/intervention TraceBundle pair conforming to FLINCH-PLAN.md, with hashes and provenance.
4. Frozen collision/dodge game parameters, units and coordinate transforms, fixture bank path, renderer data source, and explicit integration commands.
5. A literal implementation handoff: install command, prepare-traces command, frontend data path, backend interface, tests, expected output and recovery action for each known failure. No placeholder paths, speculative reuse percentages, or recommendation scores.

## Decision rules

- Prefer the candidate with reproducible traces, interpretable sensory input and a verifiable intervention over a candidate with a more attractive existing game.
- Keep the engine in its original language. Default to offline trace bundles. Choose live execution only with measured headroom on the target machine and a documented synchronization strategy.
- Use one simulated contestant; the human is not a second simulated brain. The later intervention comparison may be computed sequentially.
- Do not hardcode a neuron count, a 50ms interval, or latency from the old discussion; inspect the chosen checkout.
- Conclude GO, GO WITH ESCAPE-ONLY MODE, or BLOCKED, with executable evidence.
- Stop after this integration gate. This prompt does not authorize the full UI implementation. The next task will implement FLINCH-PLAN.md against the frozen backend decision.

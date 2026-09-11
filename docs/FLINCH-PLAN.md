# FLINCH — You vs. a simulated fly brain

> Phase 1 is complete. The frozen result is **GO WITH ESCAPE-ONLY MODE** using precomputed traces. Implement this plan together with [`BACKEND-DECISION.md`](BACKEND-DECISION.md); where the earlier classifier concept conflicts with that measured decision, the backend decision controls.

Revised product and implementation brief · 11 September 2026

## How to use this handoff

Give the implementing model this document and `docs/FEASIBILITY-PROMPT.md`. Run the feasibility task first. The design below is decided; the neural backend is not yet verified. Do not ask the implementer to redesign the product, select among five architectures, and validate neuroscience simultaneously.

After feasibility, attach its `BACKEND-DECISION.md` and evidence files to this brief. That decision must provide the exact repository commit, source paths, commands, adapter implementation and supported modes. Until then this is a product specification, not a claim that the simulator works.

The two-day target is a scope budget, not a promise. If setup consumes the budget, deliver the validated experiment and a smaller honest presentation.

## 1. The product decision

Build **FLINCH**, a short, side-by-side collision-avoidance duel. The public subtitle is **You vs. a simulated fly brain**. The on-screen question is **Would you dodge?**

Two identical flies see the same approaching object. One is controlled by the human's Space key. The other escapes when the selected simulated neural readout triggers. Each contestant either stays or performs the same fixed dodge; neither steers freely or shoots.

The distinctive sequence is **compete → inspect → intervene → replay**. After a short duel, replay one recorded threat with the normal circuit and a circuit with selected outputs silenced. Show whatever result occurs, including an unchanged result. Never script a collision as the expected consequence.

This is a proposed creative direction, not a claim that no one has made a similar demo. Avoid “world first.”

## 2. What changes from the original plan

| Original ambiguity | Locked decision |
|---|---|
| Two flies somewhere, split screen, or a separate brain sidebar | Equal side-by-side arenas above one shared neural panel |
| Reaction speed determines winner | Correct decisions and survival determine score; timing is separately labeled |
| Many ablation buttons | One verified sensory-output intervention plus restore |
| Optional live camera | Cut from this release |
| Five possible architectures | Existing engine in its native language → trace adapter → independent browser presentation |
| Live simulation preferred regardless of cost | Reliable, explicitly labeled precomputed traces are allowed and preferred if real-time performance is uncertain |
| Broad investigation across four projects | Two serious candidates; bounded fallback search only if both fail |
| Example millisecond values | No invented numbers in production; missing values display an em dash |
| Large report with speculative scores/reuse percentages | Executable evidence, exact integration steps, one decision |

## 3. Visual composition

Primary recording canvas: 1600 × 1000, aspect ratio 8:5. This is an art-direction choice, not a platform requirement. Also fit a 1280 × 800 desktop window. Do not build vertical export in v1.

Approximate height allocation: 9% title/status, 57% arenas, 26% neural panel, 8% actions/results. The arenas are exactly equal width. Avoid three narrow columns: they make both the game and brain difficult to read in a feed.

```text
 FLINCH       You vs. a simulated fly brain             03 / 08
 ┌───────────────────────────┬───────────────────────────┐
 │ YOU                       │ SIMULATED FLY             │
 │                           │                           │
 │       approaching object  │       approaching object  │
 │              ◉            │              ◉            │
 │                           │                           │
 │            fly            │            fly            │
 │       SPACE TO DODGE       │       NEURAL CONTROL      │
 └───────────────────────────┴───────────────────────────┘
  ANATOMICAL VIEW       LC4 ───┐       event timeline
  sourced coordinates         ├→ escape readout
                       LPLC2 ─┘       trigger marker
  [Next trial]  [Inspect replay]        trace/provenance label
```

Palette: charcoal `#090D14`, off-white `#EEF3FA`, muted text `#A8B6C9`, human cyan `#66DEFF`, simulated fly amber `#FFC578`. Red `#FF6B70` is reserved for a revealed collision or intervention. Use position and text alongside color.

Use a fixed, slightly elevated rear camera looking along a dark flight corridor. Both cameras use identical local position, field of view, exposure and projection. Use a few perspective rails and particles for depth; keep obstacle silhouettes clean. A brushed metallic sphere or simple angular rock is sufficient. Neither obstacle color nor a targeting reticle may reveal hit/near-miss truth before resolution.

Flies should have recognizable silhouettes: compact body, two broad translucent wings, small legs. Use the same mesh, scale, dodge and collision body for both. Only accent color and label differ. Never compare a spaceship against a fly with different geometry.

Do not make decorative star fields, camera shake, a rotating brain or flashing telemetry compete with the approaching object. Both cameras remain fixed during measured trials. The neural panel may show anatomy during play, but dynamic spikes and opponent actions are revealed only after the human has committed or the response window has ended. This prevents the human using the simulated fly as an advance warning. A display label may say “Opponent revealed after your decision.”

After resolution, replay the exact recorded opponent action and neural events at their actual timestamps. This is a presentation replay; it does not rerun or overwrite the original measurement.

At the 1600-pixel recording width, target 44–52px title, 30–36px contestant/result labels and at least 22px essential captions. Check the recording at half size. Use a system sans-serif and tabular numerals. No tiny Hz dashboards.

The neural panel must use dataset coordinates if labeled anatomical. Render all available soma positions dimly if practical; map brighter events to recorded neuron IDs. If only population telemetry is available, use explicitly labeled population aggregates. Do not distribute random sparkles across a brain and call them spikes. Use `LC4` and `LPLC2` as parallel inputs where supported, not an invented serial LC4 → LPLC2 circuit. Confirm names and connections against the chosen backend.

## 4. Round rules and controls

One input: **Space = dodge**. Also provide a large Dodge button for pointer/touch. Record input method; do not pool methods in timing summaries. Ignore keyboard auto-repeat. A held key before onset is not a fresh response.

The human chooses only whether and when to dodge. The dodge is a fixed upward translation perpendicular to the obstacle corridor, equal for both contestants. The locked backend decision must confirm whether this is an engineered display/action mapping; do not describe it as a simulated body or a biologically decoded direction.

The obstacle path is defined relative to the undodged fly. The neural simulation receives the same undodged viewpoint as the human's stimulus until its escape decision. End sensory decision processing after the first escape trigger; this avoids claiming a closed-loop flight simulation. Dodge animation does not secretly change the neural stimulus.

Use an explicit state machine:

`loading → ready → practice → armed → running → resolved → replay → next/summary`

- `loading`: prepare assets and all necessary traces before enabling Start. Show actual progress/error.
- `practice`: two unscored examples explaining stay/dodge. Same input and timing mechanics as the duel.
- `armed`: require key release, then a seeded foreperiod of 0.8–1.6 seconds. No countdown predicts onset.
- `running`: one object per arena; up to 2 seconds of stimulus. Log the first valid human response. Both contestants continue to their own outcomes even if the other has already failed.
- `resolved`: reveal HIT COURSE or NEAR MISS, both outcomes and the model action. Hold for 0.6 seconds, after the measurement ends.
- `replay`: optional 0.25× presentation replay with neural event markers. Never collect scores or latency during replay.
- `summary`: show correct decisions / valid trials, collisions and unnecessary dodges. Separate human elapsed input time from model latency. Allow one “Inspect circuit” action.

Use eight scored trials: four hit courses and four near misses, with seeded order unknown to the player. The exact geometry, speed and size values must come from the validated fixture bank. Include left/right offsets, but avoid simultaneous objects. Do not progressively retune the neural model to keep a close score.

If near-miss discrimination fails feasibility, ship **Escape Duel** instead: eight validated direct-hit trials, compare escape success, drop bluff language and classification scoring everywhere.

### Scoring

| Ground truth before dodge | Action/outcome | Points |
|---|---|---|
| Hit course | Dodged in time and avoided collision | +1 |
| Hit course | No escape or late escape ending in collision | 0 |
| Near miss | Stayed | +1 |
| Near miss | Dodged unnecessarily | 0 |

Every trial is worth one point. Staying forever and dodging everything each score at most four of eight in the balanced mode. Ties remain ties. Do not use timing to break a score tie between unlike measurement systems.

If input occurs during the armed foreperiod, restart that trial as an unscored false start. During a running trial, record early responses without inventing an anticipation cutoff. If focus is lost or presentation has a frame gap over 50ms during the response window, invalidate the trial, preserve its log, and offer a replacement fixture of the same class. Do not silently discard slow human results.

## 5. The memorable replay

At the end, let the user select a recorded threat. Default to the first valid hit-course trial, not whichever trial makes the most dramatic claim.

Switch the arena labels to **NORMAL CIRCUIT** and **SELECTED OUTPUTS SILENCED**. This mode compares two simulations; it is no longer the human duel. Show the same trajectory, initial state and random seed. On restoration, replay the original baseline again. Keep the human's previous result in a small explicitly historical caption only if useful.

One intervention button: **Silence looming inputs**. Its detail label lists the actual affected cell types and count returned by the backend. Prefer combined LC4/LPLC2 output silencing if verified. Do not promise LPLC2 alone abolishes escape. Silencing can suppress outgoing transmission while cells still spike: visualize the actual intervention mechanism, not necessarily blacked-out neurons.

Use a shared simulated-time cursor to connect input activity, escape readout, trigger and action. Slow-motion changes playback rate only. Add a vertical trigger marker rather than dense live charts.

If intervention weakens, delays, preserves or eliminates escape, report that result. A null result remains visible. The same-seed comparison helps demonstration reproducibility; it is not statistical proof. Keep repeated-seed validation results in the evidence, and describe this as an intervention in the model.

## 6. Timing and scientific boundaries

The central claim is: **a connectome-based model supplies one contestant's escape decision**. Do not claim an intact living fly has the displayed latency, that Google built this game, that all neurons are active, or that a winner demonstrates general intelligence.

Display only verified metadata: dataset name/version, retained/simulated neuron count, visualized count and simulation mode. Counts in the old conversation are inconsistent; do not bake 166K or 176K into branding.

Use separate values:

- `Human input: N ms elapsed` — first rendered stimulus frame to input event, measured with a monotonic browser clock; this is not hardware-calibrated reaction time.
- `Model escape: N ms simulated` — encoder-defined onset to the first valid escape trigger in neural simulated time.
- `Run speed: × biological time` — developer/evidence view only.

Round values to actual timing resolution. Do not display 0.1ms precision when the adapter samples actions every 50ms. If onset definitions cannot be aligned, omit a millisecond race and retain separate diagnostic timing in replay.

If the model injects currents/rates directly into LC4/LPLC2, say **Modeled visual input → connectome simulation → assigned dodge** in the methods drawer. Do not show a photoreceptor-to-motor cascade as though it were actually simulated.

Use one persistent plain-language mode label: **Live neural simulation** or **Precomputed neural replay**. Include it in the recording. Distinguish **Illustrative preview** fixtures used to develop the UI; never allow them into a scored production duel or export.

## 7. Locked integration architecture

Default frontend: TypeScript + Vite + Three.js with a DOM overlay. Use one canvas and two equal scissored arena views. Existing renderer assets may be reused when compatible and licensed; do not port a Minecraft renderer wholesale. This stack is a proposal to verify at implementation time, not a claim about existing repository APIs.

Keep the chosen neural engine in its existing language. Add the smallest headless adapter that consumes trial definitions and emits deterministic trace bundles. Do not rewrite the LIF engine in TypeScript for convenience. No WebSocket is needed for the baseline trace mode.

Start with prepared traces unless the feasibility report demonstrates live stepping on the target machine with headroom. Precompute the entire bank before the duel. Randomize which unseen fixture the human receives. A fixed obstacle path and a one-shot escape decision make this honest if labeled; arbitrary new user-authored trajectories are out of scope.

Truth/scoring belongs in an evaluator, not the neural adapter. The adapter receives sensory geometry, not `isHit`, score, human input or the correct action. It must not read the result of a game-level collision predictor to drive the escape neuron.

Proposed new files, to be reconciled once against the real project tree:

```text
src/trials/types.ts           shared schema and validators
src/trials/catalog.ts         fixture bank and deterministic shuffle
src/experiment/runner.ts      state machine and clocks
src/experiment/scoring.ts     truth and outcome scoring only
src/experiment/input.ts       first valid key/pointer response
src/brain/trace-player.ts     ordered neural events, no fabricated output
src/render/arena.ts           camera, obstacle, fly and collision animation
src/render/brain.ts           sourced coordinates and recorded activity
src/ui/overlay.ts             labels, results, controls, mode disclosure
src/replay/controller.ts      seek and speed; no measurement side effects
tools/prepare-traces.*        native backend adapter wrapper
data/trials/                  committed or documented downloadable fixtures
docs/BACKEND-DECISION.md      actual paths, commits and run commands
docs/METHODS.md               input/readout assumptions and time definitions
```

Minimum schema contract (a design contract, not an assertion of existing APIs):

```ts
type Vec3 = [number, number, number];
type TrialDefinition = {
  id: string; version: 1; seed: number;
  onsetMs: number; durationMs: number;
  object: { position: Vec3; velocity: Vec3; radius: number };
  observer: { position: Vec3; forward: Vec3; up: Vec3 };
  bodyRadius: number;
};
type TraceBundle = {
  trialHash: string; initialStateHash: string; seed: number;
  dataset: string; datasetVersion: string; engineCommit: string;
  parametersHash: string; encoderVersion: string; readoutVersion: string;
  simulatedNeurons: number; visualizedNeurons: number;
  dtMs: number; telemetryBinMs: number; triggerResolutionMs: number;
  inputOnsetSimMs: number; escapeSimMs: number | null;
  intervention: { mechanism: string; neuronIds: string[] } | null;
  populationEvents: Array<{ tMs: number; population: string; spikes: number }>;
  neuronEvents?: Array<{ tMs: number; neuronId: string }>;
  wallComputeMs: number; simulatedDurationMs: number;
};
```

Require finite numbers, ordered timestamps, known IDs and matching hashes. Define coordinates as meters, time as milliseconds, forward as +Z and up as +Y in the adapter boundary, or explicitly transform the backend's units once. Reject mismatches instead of silently playing another trace. Missing neural data must block the duel with a useful error.

Keep scoring metadata in a separate evaluator record derived from the trajectory and undodged collision body. Use closest approach over the trial interval to classify the original path, and swept collision detection to judge actual escape; no frame-dependent tunneling. Freeze the dodge duration/distance and collider settings in the backend decision after demonstrating that the fixed dodge avoids all designated escapable hit fixtures and does not turn near misses into accidental hits. These are game rules and must be identical for both contestants.

## 8. Build milestones for the implementer

Implement in this order. Finish the acceptance check before expanding scope. Do not run an open-ended redesign.

1. **Backend gate.** Follow FEASIBILITY-PROMPT.md. Deliver evidence and one frozen integration decision. No production UI until at least one real escape trace and one matched intervention trace can be generated.
2. **One real trial.** Load one verified trace; render equal views, shared stimulus and Space response. Accept when both lanes use the same trajectory hash and the model's action timestamp comes from the bundle.
3. **Complete duel.** Add the state machine, practice, eight fixtures, scoring, input reset, invalidation and summary. Test always-stay, always-dodge, late dodge, held key, tab loss and repeat play. Never test victory using invented neural latency.
4. **Replay and intervention.** Reuse the original trial and seed. Switch labels, load matched normal/silenced traces, allow quarter-speed replay and restore. Verify the intervention changes backend transmission, not the UI dodge flag.
5. **Visual polish.** Match the composition above; add restrained depth, sourced brain positions, readable captions and a brief outcome freeze. Inspect at 1600×1000, 1280×800 and half-size playback. Do not add bloom that washes out labels.
6. **Recording readiness.** Add a clean presentation mode, local result JSON download and an exact replay link/state within the app. Record a real 25–35 second sequence with an external screen recorder. No posting, publishing or public leaderboard is part of this handoff.

Essential verification includes deterministic same-seed reproduction; no access to truth labels by the adapter; normal vs intervention provenance; trace mismatch rejection; collision outcomes independent of render frame rate; null escape handling; and correct separate clocks. Run meaningful backend tests already provided by the selected project.

Performance target: smooth 60fps presentation at the recording size on the actual machine. Measure it. If neural rendering hurts frame pacing, reduce displayed points/events with a disclosed sampling policy; do not reduce the simulated graph silently. Precomputed mode removes live-engine speed from input timing but does not remove browser/display timing limitations.

## 9. Suggested X clip

| Seconds | Picture and caption |
|---|---|
| 0–3 | Two flies, clean title: “Would you dodge?” Persistent “simulated fly brain” subtitle. |
| 3–10 | One real hit-course trial and one near miss if supported. Human commits; then model action and result reveal. |
| 10–15 | “What triggered its escape?” Slow replay aligns the approaching object, recorded neural events and action marker. |
| 15–25 | “Same threat. Selected neural outputs silenced.” Normal/silenced simulation comparison, actual result shown. |
| 25–32 | Restore and replay baseline. Finish with actual score or observed intervention result. |

Sound is optional reinforcement: brief object pass, muted impact, distinct escape click. The whole clip must make sense muted. No fabricated heartbeat or voice-over is required.

Suggested post framing, only after validation: “I built a dodge duel against a simulated fruit-fly circuit. Then I replayed the same threat with part of that circuit silenced.” Add actual observation and code/source credits. Do not promise “the fly beats humans.”

## 10. Cut list and fallback ladder

Cut free steering, shooting, camera input, RL, multiplayer, accounts, leaderboards, procedural levels, mobile timing competition, five intervention modes, automatic video export and a new neural simulator.

If near misses fail: Escape Duel. If live execution fails: labeled precomputed replay. If detailed anatomy is unavailable: a clearly schematic population view. If latency alignment fails: outcomes/decisions only. If the intervention produces no change: report the null result and investigate; do not force it. If neither backend can produce trustworthy traces: deliver a visibly illustrative visual prototype and the blocker report, without presenting it as a working neural game.

## Source status

The project pages were checked on 11 September 2026; these are README claims, not local benchmark results:

- [Fly Brain Minecraft](https://github.com/blendi-remade/fly-brain-minecraft) describes a MaleCNS engine, neural activity displays and a hand-built looming drive into the escape pathway. It currently reports 176,422 simulated neurons; the adapter must verify its actual loaded graph.
- [Fruit Fly Laboratory](https://github.com/vaibhavkedarisetti/fruit-fly-lab) describes geometry-driven input, traces and combined LC4/LPLC2 output silencing. It describes both a Python engine and browser build; do not apply its Python performance claim to the browser engine. Its code/data reuse terms and complete asset availability remain to be checked.

Neither backend has been cloned, run or selected as part of this planning revision.

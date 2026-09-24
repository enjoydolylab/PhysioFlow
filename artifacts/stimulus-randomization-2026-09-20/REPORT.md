# Stimulus shuffle correctness

The old Fisher–Yates index used the low bits of an LCG via modulo. For four assets, a fixed corpus of 10,000 session seeds produced only 12 of 24 permutations. New sessions use Mulberry32 mixing before selecting the index. A regression checks all 24 permutations, each occurring between 250 and 600 times in that corpus, as well as no duplicates within a cycle. This finite corpus check is not a proof of perfect statistical uniformity.

The draw policy is unchanged: no replacement within a cycle; exhaustion repeats the seeded order; completion/skip consumes a draw; Retry preserves it. The user's preference on exhaustion behavior remains pending.

Compatibility: old checkpoints without an algorithm marker retain legacy-lcg-v1. New checkpoints use mulberry32-v2. Both algorithm version and consumption policy are embedded in runtime snapshots so hosted recovery also retains them; the existing top-level markers remain for local records. Runtime snapshots in exports preserve the marker as well.

Regression includes old seeded output, deterministic restoration, four-item permutation coverage, and hosted refresh assertions for both algorithm and consumption policy. Actual selected-browser media playback with the new algorithm remains to be accepted; prior playback acceptance used the legacy shuffle.

## Actual selected-browser acceptance

QA-SHUFFLE-V2 was resumed through the unfinished-session banner. Its first stimulus remained BLUE QA and the toolbar remained hidden. Revealing controls and Retry preserved the image source. Skip advanced to RED QA; Continue then produced blue and red in turn. The session completed with 30 events and 22 exported files. Exported assignment events confirm blue/red/blue/red and runtime_snapshot.json records mulberry32-v2.

This check exposed an additional bug: the completion-page session export retained ended_at:null from the preparation session. The runner now derives the end timestamp from protocol_completed/runtime_failed and uses it for both saved and exported sessions. Re-exported the same actual session through the webpage and asserted ended_at equals its completion event (2026-09-20T00:33:36.297Z). Corrected bundle and manual-verification.json are retained here. Participant browser regressions and the full 376-test/build/lint gate passed after the fix.

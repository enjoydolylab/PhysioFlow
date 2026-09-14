# Runtime reliability follow-up — 2026-09-05

Historical verification record. Publication note, 2026-09-06: fixes from c8e4057 are included in released v0.6.0-beta.4, commit 68a3451. The test counts below describe this earlier runtime audit, not the final release total. See [release notes](../RELEASE_NOTES_beta.4.md) and [current status](IMPLEMENTATION_STATUS.md).

## Corrected behavior

| Finding | Implemented behavior | Evidence |
|---|---|---|
| Adjacent questionnaires inherit submitted state | Participant subtree identity includes node ID and attempt; each transition/Retry creates fresh component state | Browser: two consecutive questionnaires both editable and completable |
| Stale response feedback completes a later node | Feedback timeout is cancelled on unmount/pause; completion and event callbacks must match the active node and attempt | Browser: Skip during response feedback leaves the next node waiting |
| Retry retains old fixed timer; Resume restarts duration | Fixed timers restart for a new attempt and retain remaining time across pause; checkpoints include remaining fixed-node time | Browser: Retry, Pause, Resume combination |
| Question/task clocks keep counting or restart on pause | Questionnaire deadlines, response timeout/feedback and cognitive-task phase timers retain remaining time; response/task RT excludes pause | Code paths updated; task-specific timing still needs hardware measurement |
| Restored session skips device connection | Device-backed restores return to the preflight screen; all distinct referenced connectors are attempted; required failures block start | Browser: restored missing required device remains blocked |
| Device error callback receives the wrong argument | Channel ID and exception are handled separately; sampler stops on read failure; required-device failure pauses a waiting run; reconnect control added | Unit: channel/exception delivery and no further reads |
| Slow/missing local media can advance a restored run | Timer, completion and event callbacks require media readiness; binary SHA-256 is recomputed | Unit: corrupt content is rejected despite matching metadata |
| Final save failure has no retry; failed run is not finalized | Completed and failed runs are saved; both allow local save retry and export; return requires save success | Browser: injected storage failure followed by successful retry |
| Windows replacement temporarily removes destination | Same-directory MoveFileExW replacement after flushing the temporary file | Rust: replacement succeeds; locked replacement fails with original intact |

## Stimulus pool contract

New Graph runs consume a shared pool according to actual execution, using completed and skipped node occurrences. Completion or Skip consumes one item; Retry retains the current item. The entire shuffled pool is consumed before cycling in the same seeded order. Uneven branch visits therefore no longer trap a node in a subset of the pool.

Checkpoints and saved sessions identify this policy as `global-completion-v1`. Restoring a checkpoint without that marker retains the previous `legacy-stride` policy to avoid silently changing an interrupted experiment. Old checkpoints retain the old uneven-visit limitation.

The setup preview is explicitly a nominal first pass in displayed node order. It is not a prediction of conditional branches or loops. Actual assignments are recorded in `stimulus_assigned` events.

## Verification

- JavaScript: 335 total, 334 passed, 1 Windows symlink skip.
- ESLint: zero warnings; production web build succeeds.
- Rust: 2 tests pass, including preservation of an existing file when replacement fails.
- Public participant browser test includes hosted refresh recovery and local runner scenarios: adjacent questionnaires, fixed timer Retry/Pause/Resume, stale feedback after Skip, final-save retry, required-device restore preflight, missing-media restore gating, and failed-run finalization.
- Composer V2 self-hosted browser E2E passes.
- New focused tests cover corrupted media bytes, sampler failure, and uneven shared-pool consumption.

## Remaining boundaries

- Checkpoints are periodic (2 seconds) plus state-change saves; a process crash can lose changes since the last successful checkpoint. Component-internal unfinished questionnaire answers and cognitive-task trial progress are not fully checkpointed; those components restart on reload.
- Multiple session files are not a single transaction. Windows replacement tests do not prove power-loss durability on every filesystem or network drive.
- Native media pause/resume is controlled; YouTube uses iframe commands and still depends on the external player and its reported state. No hardware-verified playback synchronization is claimed.
- Multiple connector support is implemented, but simultaneous physical devices, disconnect/reconnect races and long recordings need lab tests. Permission-dialog cancellation should also be included in operator testing.
- Beta.4 was subsequently published on 2026-09-06. The package remains unsigned; installed-app and real hardware acceptance remain pending. Publication does not constitute new acceptance evidence.

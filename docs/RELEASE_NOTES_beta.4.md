# PhysioFlow 0.6.0-beta.4 — research-test candidate

This is a local Windows x64 prerelease candidate, not a stable release or a published GitHub Release. Do not replace formal experimental data collection with this build before acceptance testing.

## Changes

- Fresh state for consecutive participant nodes and Retry; stale callbacks cannot advance the next node.
- Paused timers retain remaining time. Restored runs require media and required devices to be ready.
- Multiple device connectors, stopped failed samplers and reconnect controls.
- Failed-run saving and final-save retry.
- Shared stimulus pools consume in actual execution order for new runs. Skip consumes an item; Retry keeps it; exhaustion repeats the seeded order. Old checkpoints retain legacy behavior.
- Binary asset integrity verification and safer Windows file replacement.

See [the reliability audit](refactor/RUNTIME_RELIABILITY_AUDIT_2026-09-05.md) for automated test evidence and limitations.

## Installation and safety

- Use the x64 NSIS setup executable. Installation is per-user, with English, Japanese and Simplified Chinese choices.
- The package is unsigned; Windows may display a trust warning. Verify the SHA-256 against the accompanying SHA256SUMS.txt and obtain the package from the project maintainer.
- WebView2 is required. The installer downloads its bootstrapper if needed; this is not a fully offline installer.
- Back up existing PhysioFlow data first. Use a separate Windows test account and simulated/non-production data for initial testing.
- Published beta.3 downloads are unchanged. No automatic update is configured by this preparation.

## Operator acceptance checklist — not yet passed

Record Windows version, app version, device model, protocol, expected result, observed result and reproduction steps for every failure.

- [ ] Install in a clean Windows test account; launch, close and reopen without blank screens or errors.
- [ ] Create a protocol using the visual Participant UI editor; save, reopen and verify layout.
- [ ] Edit Protocol JSON; verify valid changes round-trip and invalid input does not overwrite the working protocol.
- [ ] Complete adjacent questionnaires, including direct SAM image selection; verify exported responses.
- [ ] Exercise Retry, Pause/Resume and Skip during response feedback; confirm no unexpected advancement.
- [ ] Check branch/loop stimulus assignments, pool exhaustion and Retry/Skip semantics against the intended study design.
- [ ] Save and export a completed and a failed session; compare response counts and stimulus assignment events with execution.
- [ ] Test missing media, unavailable required devices, permission cancellation, device disconnection and reconnect.
- [ ] Test concurrent real devices and a recording at least as long as the intended experiment.
- [ ] Reload an interrupted session. Confirm the documented restart of unfinished questionnaire/task state is acceptable.
- [ ] Verify timing and synchronization with suitable measurement hardware if the study depends on precise onset or reaction times.

An automated browser test is not evidence that the installed WebView2 application passed these checks. Multi-file saves are not a single transaction, and crash recovery may lose changes after the last checkpoint (normally every two seconds). External YouTube playback synchronization remains unverified.

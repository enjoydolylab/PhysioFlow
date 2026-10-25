# PhysioDB write path: the isolated test run cannot create a participant

Date: 2026-10-25. The read path is verified against the production server (see the vault handoff §1.4c).
The write path fails at its first write.

## Evidence

```
POST http://127.0.0.1:8792/v1/physiodb/test-runs/prepare
{"sessionId":"<uuid>","protocolId":"<uuid>","protocolVersion":1}
→ 400 {"error":{"code":"invalid_request","message":"Invalid PhysioDB request or response schema"}}
```

The DB then contains `[PF TEST] <runId>` research **and one experiment, zero participants** — the run stopped
at the participant step.

## Root cause

`server/physioDBTestRuns.mjs` (prepare):

```js
bridge(actor, 'createParticipant', { researchId: research.id,
  participant: { name, email: `pf-test-${r.runId}@example.com`, metadata: meta } })
```

`tools/physiodb/bridge.py` forwards those keys straight into the official client:

```python
if operation == "createParticipant":
    return await client.create_participant(ids["researchId"], **args["participant"])
```

and the client's signature is (physiodb-client `f844fcf`):

```python
async def create_participant(self, research_id: UUID, *, code: str, metadata: dict[str, Any] | None = None)
```

`name` / `email` are not accepted → `TypeError` inside the bridge → the catch-all maps it to the
"Invalid PhysioDB request or response schema" 400. The server's `ParticipantCreate` schema has only
`code` and `metadata`.

## What to change

1. **Fix the participant payload** in `server/physioDBTestRuns.mjs`: send `{ code, metadata }`. Use a code
   that identifies the run and stays unique per research, e.g. `PF-TEST-<runId>` (shortening is fine if a
   length limit applies — check `ResourceName` in the server schema before choosing).
   Keep `metadata` exactly as today (`physioflow_test`, `runId`, `protocolId`, `protocolVersion`).
2. **Audit every other write payload** in `server/physioDBTestRuns.mjs` against the current client
   signatures, and fix any other drift:
   - `create_research(name, *, project_id, description, metadata, readme)`
   - `create_experiment(research_id, name, *, description, metadata, readme)`
   - `create_stream(experiment_id, participant_id, *, name, fields, metadata, depends_on_stream_ids)`
     — `fields` items are `{name, type, unit?}` with `type` in `float|integer|string|boolean`
   - `write_samples(stream_id, samples, compress=True)` — `samples` items are `{time, values}`
   - `create_event(experiment_id, participant_id, *, ...)` — read the signature before touching this one
3. **Keep the existing guarantees**: idempotent `operation()` with pending/done states and reconcile,
   status transitions (`preparing` → `ready` → `uploading` → `verified` / `mismatch`), payload hash
   comparison, and the read-back verification loop. This is a payload-shape fix, not a redesign.

## Tests (must be green before reporting done)

- A unit test with a fake bridge that asserts the `createParticipant` RPC carries `code` and no
  `name`/`email` (this is the regression that just cost a real run).
- A unit test that drives `prepare` then `complete` against a fake bridge and reaches `status: 'verified'`
  with `report[0].matched === true`.
- `npm test` ≥ 519 pass / 0 fail / 1 skipped, `npm run lint -- --max-warnings=0`, `npm run build`.

## Non-goals

- Do not touch the PhysioDB server, the client pin, or `tools/physiodb/bridge.py`'s mapping.
- Do not change `src/PhysioDBUpload.jsx` / `PhysioDBSessionBinding.jsx` behaviour.
- Do not create anything in the real database from tests — the fake bridge stands in for it. Hermes runs
  the one real end-to-end check (prepare → complete → delete) afterwards.

## Report

Files touched, the final participant payload, the new tests and their names, and the gate output.

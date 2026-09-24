# PhysioDB source contract review

Source inspected: /Users/mac/Downloads/shibaura开题相关/physiodb-main, README.md, docs/client-development.md, docs/endpoints.md, docs/sse.md, src/physiodb/schemas.py and api/streams.py. PhysioDB source was not modified.

The provided repository is incompatible with the existing legacy BioDB gateway client: all endpoints are under /api/v1, tokens go directly into Authorization: Bearer, experiments and participants are scoped to Research, streams define ordered fields, samples are raw arrays of {time,values}, successful writes return 204. Reads use start/end and a half-open interval. Duplicate sample times produce 409. Live delivery is SSE via follow=true, not WebSocket.

Added src/physioDBClient.js as a separate v1 client for identity, research/experiment/participant discovery, stream creation, sample write/read and event creation. Unit contracts verify URL construction, bearer auth, raw arrays, empty 204 handling, range query and no automatic duplicate retries. This is not live-server acceptance and the client is not yet wired into settings/upload UI.

Remaining: settings API selection, Research and UUID entity mapping, ordered channel-to-field conversion, full raw BrainFlow transfer (browser preview is bounded), event mapping, authenticated SSE consumption and actual server integration. Browser direct requests also require the PhysioFlow origin registered in PhysioDB's OAuth client configuration. No credentials were requested or fabricated and no remote records were written.

## Event mapping foundation

Added src/physioDBMapping.js against the supplied schemas.py EventCreate contract. Conversion emits event_type/started_at/data, preserving eventId/sessionId/sequence/protocolId/nodeId and an independent payload copy. Timestamp text retains timezone and fractional precision; invalid identity/sequence or timezone-free timestamps are rejected. Four mapping/client tests pass. This module performs no network requests and is not yet connected to the upload UI; server acceptance and event deduplication remain unresolved.

## Raw BrainFlow sample conversion

Added toPhysioDBSamples for agent samples.jsonl records with explicit ordered {name,row} mappings. It preserves numeric values (including zero), formats Unix seconds at microsecond resolution, and rejects missing raw rows, nonfinite mapped values, duplicate/non-increasing timestamps and sequence gaps within a batch. It does not repair clocks, infer units or turn bounded browser previews into full recordings. Five mapping/client tests pass. Batch-boundary continuity, stream field creation, complete raw-file transfer, UI and server acceptance remain to implement.

## Bounded raw transfer foundation

Added transferBrainFlowSamples accepting async raw records and a caller-verified destination stream/channel mapping. It submits bounded batches, checks sequence/timestamp continuity across boundaries, reports acknowledged sample count/last sequence and never automatically retries. A failed request explicitly identifies the uncertain sequence interval; cancellation stops subsequent requests while allowing an in-flight request to settle. Nine client/mapping/transfer tests pass, including cross-batch gap, network failure and cancellation. Only fake clients were invoked; no remote data was sent. File parsing, mapping UI, destination-field verification and live-server integration remain outstanding.

## Streaming raw file reader

Added readBrainFlowRecording for Blob/File streaming JSONL parsing with line-numbered errors, CRLF/final-no-newline handling, per-line size limit, full finite raw-row validation and reader cleanup on cancellation/early exit. Four reader tests include a 1,201-record Blob through the transfer function, producing 500/500/201 batches in exact order. Reader plus transfer tests pass (8 tests, /tmp/physioflow-raw-file-transfer-tests.log). This uses generated numeric test records, not real physiological data or live server writes. Upload UI and destination mapping remain outstanding.

## Destination verification

Confirmed supplied server GET /streams/{stream_id}; exposed client.stream and added transferVerifiedBrainFlowRecording. It reads server stream metadata first, requires exact experiment/participant/stream identity and a non-deleted stream, then checks field count/order/name, float type and exact declared units before any write. Tests reject wrong participant, experiment, deleted stream, integer fields, unit mismatch and renamed fields with zero writes; matching schema transfers successfully. Reader/client/transfer tests 11/11 pass. Callers must use this verified entry point for upload UI. This is still mocked contract verification, not live server acceptance.

## Upload panel first integration

Added PhysioDBUpload under Dashboard Data & settings. It accepts server URL, in-memory token, experiment/participant/stream identifiers, ordered row/name/unit mapping and a raw JSONL file. Local checking validates the entire file and continuity; upload repeats that preflight before server schema verification and bounded transfer. Progress and uncertain failure ranges are displayed; cancellation stops subsequent work. Build/Lint pass. Actual browser navigation confirmed the panel and fields render. File selection, local validation, cancellation and server upload through this UI have not yet been accepted. No server request was made. Research/entity selection remains manual IDs, not yet a discovery workflow.

## Local upload-panel browser acceptance

Through the actual file chooser selected generated qa-raw-samples.jsonl (1,201 full rows), set ordered channels 0 and 2, and clicked Check recording locally. UI reported 1201 raw samples checked / No data was sent. Changing mapping to absent row9 was rejected. Selecting qa-corrupt-samples.jsonl reported Invalid recording JSON at line 2. Server/token fields remained empty; no upload was attempted. Improved absent-row errors to include row and sample sequence; mapping/reader regression tests pass. Cancellation, remote discovery/schema validation/upload success/error UI still need browser acceptance against a test server.

## Actual browser-to-local-HTTP upload acceptance

Started a contract test server bound only to127.0.0.1:8876 (not the PhysioDB application). Through the upload UI selected the generated1,201-row file, entered fixture IDs/token, then clicked Upload. UI showed1201 samples uploaded successfully. Server log proves GET schema followed by POST batches500/500/201, expected ordered values and continuous timestamps. ChangeduV tomV and tried again: UI rejected schema mismatch; log contains only a newGET, noPOST. Archived ui-local-contract-server.mjs and ui-local-contract-requests.jsonl. Server stopped(exit130 afterSIGINT); temporary token cleared from panel. This verifies real browser HTTP/CORS/204 and UI wiring against a fixture, not real PhysioDB database/auth/persistence or lab-server acceptance.


## Browser partial-write failure acceptance

Local fixture returned204 for batch1 and503 for batch2. Actual UI stopped with500 confirmed through sequence500, uncertain501–1000, and an explicit instruction to verify server data before retrying. Server log proves GET/POST/POST only: no retry and no third batch. Fixture server stopped and token cleared. Added safe HTTP status display from the client error cause; Build/Lint pass, status text addition itself not yet browser-retested. Archived failure fixture/log. No lab server was contacted.

## 2026-09-24 Browser cancellation acceptance

The local contract server delayed POST responses by 10 seconds. Before and after the status-message fix, cancellation during the first batch resulted in one GET and one POST of 500 records per run, with no subsequent batch. The UI reported 500 confirmed samples through sequence 500, without an uncertain batch.

The UI now distinguishes destination checking/uploading from file validation and shows a disabled Cancelling button plus an explanation while awaiting the current request. The revised messages were verified in the actual browser. Test token cleared; local server stopped. Fixtures: ui-local-cancel-server.mjs and ui-local-cancel-requests.jsonl (two runs).

Full quality:release passed with exit code 0: 424 tests, build, lint, legacy/Graph/public participant browser suites. Evidence: ../release-readiness-2026-09-23/quality-release-physiodb-20260924.log. This does not establish acceptance of a real PhysioDB database or hardware.

## 2026-09-24 Stalled-server regression

Added a 30-second client deadline covering both response headers and JSON body reads, with timer/listener cleanup and caller abort propagation. Requests are not automatically retried. A timeout while writing remains an uncertain batch, not an acknowledged write.

Actual browser test used the local fixture with a 60-second POST delay: UI exited its busy state at the client deadline, reported 0 confirmed samples and sequences 1–500 requiring server verification. No subsequent batch was sent. Test token cleared and fixture server stopped. Fixture: ui-local-timeout-server.mjs (uses the cancellation fixture log path).

Nine focused client/transfer tests, Build and Lint passed after this change. The prior 424-test full release run predates this timeout change; it is not claimed as verification of the new deadline. Added tests cover stalled response-body reads and caller cancellation.

# PhysioFlow Data Contract V2

> 技术参考：Graph 或可选扩展模块的接口与运维说明。返回[文档导航](../README.md)；应用版本、交付范围与待验证事项见[当前状态](IMPLEMENTATION_STATUS.md)。

Runtime V2 uses an append-only event envelope with a wall clock and a monotonic clock. The raw JSONL files are authoritative; CSV files are analysis-friendly projections and retain component payloads as JSON columns.

This list describes `buildGraphDataBundle` in [graphExport.js](../../src/data/graphExport.js). Legacy complete/simplified exports use [exporter.js](../../src/exporter.js) and different schemas. BIDS-style exporters exist for both paths; they do not establish dataset compliance without validation of the actual output. Do not infer timing accuracy from timestamp formatting.

Every complete graph-session export contains:

- `manifest.json`: package identity, protocol version, participant/session identity, and record counts.
- `session.json`: session metadata without duplicating raw event arrays.
- `protocol_snapshot.json`: the exact executable Protocol Graph.
- `runtime_snapshot.json`: final state-machine state, variables, outputs, attempts, and loop counters.
- `events.jsonl`: every immutable event envelope in sequence order.
- `responses.jsonl`: every submitted participant response value.
- `device_events.jsonl` and `device_events.csv`: raw and normalized device lifecycle/sample records.
- `channel_dictionary.json` and `channel_dictionary.csv`: channel definitions and provenance.
- `events.csv` and `responses.csv`: normalized analysis tables.
- `event_schema_registry.json`: event types understood by this release.
- `component_manifest.json`: component versions and their event/data contracts.
- `asset_manifest.json`: referenced experiment resources.
- `data_dictionary.json`: column definitions and clock semantics.
- `quality_report.json`: sequence, schema, node-reference, completion, retry, skip, and pause checks.

`timestamp_epoch_ms` supports alignment to other systems. `elapsed_monotonic_ms` is the preferred duration clock because wall-clock corrections cannot move it backwards.

To validate an unpacked export independently:

```bash
npm run validate:graph-export -- /path/to/unpacked-session
```

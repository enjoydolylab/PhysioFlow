# beta.23 response field overview delivery

Application source commit: db5f2b8f193d27e1de675263b38c910401ef9048. BUILD_INFO records trackedSourceDirty=false.

533 tests, production build, zero-warning lint and full editor/runtime/hosted/SDK plus multi-viewport browser regression passed. Actual builder checks cover missing/duplicate response-name repairs, independent errors on one element, undo/redo, raw field names/recorded values across Japanese/Chinese/English, live overview updates and preview-to-edit location.

Production checks passed: compiled assets, SPA/admin entry, template persistence and repeated creation. A synthetic draft with duplicate name and invalid range was repaired through the production designer. Field names true/second_value and choice values false/0 remain literal in Japanese; Configure returns from preview to the matching input field. The overview lists input fields, not every value potentially submitted by button actions.

ZIP CRC, private/cache exclusions and 369 Server manifest hashes passed. Server/SDK/launcher match beta.22; installation and full DB execution were not repeated. Human trials, formal hardware and original-stimulus results remain pending.

Artifacts: release-web/PhysioFlow-Web-v0.6.0-beta.23.zip and PhysioFlow-Server-v0.6.0-beta.23.zip. Evidence: artifacts/participant-name-stage/package-beta23/.

```text
f93dbcdf76ac7dffb6f4d21408362a7c493a598f8bade92128254eeb93541fa6  PhysioFlow-Server-v0.6.0-beta.23.zip
2576dc21cbcd6443085df7b125ed7dcea411a3e3573e389119a77e407e35fe8a  PhysioFlow-Web-v0.6.0-beta.23.zip
```

Delivery branch: lab/codex/lab-handoff-20260924. Main unchanged.

# beta.14 stage delivery

Source commit: cc91128fccf62886479e274a662ccbd25570aeb1

Selective group updates, questionnaire/media preservation, independent batch undo/redo, new history branches, scope boundaries and storage reload passed. 512 tests, build, lint and Composer browser regression passed.

Web and server ZIP files are under release-web. CRC, source manifest and private-directory exclusion passed. Web production launcher, routes, clean committed provenance, and creation of two independent templates passed. BUILD_INFO identifies the source commit above with trackedSourceDirty=false.

```
d87ec9b0999071a94121e5bbc0e55da52fd48f1cc6bf0d791e37e349b77b1ac9  PhysioFlow-Web-v0.6.0-beta.14.zip
5cf7ee28c7d5f0b9c2095cc23cdb0b1fc5d0ac93ec844c052d189c8b34e39074  PhysioFlow-Server-v0.6.0-beta.14.zip
```

Server, launcher and locked SDK files match validated beta.13. Server installation and full DB scenarios were not repeated for beta.14. Actual hardware, original media/timing and human trials remain incomplete. The goal is not complete.

Push target: lab remote, codex/lab-handoff-20260924. Main branch is unchanged. Private credentials, runtime data, recordings and caches are excluded.

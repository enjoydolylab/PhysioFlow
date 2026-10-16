# beta.26 local archive recovery

A failed version-preparation command was followed by packaging commands, which replaced the local beta.26 archives with newer source under the old version. Those incorrect files were isolated under release-web/superseded-beta26-misversioned/.

Both beta.26 distributions were rebuilt in an isolated clean worktree at the original source commit 10b418a3e94a5b17171e1038f779ad2cd43d253d. BUILD_INFO confirms that commit and trackedSourceDirty=false. The original ZIP bytes cannot be recovered; these are rebuilt archives with new timestamps and hashes. Historical delivery hashes remain historical. Current rebuilt ZIP hashes are:

```text
b5634bf52da8121f9ea2d234b7d5430c3a339f32b0b1a9ca12e71cc33e8855d9  PhysioFlow-Web-v0.6.0-beta.26.zip
2e2010e43d7b493fa9568fdfe75349762509360a9a3dd616255fd20acc9fb109  PhysioFlow-Server-v0.6.0-beta.26.zip
```

Packaging now refuses existing output folders or ZIPs unless PF_REPLACE_EXISTING_PACKAGE=1 is explicitly set. Both archive-only refusal paths are tested.

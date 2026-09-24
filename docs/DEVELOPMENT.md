# 开发、验证与发布

更新：2026-09-06。面向维护者；研究人员从[使用指南](USER_GUIDE.md)开始。

## 启动与构建

```sh
npm ci
npm run dev
npm run build
```

开发服务默认端口 5174。应用使用 Vite / React；依赖版本以 [package.json](../package.json) 和锁文件为准，不在文档维护第二份版本表。

桌面端使用 Tauri。安装 Rust（工具链见 [rust-toolchain.toml](../rust-toolchain.toml)）及平台构建工具；Windows 需要相应 C++ 构建环境和 WebView2。执行：

```sh
npm run desktop:dev
npm run desktop:build
```

当前 [Tauri 配置](../src-tauri/tauri.conf.json)构建 NSIS，输出在 `src-tauri/` 下的 target/release/bundle/nsis/（构建产物目录，不随 Git 提交，全新检出时不存在）。浏览器产物在 `dist/`；`release-desktop/` 是忽略的交付目录，不随 Git 提交。

## 验证

```sh
npm test
npm run lint -- --max-warnings=0
npm run build
cargo test --manifest-path src-tauri/Cargo.toml
npm run quality:release
```

`quality:release` 包含 JS 测试、lint、构建及三条浏览器 E2E；不包含 Rust 测试和真人可用性验收。

Windows 浏览器测试需要设置实际安装的 Chrome 路径：

```powershell
$env:CHROME_BIN = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
npm run test:e2e:refactor-browser
npm run test:e2e:participant-public
```

支持额外运行 `npm run test:interactions`、`npm run test:performance`。命令来源始终为 [package scripts](../package.json)。Linux/macOS shell 的 Hosted 环境变量示例不要原样粘贴到 PowerShell；PowerShell 使用 `$env:NAME = 'value'`。

## 模块定位

| 范围 | 入口 |
| --- | --- |
| 新协议模型、验证、随机化 | [src/core](../src/core) |
| Graph 编辑器 | [ComposerV2.jsx](../src/ComposerV2.jsx)、[src/composer](../src/composer) |
| 参与者 UI | [ParticipantUiBuilder.jsx](../src/ParticipantUiBuilder.jsx)、[ParticipantRenderer.jsx](../src/ParticipantRenderer.jsx) |
| 运行状态机与适配 | [src/runtime](../src/runtime)、[GraphRuntimeRunnerPage.jsx](../src/GraphRuntimeRunnerPage.jsx) |
| Graph 数据包 | [src/data](../src/data) |
| 旧模型与执行 | [domain.js](../src/domain.js)、[engine.js](../src/engine.js)、[runtimeMachine.js](../src/runtimeMachine.js) |
| 桌面文件写入 | [src-tauri/src/lib.rs](../src-tauri/src/lib.rs) |
| 单节点 Hosted | [server](../server)、[部署说明](refactor/SELF_HOSTING.md) |

## 发布

每次发布按[发布检查](refactor/RELEASE_CHECKLIST.md)记录结果。同步 package、npm lock、Cargo、Cargo lock 和 Tauri 的应用版本；不要把 schema 或 SDK 版本当作应用版本升级。

确定提交 SHA 后构建；上传前核对安装包 SHA-256、发布说明与该提交。发布标签指向明确提交，附件包含 EXE、SHA256SUMS.txt 与 RELEASE_NOTES.md。已交付的版本应使用新版本号发布后续二进制，避免相同版本名对应不明来源的安装包。

GitHub Release、分支推送、安装包构建是三个不同动作。上传后验证远程附件摘要和标签，再更新 README、发布说明、CHANGELOG 及当前状态页；历史验收报告只追加发布注记。

## 文档维护

[文档导航](README.md)列出当前文档和历史材料。业务能力变化更新业务说明；命令与导出变化更新对应契约；验证结果需写明日期、提交和范围。历史报告不应替代当前状态。

运行 `node scripts/check-docs.mjs` 检查本地 Markdown 链接、代码引用路径、文档目录覆盖及 npm 命令。该检查不请求外部网络，也不证明技术契约或 UI 已通过新一轮测试。

# PhysioFlow

本地优先的实验设计、参与者呈现、会话记录与数据导出工具。新建实验默认使用 Composer V2；旧 Block / Trial 协议仍可读取和运行。

## 下载

当前发布版本：[v0.6.0-beta.4（研究测试版）](https://github.com/kyzzz22/physioflow-app/releases/tag/v0.6.0-beta.4)，2026-09-06 发布，源码提交 `68a3451`。

- [Windows x64 安装包](https://github.com/kyzzz22/physioflow-app/releases/download/v0.6.0-beta.4/PhysioFlow_0.6.0-beta.4_x64-setup.exe)
- [SHA-256 校验文件](https://github.com/kyzzz22/physioflow-app/releases/download/v0.6.0-beta.4/SHA256SUMS.txt)
- [发布说明](docs/RELEASE_NOTES_beta.4.md)

安装包未签名，按当前 Windows 用户安装，支持英语、日语、简体中文安装界面。需要 WebView2；缺少运行环境时可能需要联网安装。当前没有已发布的 macOS / Linux 安装包。

## 从哪里开始

| 你的任务 | 文档 |
| --- | --- |
| 理解系统如何组织实验 | [业务流程与能力边界](docs/BUSINESS_WORKFLOW.md) |
| 创建、预览、运行和导出实验 | [研究人员使用指南](docs/USER_GUIDE.md) |
| 确认版本和验证范围 | [当前实现状态](docs/refactor/IMPLEMENTATION_STATUS.md) |
| 查看下一轮体验优化 | [优化路线图](docs/refactor/OPTIMIZATION_PLAN.md) |
| 开发、构建和发布 | [开发指南](docs/DEVELOPMENT.md) |
| 查阅全部文档 | [文档导航](docs/README.md) |

## 核心流程

设计协议 → 配置刺激与问卷 → 预览检查 → 冻结版本 → 运行会话 → 检查与导出数据。

这是业务顺序，当前应用尚未实现六阶段向导。Composer 的 Quick / Design / Advanced 是同一 Graph 的配置视图；旧 Block / Trial 编辑器是另一条兼容路径。Graph 分组不等同于可执行 Block。

beta.4 改善了暂停恢复、保存重试、刺激池随机分配、多尺寸编辑和自定义元素呈现，并修正了受约束的旧 Block 随机排序及新生成 Stroop 试次。完整改动见 [CHANGELOG](CHANGELOG.md)。

当前开发版进一步整理了首页、实验自定义和[画布编辑](docs/refactor/CANVAS_EDITING.md)，包括明确的自由/自动布局、多选拖动和分组属性面板。这些改动尚未包含在上述 beta.4 安装包中。

## 数据与运行环境

桌面端数据目录为当前用户的 `Documents/PhysioFlow Data`，可从首页打开。浏览器端存储与桌面端不同；正式运行前应确认所用存储方式并保存导出副本。Hosted 是可选的自托管服务，详见 [部署指南](docs/refactor/SELF_HOSTING.md)。

外部媒体、外部问卷和设备服务可能发生网络通信；“本地优先”不代表所有配置都离线。Graph 与旧协议的导出结构不同，应以包内清单和数据字典为准。

## 开发启动

```sh
npm ci
npm run dev
```

开发页面默认使用 5174 端口。桌面构建需要 Rust 和平台构建工具，运行 `npm run desktop:build`。验证命令与环境说明见 [开发指南](docs/DEVELOPMENT.md)。

研究人员实测、Windows 系统缩放和真实设备同步仍待验收；当前版本为预发布版本。

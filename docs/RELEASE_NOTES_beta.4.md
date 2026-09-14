# PhysioFlow v0.6.0-beta.4 发布说明

发布：2026-09-06。类型：研究人员测试预发布。源码：`68a3451c3f33dcb8cbf87f53d612bf0938e990d1`。

[GitHub Release](https://github.com/kyzzz22/physioflow-app/releases/tag/v0.6.0-beta.4)提供 Windows x64 NSIS、SHA256SUMS.txt 和 RELEASE_NOTES.md。

## 本版改动

- 连续节点与 Retry 状态隔离，阻止旧回调误推进。
- 暂停计时保留剩余时间；恢复会话检查设备与媒体，采样失败停止并提示。
- 最终保存失败可重试，失败会话也保存。
- 新 Graph 会话按实际执行顺序消费刺激池，旧快照保留兼容策略。
- 本地资源检查实际内容哈希，Windows 文件替换保留失败前的原文件。
- 修复小屏主要控件布局、自定义元素宽高和自由布局滚动。
- 旧 Block 随机约束不再静默放宽；不合法重复次数与不可满足约束报错。
- 修正新生成 Stroop 试次的一致性标签及颜色分配。已保存的试次不会自动重写。

## 安装与验证

按当前 Windows 用户安装，安装语言支持 English / Japanese / 简体中文。安装包未签名，依赖 WebView2，首次安装环境可能需要联网。没有随本版发布 macOS 或 Linux 包。

SHA-256：

```text
7176bd8edab95c34903c15669bccda1b8079575fedb0df610f75c4d003cd38c7
```

此前修复验证记录为 340 项 JS 测试（339 通过、1 Windows symlink 跳过）、lint/build 及两条扩展浏览器 E2E 通过。运行可靠性阶段另有两项 Rust 测试通过。详细范围见[验收报告](ACCEPTANCE_REPORT_2026-09-05.md)与[当前状态](refactor/IMPLEMENTATION_STATUS.md)。

## 交付后的验证

正式采集前按[操作员试跑指南](refactor/OPERATOR_PILOT_GUIDE.md)核对保存、运行与导出。实际 WebView2、Windows 缩放、真实设备及同步精度仍待验证；8 种 CSS 视口检查不等同于这些测试。

旧 Block 受约束排序在相同 seed 下可能与之前版本不同。自由布局保留像素尺寸；未提交问卷/认知任务进度不保证完整恢复；多文件保存不是整体事务。相关使用规则见[业务说明](BUSINESS_WORKFLOW.md)。

研究人员独立完成任务的验收使用[可用性规程](refactor/USABILITY_STUDY_PROTOCOL.md)，不把自动测试或发布成功记为真人通过。

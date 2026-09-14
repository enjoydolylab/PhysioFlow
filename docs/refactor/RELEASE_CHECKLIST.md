# 每次发布检查

这是可复用清单，不是永久勾选的完成证明。当前版本的结果见[实现状态](IMPLEMENTATION_STATUS.md)，每次发布记录应用版本、提交 SHA、平台和实际结果。

## 工程与制品

- [ ] 版本配置一致，提交范围明确，来源 commit 可追溯。
- [ ] `npm run quality:release` 通过；其内容以 package scripts 为准。
- [ ] 涉及桌面代码时运行 `cargo test --manifest-path src-tauri/Cargo.toml`。
- [ ] 对本次业务修改的关键失败用例完成回归，不把模拟设备结果记为真实硬件通过。
- [ ] 从目标源码构建安装包；核对版本、文件名与 SHA-256。
- [ ] 说明签名状态、WebView2 依赖、支持的平台和已知限制。
- [ ] 发布到目标标签；核对远程 tag、附件 digest、draft/prerelease 状态。
- [ ] 更新 README 下载入口、发布说明、CHANGELOG 和当前状态。

## 操作与数据

- [ ] 在实际桌面安装环境完成创建、保存重开、画面预览、试运行与数据导出。
- [ ] 核对目标分辨率和系统缩放、长文本和媒体；需要精确呈现时核对刺激尺寸。
- [ ] 核对条件数、重复、随机化、退出路径及数据数量。
- [ ] 确认暂停恢复、失败保存、设备缺失/断连和数据质量异常的处理。
- [ ] 迁移协议按报告复核语义；新算法与旧版本的顺序不能只用 seed 推断等价。

## 真人与稳定版判定

- [ ] 完成[操作员试跑](OPERATOR_PILOT_GUIDE.md)。
- [ ] 完成[可用性规程](USABILITY_STUDY_PROTOCOL.md)，运行 `npm run verify:usability-study -- <results.json>`，确认 `complete` 与 `passed`。
- [ ] 设计者、操作员、分析人员签收，阻塞/数据完整性缺陷闭环。

研究测试版可用于收集这些证据，但需明确未验收项。签发预发布不代表以上全部通过。

Hosted 发布另需按[自托管指南](SELF_HOSTING.md)及其运维文档验证身份、资源、备份恢复和网络边界；本地 Windows 包发布不会自动部署 Hosted 服务。

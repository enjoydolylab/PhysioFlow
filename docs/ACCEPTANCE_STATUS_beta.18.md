# beta.18 当前推进与验收状态

2026-10-15核对。当前本地研究试用包为0.6.0-beta.18；这不是新的Windows安装包或公开Release。包内源码为9f75ae74ba41f7da0a8d0fe071d8e80ea2ba3b77，BUILD_INFO标记trackedSourceDirty=false。工作分支lab/codex/lab-handoff-20260924已核对远端为2ed8c20744a9bef191808b683675977dc2107582。

| 原顺序 | 当前证据 | 验收范围与缺口 |
| --- | --- | --- |
| 1 最新PhysioDB兼容 | beta.9隔离最新版DB及官方SDK实测；后续包清单核对 | 本机已覆盖；beta.18未重复安装/全DB测试，远端部署未验证 |
| 2 映射和追溯 | 独立运行、冻结指纹、逐事件/回答回读、租户隔离历史实DB证据 | 软件已覆盖；不视为真人实验结果 |
| 3 实验闭环 | 210节点测试素材加速执行、1863事件/1200响应、100501点恢复记录 | 测试条件通过；原视频、原时长和正式设备未完成 |
| 4 管理与参与者 | 保存恢复、操作确认恢复、记录查询导出；beta.16入口/监控UI，beta.18运行失败生产试跑 | 已覆盖的软件场景通过；真人操作体验仍无结果 |
| 5 组件和编辑 | 模板隔离、批量保存/撤销、配置窗口、类型校验、随机权重/循环条件与动态比较；527测试及浏览器回归 | 具体软件改进通过；不宣称所有可能配置或编辑效率完成验收 |
| 6 实际试用 | 试用手顺及空观察表已有，用户明确暂无真人记录；现有模板校验participantCount=0 | 未完成；不能用自动测试补写 |

近期交付与直接证据：[beta.18](DELIVERY_WEB_beta.18.md)、[beta.17](DELIVERY_WEB_beta.17.md)、[beta.16](DELIVERY_WEB_beta.16.md)、[beta.15](DELIVERY_WEB_beta.15.md)。原DB/全结构范围见[beta.10验收](ACCEPTANCE_STATUS_beta.10.md)，其旧版本记录不转换为beta.18重复执行结果。

本地包位置为release-web/PhysioFlow-Web-v0.6.0-beta.18.zip及Server对应ZIP，校验和为release-web/SHA256SUMS-beta.18.txt。静态Web包适合本地研究试用；DB集成需要Server运行条件。

## 接下来的推进

按原顺序，剩余完整验收需真人参与，以及正式设备、原素材条件。用户此前授权先继续其他软件功能；已完成本轮实验设计、组件校验及UI阶段，下一阶段优先范围已再次询问。收到范围前，不以连续发版本代替实际试用。

真人试用可使用[日语手顺](USER_TRIAL_JA_2026-10-14.md)和[观察表](USER_TRIAL_RECORD_beta.8_日本語.csv)，填写实际版本/源码、角色、耗时、是否需帮助、困惑位置、运行ID与附件，记录中不放访问凭证。正式设备对接以原古口系统代码和具体硬件可用性为依据；软件合成信号不证明硬件通过。

已准备[beta.18日语试用入口及空结果模板](trials/beta.18/README_日本語.md)，保留正式规程且补充近期改修的观察任务。空模板验证结果为complete=false、passed=false、人数0、观察0，证据artifacts/trial-readiness-beta18/empty-template-report.json。这是试用准备，不是实际结果。

总体目标仍未完成。本页为当前证据索引，既有历史文件保留原日期和结果。

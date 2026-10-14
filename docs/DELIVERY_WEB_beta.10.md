# beta.10 Web 研究试用交付（2026-10-14）

beta.9 之后的旧步骤操作保护、最终保存异常提示与服务端保存状态已纳入 beta.10。中日文提示可用，两包均含 OPERATOR_GUIDE_日本語.md。旧 beta.9 ZIP 保留。

- release-web/PhysioFlow-Web-v0.6.0-beta.10.zip：静态设计、运行与本地数据试用；运行 start 脚本。
- release-web/PhysioFlow-Server-v0.6.0-beta.10.zip：DB 服务端配套包；按包内 README 安装启动。
- release-web/SHA256SUMS-beta.10.txt：两包校验值。

修改后的505项测试、构建、零警告lint，以及真实浏览器丢失确认查询恢复和日语保存异常提示通过。版本更新后重新构建归档；CRC、源清单、日语指南包含和私用目录排除通过。静态包实际 start.py 在8081启动，生产模块、beta.10 BUILD_INFO、SPA路由和管理登录入口通过；证据 artifacts/db-progression-2026-10-14/package-beta10。

按 beta.9 与 beta.10 原始服务端 ZIP 的源清单逐文件比较，DB 同步、映射、长录制、导出和锁定 Python SDK 未改变。beta.9 包内短实验、完整1863事件与1200响应、100501点长记录及完整导出核对证据保留；不声明本轮重新执行所有DB场景。beta.10服务端依赖及锁定SDK安装、独立18880端口启动、owner认证、SPA入口和全部源文件清单验证已通过；证据package-beta10/server.json。首次启动DB未配置，此启动验证不视为新DB数据测试。

目前无真人试用记录、正式设备、原视频与原时长验收。所有模拟证据明确保持测试性质。源码未提交，服务端 SOURCE_FILES_SHA256 对应实际源码；基准提交不能单独重现该包。

追加beta.10源码实际浏览器运行回归通过：11类元素编辑、撤销重做、组件配置、参与者必答/数值校验、保存失败重试、暂停恢复、远程重试/跳过、备注与已保存回看。验证使用实际 GraphRuntimeRunnerPage 与 OperatorMonitorPage，不只是协议模拟。证据 artifacts/db-progression-2026-10-14/package-beta10/workflow.json 和 workflow.log；不替代真人体验结果。

# beta.7 Web研究试用包交付记录

2026-10-12，Asia/Tokyo。用户选择Web研究试用包，本轮不要求Windows原生安装包或正式实验结果。

## 制品与来源

- 文件：release-web/PhysioFlow-Web-v0.6.0-beta.7.zip，740651字节。
- SHA-256：40e59f41f2263ef3476c6bb7dfe353d9c849f3ebc24d08aeec51f58669dec60b。
- 校验文件：release-web/SHA256SUMS-beta.7.txt。
- 源码提交：85eeeb58a217ee2cec93446a604d24c2d786dfa6，构建时trackedSourceDirty=false，包内BUILD_INFO.json记录来源。
- package/package-lock、Tauri配置/Cargo版本及APP_VERSION均为0.6.0-beta.7。修复旧APP_VERSION=0.4.0标识。
- beta.6目录和ZIP保留；打包脚本只重建指定版本目录。

包内包含Windows/macOS/Linux启动脚本、研究试用版发布说明、HANDOFF.md、用户原始设计副本和40视频清单。静态包不包含私人配置、原始生理记录或数据库后台；不会把LFS指针当作视频分发。

## 验证

481/481单测、构建、零警告lint、四套浏览器回归通过，日志本机/tmp/pf-beta7-quality.log。源码验收的完整离线流程另见[软件验收](DELIVERY_ACCEPTANCE_2026-10-12.md)。

实际调用包内start.py，服务生产构建而非Vite源码；使用隔离Chrome完成创建、插入步骤、保存、测试准备、参与者运行、暂停/恢复、最终保存、实际ZIP下载及重开读取会话。生成的会话ZIP可打开，session.status=completed。结果artifacts/delivery-preparation-2026-10-12/web-package-smoke.json，试跑日志web-package-smoke.log。

ZIP结构核对68项，版本与源码信息、一页交接说明和原设计副本存在；SHA-256已计算。package-check.json保留制品核对。

## 素材与使用边界

40个01.mp4等文件全部为132字节级Git LFS指针，指针OID均与设计校验值一致，但真实视频字节在本机未找到。媒体清单明确originalVideosAvailable=0。必须由素材持有人取回原视频再按条目绑定，校验通过后才开始正式实验。当前交付可用于设计与测试流程，不宣称40原视频和112分钟正式实验通过。

本机macOS/Chrome启动试跑通过；Windows批处理文件随包提供，未宣称Windows安装/DPI实机通过。静态Web不能单独提供官方PhysioDB管理服务；需要时部署源码服务并私下配置权限。联系与实际设备参数由接收研究室自行确认，不内置私人信息。

本轮只固定本地提交和构建交付文件，未推送远端或替用户发送给第三方。交付使用说明见[一页说明](HANDOFF_beta.7.md)。

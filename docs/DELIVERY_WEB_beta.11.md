# beta.11 编辑流程试用交付

2026-10-14。本轮模板/组件配置/校验改进已打包，旧beta.10保留。

- release-web/PhysioFlow-Web-v0.6.0-beta.11.zip：运行start脚本使用。
- release-web/PhysioFlow-Server-v0.6.0-beta.11.zip：按README安装依赖、锁定SDK并启动服务；首次未配置DB。
- release-web/SHA256SUMS-beta.11.txt：校验值。

两包同含EDITOR_GUIDE_日本語.md和实验员日语指南。功能修改后511项测试、构建、零警告lint及源码浏览器验证通过；版本更新后重新生产构建、归档CRC和源清单校验、私用目录排除通过。

静态包实际start.py在8081启动，BUILD_INFO/生产资源/SPA/管理登录入口通过。实际打包应用中配置情绪模板为700ms，保存成功并打开编辑器，持久化内容含该配置。服务端包npm与锁定SDK安装、18881独立启动、owner认证、SPA与源清单通过。证据：artifacts/editor-progression-2026-10-14/package-beta11。

本轮没有重跑完整DB场景，不将之前beta.9隔离DB证据记为新版结果。尚无真人试用、正式设备及原媒体/原时长验收。源码未提交，服务端包清单对应实际源码。测试后解压服务端目录生成私用目录；分发原ZIP，不分发测试后的整个文件夹。

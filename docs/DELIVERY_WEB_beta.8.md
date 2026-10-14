# beta.8 Web 研究试用交付

2026-10-14。静态Web包与本机PF服务端配套包已生成，旧beta.7保留。源码未提交；静态BUILD_INFO明确trackedSourceDirty=true，服务端包包含实际src/server/dist、依赖锁和SOURCE_FILES_SHA256.json。

## 交付物

- release-web/PhysioFlow-Web-v0.6.0-beta.8.zip：设计、运行、本地保存与回看。
- release-web/PhysioFlow-Server-v0.6.0-beta.8.zip：包含DB功能的本机服务端；npm ci、uv sync --frozen --project tools/physiodb、npm run desk。初次启动没有DB凭据，需操作者私下设置。
- 两包均含日语试用规程或说明。正式刺激视频和设备不包含。

## 本轮验证

全量499项测试、构建和零警告lint通过。静态包的真实start.py在空闲端口8081启动，生产构建与/admin/管理页在浏览器加载；/admin、/operator、/participant的HTML入口均验证。启动器补齐SPA路由和根资源地址。首次测试误用默认8080（启动器实际选择8081），以及假定构建文件在assets目录；已改为真实启动地址与实际构建模块验证。

服务端配套包安装npm与锁定的Python SDK成功；独立18878端口启动；SOURCE_FILES_SHA256中的全部文件匹配、owner认证metrics与SPA入口通过。源码DB功能此前已通过隔离最新版DB短实验、完整设计结构及100501点长录制验证。包的首次启动未配置DB，不将此启动检查当作额外真实数据库测试。

证据：artifacts/db-progression-2026-10-14/package/browser.json 与server.json。归档CRC通过；显式打包目录不含.physioflow、.venv、node_modules与本机凭据。测试启动后产生的私用目录不在归档中。

## 校验值

```
90423296737d05b6c7c4bdd292ddfb9f1b84d8c88a5d4b91e59bddaccea98bf6  PhysioFlow-Server-v0.6.0-beta.8.zip
8a163434d656f1eb587a00dd304880876f916525a3857713256919f4a4e03c33  PhysioFlow-Web-v0.6.0-beta.8.zip
```

## 尚待完成

真人试用没有记录。请按docs/USER_TRIAL_JA_2026-10-14.md实际操作并填写观察；自动化浏览器不替代真人结果。目前没有正式设备，设备验收以后辈代码mock联调为本轮证据，实机和正式刺激/原时长验收保留后续。

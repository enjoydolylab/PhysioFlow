# 媒体与素材池网页验收 · 2026-09-18

验证地址 http://127.0.0.1:5187。两次真实网页测试会话及完整导出均保存在本目录；本地素材为自行生成的测试文件，非受试者数据。

## 修复

1. 本地图片在素材池编辑器中仅显示image占位：从本地素材存储加载Blob预览；切换和关闭时释放对象URL，异步读取完成前关闭不会留下新URL。
2. 素材池弹窗继承侧栏按钮宽度，挤压搜索框、计数及说明：使用portal隔离侧栏样式，计数保持行内显示。01为缩略图修复后但布局未修复截图，09为最终修复截图。

## 实际页面验收

| 功能 | 结果与证据 |
|---|---|
| 本地素材导入 | 两张SVG、12秒WAV、12秒H.264 MP4逐个导入，类型正确，素材库4项 |
| 素材池类型筛选 | image池仅显示两张图片，排除音视频 |
| 搜索与选择 | 搜索red并选择结果，清除筛选后保留选择，再选blue；选择计数2/2 |
| 缩略图 | 两张图片加载成功，naturalWidth=640，09截图可见 |
| 清空与取消 | Clear显示0/2；Cancel后重开仍为2/2，没有误保存 |
| 保存与重开 | 项目保存、完成会话返回后重开，池内两张图保持 |
| 四次循环抽取 | red、blue、red、blue；drawIndex为0、1、2、3 |
| 重试和跳过 | 首次图片Retry未新增抽取；第二张Skip消耗该项并进入下一循环 |
| 图片实际显示 | 02–06截图；事件记录各次media_loaded |
| 音频播放 | 原生播放按钮启动12秒WAV；readyState=4，duration=12 |
| 音频暂停恢复 | 播放约4.51秒时暂停实验，两次读取均为4.508635秒且paused=true；恢复后继续播放 |
| 播放结束自动推进 | 音频media_ended进入视频；视频原生按钮播放12秒后media_ended完成会话；未使用Skip |
| 视频显示 | 640×360测试图正确显示，readyState=4；导出开始与结束间隔12秒 |
| 导出一致性 | QA-MEDIA-POOL共29事件，QA-AV共13事件，两包各22文件；verification.json断言抽取顺序、重试/跳过数及音视频结束事件 |

## 验证

quality:refactor通过：366项测试、build、lint零警告。Composer浏览器回归通过，包括8种视口布局检查。git diff --check通过。日志见quality.log、composer-browser.log。本轮仅修改素材池编辑器及其样式，工作区未提交或部署。

## 范围与未验证项

- 浏览器播放状态和流程事件已验证；未对实际扬声器声压、耳机输出或屏幕帧时序作物理测量。
- 音频及视频暂停/恢复均已实测；视频补测见下方9月19日记录。
- 本地两图片池代表性循环通过，不等于所有音视频池、全部随机种子、外部YouTube及所有编码格式均验收。
- 素材池来源误报已在9月19日补充验收中修复；额外未配置的媒体元素仍保留提示。
- OpenBCI/Mybeat实机、实验室PhysioDB和正式采集文件夹仍需对应环境。此前组件和编辑器验收见 ../component-acceptance-2026-09-18/REPORT.md。

## 9月19日补充验收与修复

- 修复节点已提供素材池、固定素材或URL时主Media元素仍报缺少来源的问题；仅排除主元素的误报，不掩盖额外元素缺少来源或无效素材池错误。实际网页证据10-source-warning-fixed.txt。
- 图片配置media-ended现在产生阻塞错误，防止等待永远不会发生的播放结束事件；实际选项编辑证据11-image-ended-blocked.txt，验证后恢复manual并保存。
- 媒体结束模式递归移除嵌套布局中的submit/next操作，保留无关按钮，且不改写存储中的原始UI。运行页面已验证嵌套Continue不出现。
- 原QA-VIDEO-PAUSE会话从检查点恢复为Paused。重新播放后暂停于0.283326秒，两次读取一致；Resume后读取4.970302秒、paused=false；Retry恢复0秒。随后手动点击原生播放，完整播放后自动完成。
- QA-VIDEO-PAUSE导出15个事件、22个文件，包含两次暂停恢复、一次重试、最终media_ended及protocol_completed；见video-recovery-verification.json与完整ZIP。浏览器关闭再打开会从媒体开头重新加载，本轮不把它视为帧级断点续播。
- 最终检查369项测试通过、build通过、lint零警告；Participant与Composer浏览器回归通过，git diff --check通过。日志quality-final.log、participant-final.log、composer-final.log。新增3项回归覆盖来源提示、媒体类型结束条件、嵌套按钮限制。

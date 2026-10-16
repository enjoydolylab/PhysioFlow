# 参与者回答名称修复流程

beta.22后继续核对输入配置错误路径。ScreenChecks加入既有ui.input_name_missing/duplicate错误，标明目标控件，显示中日文修复说明并定位到Response name字段。回答名字段补齐可访问名称和中日文显示。规则本身沿用原schema校验，未自动改写已配置名称。

同一控件可同时显示名称、范围或选项问题，行key由elementId和code共同构成，避免先前同元素多个问题产生重复React key。修复名称后，其余未修复的问题仍保留，检查面板不会误称基本检查通过。

实际Builder日语测试从同一输入的重复名称和逆向范围两个错误开始，在预览中点击定位返回编辑并聚焦名称；清空显示缺失提示，修正名称后仍显示范围问题，修正范围后schema有效。第一个输入名称保持原值，撤销/重做可恢复错误/有效状态。证据artifacts/participant-name-stage/browser.json。533项测试、构建和零警告lint通过，完整回归尚待最终退出确认，日志/tmp/pf-response-name-quality.log、/tmp/pf-response-name-browser.log。

源码尚未提交、打包或推送。真人、正式设备、原素材条件仍未完成。

完整编辑器/运行/托管/SDK及多视口浏览器回归已确认退出0，字段名称最后一轮翻译的构建/lint和定向日语定位测试亦通过。本次为界面配置修复流程的增量，继续汇总后再按用户要求统一交付，暂不新增试用包。

## 回答字段总览

新增可折叠ResponseFields，列出当前画面的输入名称、类型、必填/可选、选择记录值和待修复状态。多选标明数组回答。每个字段可定位回Response name，支持从预览返回编辑；字段修改后总览同步更新。说明明确按钮动作可额外提交其他值，本总览不冒充完整运行输出或变量契约。

字段名和选项记录值标记translate=no，LanguageProvider尊重此标记，避免true/false/Response等合法机器值被词典翻译成其他显示内容。保留原schema值，不自动改名。长内容换行，列表和选项区有滚动边界。

实际Builder浏览器在中日英三种界面语言间切换，核对raw names/recorded values完全相同、仅查看不改变schema；从预览定位多选字段，重命名后总览更新；1280/375检查无横向溢出。证据artifacts/participant-name-stage/fields.json。初次测试选择器同时选入选项值，已缩小到名称区域后通过。533测试、构建和零警告lint通过；完整回归仍需核对最终退出，日志/tmp/pf-response-fields-quality.log、/tmp/pf-response-fields-browser.log。

完整编辑器/运行/托管/SDK与多视口浏览器回归已确认退出0。窄屏总览截图已视觉检查，并补齐Configure按钮翻译。名称修复与回答字段总览构成本轮设计检查阶段，下一步统一交付；正式使用效果仍需真人试用。

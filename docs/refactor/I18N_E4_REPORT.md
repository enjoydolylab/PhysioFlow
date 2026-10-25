# i18n batch E4 report

Final audit: **present 2862 / missing 0 / allowlisted 467**, across 252 source files and 3329 unique candidates.

Validation: `npm test` — **544 passed, 0 failed, 1 skipped** (545 total); `npm run lint -- --max-warnings=0` — passed; `npm run build` — passed. No commit was created.

## Method and scope

Started with the generated audit's Missing candidates section (737 unique missing candidates), grouped its locations by source file, and processed 121 files in descending initial missing count. Ran the audit after each file, recording an immediate missing count of zero for each. Shared dictionary and allowlist values can resolve candidates in later files before their turn. The table's before column preserves the original per-file backlog; after is the final measured per-file count. Allowlisted counts original missing candidates from that file now covered by the allowlist, so shared strings can appear in several file rows. The remaining 131 source files started and ended at zero.

Added 567 explicit Chinese/Japanese catalog rows, migrated relevant JSX display text/attributes/interpolated values to useT, registered numbered diagnostic templates with escaped punctuation and specific-message precedence, and changed the remaining Chinese-only flow hints to English source keys. Existing questionnaire multilingual copy, preset question wording, export documentation, identifiers, CSS/SVG, and shortcut key names remain unchanged. Startup error copy now translates before the provider mounts.

The initial generated audit already showed zero missing for src/core/questionnaireModel.js, src/deployment/deploymentBundle.js, src/hosted/**, src/data/graphExport.js, src/data/jointExport.js and src/readiness.js. Their original content was preserved. src/exporter.js had six remaining candidates, all allowlisted as data.

## Removed alias entries

- zh: `'回答已记录':'回答已记录'` (duplicates the English key Responses recorded).
- ja: `'回答已记录':'回答が記録されました'` (duplicates the English key Responses recorded).

## Per-file results

| file | before | after | allowlisted |
| --- | ---: | ---: | ---: |
| src/QuestionnaireFormV2.jsx | 39 | 0 | 36 |
| src/composer/Catalogs.jsx | 35 | 0 | 4 |
| src/QuestionnaireWorkspace.jsx | 24 | 0 | 3 |
| src/usability/studyMetrics.js | 24 | 0 | 1 |
| src/QuestionnaireEditorV2.jsx | 23 | 0 | 1 |
| src/devices/deviceConnector.js | 21 | 0 | 0 |
| src/analysis/FeaturePanel.jsx | 20 | 0 | 2 |
| src/flowEngine.js | 19 | 0 | 0 |
| src/GraphRuntimeRunnerPage.jsx | 19 | 0 | 13 |
| src/analysis/signal/quality.js | 18 | 0 | 0 |
| src/flowCanvas/ShortcutsModal.jsx | 17 | 0 | 7 |
| src/sdk/componentPackage.js | 17 | 0 | 0 |
| src/bioDBClient.js | 16 | 0 | 2 |
| src/devices/brainflowConnector.js | 14 | 0 | 1 |
| src/assetStore.js | 13 | 0 | 1 |
| src/composer/useComposerState.js | 12 | 0 | 3 |
| src/DataPanel.jsx | 12 | 0 | 5 |
| src/fsStorage.js | 12 | 0 | 3 |
| src/integrity.js | 12 | 0 | 0 |
| src/physioDBMapping.js | 12 | 0 | 1 |
| src/analysis/AffectMap.jsx | 11 | 0 | 0 |
| src/analysis/ResponseCharts.jsx | 11 | 0 | 0 |
| src/legacy/migrateProtocolV1.js | 11 | 0 | 2 |
| src/physioDBClient.js | 11 | 0 | 2 |
| src/QuestionnaireForm.jsx | 11 | 0 | 8 |
| src/Analytics.jsx | 10 | 0 | 0 |
| src/FlowWorkspaceOverlay.jsx | 10 | 0 | 0 |
| src/HierarchyManager.jsx | 10 | 0 | 0 |
| src/analysis/WindowCards.jsx | 9 | 0 | 4 |
| src/ParticipantLaunchPage.jsx | 9 | 0 | 0 |
| src/SessionManager.jsx | 9 | 0 | 2 |
| src/dataStore.js | 8 | 0 | 1 |
| src/devices/museProtocol.js | 8 | 0 | 8 |
| src/Inspector.jsx | 8 | 0 | 7 |
| src/physioDBTransfer.js | 8 | 0 | 0 |
| src/PhysioDBUpload.jsx | 8 | 0 | 2 |
| src/runtime/runtimeMachine.js | 8 | 0 | 0 |
| src/analysis/charts.js | 7 | 0 | 7 |
| src/analysis/signal/liveQuality.js | 7 | 0 | 0 |
| src/localWorkspace.js | 7 | 0 | 1 |
| src/QuestionnaireLibrary.jsx | 7 | 0 | 0 |
| src/storage.js | 7 | 0 | 0 |
| src/analysis/TimelineView.jsx | 6 | 0 | 4 |
| src/brainFlowRecording.js | 6 | 0 | 1 |
| src/devices/museConnector.js | 6 | 0 | 0 |
| src/domain.js | 6 | 0 | 6 |
| src/exporter.js | 6 | 0 | 6 |
| src/ResourceLibrary.jsx | 6 | 0 | 0 |
| src/RuntimeRunnerPage.jsx | 6 | 0 | 2 |
| src/theme.js | 6 | 0 | 0 |
| src/analysis/windowData.js | 5 | 0 | 0 |
| src/CalibrationRunner.jsx | 5 | 0 | 5 |
| src/composer/useCatalogActions.js | 5 | 0 | 0 |
| src/FlowCanvas.jsx | 5 | 0 | 1 |
| src/flowCanvas/CanvasContextMenu.jsx | 5 | 0 | 0 |
| src/flowCanvas/NodeCard.jsx | 5 | 0 | 0 |
| src/operator/deviceSnapshot.js | 5 | 0 | 2 |
| src/physioDBServiceClient.js | 5 | 0 | 0 |
| src/runtime/controlHandlerRegistry.js | 5 | 0 | 0 |
| src/analysis/CrossSessionCompare.jsx | 4 | 0 | 4 |
| src/analysis/physioDBWindow.js | 4 | 0 | 0 |
| src/composer/GroupBatchEditor.jsx | 4 | 0 | 4 |
| src/devices/exampleSimulatedConnector.js | 4 | 0 | 1 |
| src/flowCanvas/CanvasOverlays.jsx | 4 | 0 | 0 |
| src/flowCanvas/CanvasToolbar.jsx | 4 | 0 | 0 |
| src/main.jsx | 4 | 0 | 0 |
| src/ParticipantUiBuilder.jsx | 4 | 0 | 4 |
| src/PreRunChecklist.jsx | 4 | 0 | 2 |
| src/runtime/replayRuntime.js | 4 | 0 | 0 |
| src/sdk/exampleReactionButtonPackage.js | 4 | 0 | 4 |
| src/TemplateConfig.jsx | 4 | 0 | 0 |
| src/TestRunExitButton.jsx | 4 | 0 | 0 |
| src/analysis/LiveChart.jsx | 3 | 0 | 0 |
| src/analysis/MultiChannelChart.jsx | 3 | 0 | 0 |
| src/analysis/signal/pipeline.js | 3 | 0 | 0 |
| src/analysis/testRunPayload.js | 3 | 0 | 0 |
| src/composer/Canvas.jsx | 3 | 0 | 3 |
| src/composer/RepeatSequenceEditor.jsx | 3 | 0 | 3 |
| src/composer/ResponseOptionsEditor.jsx | 3 | 0 | 0 |
| src/QuestionnaireDesigner.jsx | 3 | 0 | 2 |
| src/analysis/signal/stats.js | 2 | 0 | 0 |
| src/composer/Inspector.jsx | 2 | 0 | 1 |
| src/composer/StimulusPoolEditor.jsx | 2 | 0 | 0 |
| src/devices/transports/webBluetooth.js | 2 | 0 | 0 |
| src/flowCanvas/layout.js | 2 | 0 | 2 |
| src/flowCanvas/NodePreviewModal.jsx | 2 | 0 | 0 |
| src/FlowJsonEditor.jsx | 2 | 0 | 1 |
| src/Modal.jsx | 2 | 0 | 2 |
| src/ParticipantMedia.jsx | 2 | 0 | 1 |
| src/runtime/expression.js | 2 | 0 | 0 |
| src/tauriStorage.js | 2 | 0 | 1 |
| src/WorkspaceShell.jsx | 2 | 0 | 0 |
| src/analysis/BrainFlowSignalChart.jsx | 1 | 0 | 0 |
| src/analysis/chartGeometry.js | 1 | 0 | 1 |
| src/analysis/signal/preprocess.js | 1 | 0 | 0 |
| src/analysis/signal/spectrum.js | 1 | 0 | 0 |
| src/analysis/SignalWaveform.jsx | 1 | 0 | 0 |
| src/collaboration/changeSets.js | 1 | 0 | 1 |
| src/composer/NodeInspector.jsx | 1 | 0 | 1 |
| src/composer/toolbox.js | 1 | 0 | 1 |
| src/ComposerV2.jsx | 1 | 0 | 1 |
| src/constants.js | 1 | 0 | 1 |
| src/engine.js | 1 | 0 | 0 |
| src/flowCanvas/CanvasLayers.jsx | 1 | 0 | 1 |
| src/flowCanvas/snapshots.js | 1 | 0 | 0 |
| src/flowCanvas/useCanvasNodes.js | 1 | 0 | 0 |
| src/flowCanvas/useNodeDrag.js | 1 | 0 | 1 |
| src/GuidePanel.jsx | 1 | 0 | 1 |
| src/operator/runtimeMonitor.js | 1 | 0 | 1 |
| src/participantUi/constants.js | 1 | 0 | 1 |
| src/participantUi/PositionFields.jsx | 1 | 0 | 1 |
| src/participantUi/ScreenChecks.jsx | 1 | 0 | 1 |
| src/participantUi/StyleEditor.jsx | 1 | 0 | 1 |
| src/PhysioDBAnalysis.jsx | 1 | 0 | 1 |
| src/physioDBConnection.js | 1 | 0 | 1 |
| src/PhysioDBSessionBinding.jsx | 1 | 0 | 1 |
| src/projectStage.js | 1 | 0 | 0 |
| src/ProtocolBioDBConfig.jsx | 1 | 0 | 1 |
| src/runtime/testNavigation.js | 1 | 0 | 1 |
| src/RuntimeContent.jsx | 1 | 0 | 1 |
| src/useGuideDialog.js | 1 | 0 | 1 |
| src/AdminMonitorPage.jsx | 0 | 0 | 0 |
| src/App.jsx | 0 | 0 | 0 |
| src/AttentionCheckRunner.jsx | 0 | 0 | 0 |
| src/BioDBSettings.jsx | 0 | 0 | 0 |
| src/CognitiveTaskRunner.jsx | 0 | 0 | 0 |
| src/Dashboard.jsx | 0 | 0 | 0 |
| src/DeviceMonitorPanel.jsx | 0 | 0 | 0 |
| src/MediaSettings.jsx | 0 | 0 | 0 |
| src/MediaStep.jsx | 0 | 0 | 0 |
| src/Onboarding.jsx | 0 | 0 | 0 |
| src/OperatorMonitorPage.jsx | 0 | 0 | 0 |
| src/ParticipantRenderer.jsx | 0 | 0 | 0 |
| src/ParticipantUiCanvas.jsx | 0 | 0 | 0 |
| src/PhysioDBTestResult.jsx | 0 | 0 | 0 |
| src/ResponseRunner.jsx | 0 | 0 | 0 |
| src/SamFigure.jsx | 0 | 0 | 0 |
| src/TaskGuide.jsx | 0 | 0 | 0 |
| src/ThemeSettings.jsx | 0 | 0 | 0 |
| src/analysis/SignalQualityNotice.jsx | 0 | 0 | 0 |
| src/analysis/responseData.js | 0 | 0 | 0 |
| src/analysis/sessionReview.js | 0 | 0 | 0 |
| src/analysis/signal/features.js | 0 | 0 | 0 |
| src/analysis/timelineData.js | 0 | 0 | 0 |
| src/app/AppHeader.jsx | 0 | 0 | 0 |
| src/app/legacyBuilder.jsx | 0 | 0 | 0 |
| src/app/sessionSetup.jsx | 0 | 0 | 0 |
| src/app/uiHelpers.js | 0 | 0 | 0 |
| src/app/useGlobalShortcuts.js | 0 | 0 | 0 |
| src/app/useUndoRedo.js | 0 | 0 | 0 |
| src/assetChecksum.js | 0 | 0 | 0 |
| src/collaboration/index.js | 0 | 0 | 0 |
| src/composer/GroupSequenceEditor.jsx | 0 | 0 | 0 |
| src/composer/Header.jsx | 0 | 0 | 0 |
| src/composer/Palette.jsx | 0 | 0 | 0 |
| src/composer/Sequence.jsx | 0 | 0 | 0 |
| src/composer/TrialGenerator.jsx | 0 | 0 | 0 |
| src/composer/labels.js | 0 | 0 | 0 |
| src/composer/mediaPerformance.js | 0 | 0 | 0 |
| src/composer/sequenceModel.js | 0 | 0 | 0 |
| src/composer/translate.js | 0 | 0 | 0 |
| src/core/componentRegistry.js | 0 | 0 | 0 |
| src/core/experimentStructure.js | 0 | 0 | 0 |
| src/core/flowSnapshots.js | 0 | 0 | 0 |
| src/core/freezeProtocolGraph.js | 0 | 0 | 0 |
| src/core/graphCommands.js | 0 | 0 | 0 |
| src/core/groupCommands.js | 0 | 0 | 0 |
| src/core/groupSegment.js | 0 | 0 | 0 |
| src/core/groupSequence.js | 0 | 0 | 0 |
| src/core/ids.js | 0 | 0 | 0 |
| src/core/index.js | 0 | 0 | 0 |
| src/core/inputValidation.js | 0 | 0 | 0 |
| src/core/mediaPresentation.js | 0 | 0 | 0 |
| src/core/mediaReadiness.js | 0 | 0 | 0 |
| src/core/mediaUrl.js | 0 | 0 | 0 |
| src/core/migrationReview.js | 0 | 0 | 0 |
| src/core/participantUi.js | 0 | 0 | 0 |
| src/core/protocolGraph.js | 0 | 0 | 0 |
| src/core/protocolGraphDiff.js | 0 | 0 | 0 |
| src/core/protocolSelectors.js | 0 | 0 | 0 |
| src/core/questionnaireModel.js | 0 | 0 | 0 |
| src/core/repeatSegment.js | 0 | 0 | 0 |
| src/core/responseOptions.js | 0 | 0 | 0 |
| src/core/sequenceConstraints.js | 0 | 0 | 0 |
| src/core/serialization.js | 0 | 0 | 0 |
| src/core/sharedNodeEdits.js | 0 | 0 | 0 |
| src/core/stimulusRandomization.js | 0 | 0 | 0 |
| src/core/subflowCommands.js | 0 | 0 | 0 |
| src/core/taskTemplates.js | 0 | 0 | 0 |
| src/core/uiStyle.js | 0 | 0 | 0 |
| src/core/validateProtocolGraph.js | 0 | 0 | 0 |
| src/core/variableCommands.js | 0 | 0 | 0 |
| src/data/channelDictionary.js | 0 | 0 | 0 |
| src/data/eventSchemaRegistry.js | 0 | 0 | 0 |
| src/data/graphExport.js | 0 | 0 | 0 |
| src/data/graphIntegrity.js | 0 | 0 | 0 |
| src/data/index.js | 0 | 0 | 0 |
| src/data/jointExport.js | 0 | 0 | 0 |
| src/databaseRefresh.js | 0 | 0 | 0 |
| src/deployment/deploymentAssets.js | 0 | 0 | 0 |
| src/deployment/deploymentBundle.js | 0 | 0 | 0 |
| src/deployment/index.js | 0 | 0 | 0 |
| src/devices/index.js | 0 | 0 | 0 |
| src/externalForms.js | 0 | 0 | 0 |
| src/flowCanvas/Minimap.jsx | 0 | 0 | 0 |
| src/flowCanvas/PalettePanel.jsx | 0 | 0 | 0 |
| src/flowCanvas/interactions.js | 0 | 0 | 0 |
| src/flowCanvas/useCanvasPan.js | 0 | 0 | 0 |
| src/flowCanvas/useCanvasShortcuts.js | 0 | 0 | 0 |
| src/flowCanvas/useWheelZoom.js | 0 | 0 | 0 |
| src/flowIcons.jsx | 0 | 0 | 0 |
| src/hosted/hostedHttp.js | 0 | 0 | 0 |
| src/hosted/hostedRuntimeSync.js | 0 | 0 | 0 |
| src/hosted/hostedService.js | 0 | 0 | 0 |
| src/hosted/hostedStateStore.js | 0 | 0 | 0 |
| src/hosted/index.js | 0 | 0 | 0 |
| src/hosted/participantBootstrap.js | 0 | 0 | 0 |
| src/hosted/participantLaunch.js | 0 | 0 | 0 |
| src/hosted/participantRoute.js | 0 | 0 | 0 |
| src/i18nMessage.js | 0 | 0 | 0 |
| src/operator/experimentPreflight.js | 0 | 0 | 0 |
| src/operator/signalReadiness.js | 0 | 0 | 0 |
| src/operator/useRuntimeMonitor.js | 0 | 0 | 0 |
| src/participantUi/ScreenFrame.jsx | 0 | 0 | 0 |
| src/participantUi/SelectionInspector.jsx | 0 | 0 | 0 |
| src/participantUi/ThemeEditor.jsx | 0 | 0 | 0 |
| src/participantUi/UiIcon.jsx | 0 | 0 | 0 |
| src/participantUi/UiPropertyEditor.jsx | 0 | 0 | 0 |
| src/participantUi/arrange.js | 0 | 0 | 0 |
| src/participantUi/layoutGeometry.js | 0 | 0 | 0 |
| src/participantUi/preview/ParticipantPreview.jsx | 0 | 0 | 0 |
| src/participantUi/screenPresets.js | 0 | 0 | 0 |
| src/participantUi/tree.js | 0 | 0 | 0 |
| src/participantUi/tree/StructureTree.jsx | 0 | 0 | 0 |
| src/participantUi/useBuilderT.js | 0 | 0 | 0 |
| src/participantUi/useParticipantUiHistory.js | 0 | 0 | 0 |
| src/participantUi/useParticipantUiState.js | 0 | 0 | 0 |
| src/questionnaireMatrix.js | 0 | 0 | 0 |
| src/readiness.js | 0 | 0 | 0 |
| src/runnerState.js | 0 | 0 | 0 |
| src/runtime/deviceRuntime.js | 0 | 0 | 0 |
| src/runtime/eventEnvelope.js | 0 | 0 | 0 |
| src/runtime/index.js | 0 | 0 | 0 |
| src/runtime/mediaResources.js | 0 | 0 | 0 |
| src/runtime/nodeSchema.js | 0 | 0 | 0 |
| src/runtime/questionnaireCheckpoint.js | 0 | 0 | 0 |
| src/runtime/sessionPersistence.js | 0 | 0 | 0 |
| src/runtime/useOperatorControls.js | 0 | 0 | 0 |
| src/runtimeMachine.js | 0 | 0 | 0 |
| src/sdk/index.js | 0 | 0 | 0 |
| src/sessionReview.js | 0 | 0 | 0 |
| src/visualAngle.js | 0 | 0 | 0 |

## Allowlist additions with reasons

172 unique additions: 115 data, 15 content, 42 multilingual. data covers export documentation and technical values; content covers authored examples and generated template names; multilingual covers existing language-specific translations or deliberately combined language labels.

| Source file first processed | Candidate | Reason |
| --- | --- | --- |
| src/QuestionnaireFormV2.jsx | ← 前へ | multilingual |
| src/QuestionnaireFormV2.jsx | ← 上一题 | multilingual |
| src/QuestionnaireFormV2.jsx | ← Previous | multilingual |
| src/QuestionnaireFormV2.jsx | 必填 | multilingual |
| src/QuestionnaireFormV2.jsx | 必須 | multilingual |
| src/QuestionnaireFormV2.jsx | 残り時間 | multilingual |
| src/QuestionnaireFormV2.jsx | 次の3項目について評価してください。 | multilingual |
| src/QuestionnaireFormV2.jsx | 次へ → | multilingual |
| src/QuestionnaireFormV2.jsx | 得点 | multilingual |
| src/QuestionnaireFormV2.jsx | 得分 | multilingual |
| src/QuestionnaireFormV2.jsx | 唤醒度 | multilingual |
| src/QuestionnaireFormV2.jsx | 回答済み | multilingual |
| src/QuestionnaireFormV2.jsx | 回答して次へ → | multilingual |
| src/QuestionnaireFormV2.jsx | 控制感 | multilingual |
| src/QuestionnaireFormV2.jsx | 没有题目 | multilingual |
| src/QuestionnaireFormV2.jsx | 请回答所有必填项目。 | multilingual |
| src/QuestionnaireFormV2.jsx | 请评价以下三个维度。 | multilingual |
| src/QuestionnaireFormV2.jsx | 剩余时间 | multilingual |
| src/QuestionnaireFormV2.jsx | 送信 | multilingual |
| src/QuestionnaireFormV2.jsx | 提交 | multilingual |
| src/QuestionnaireFormV2.jsx | 提交并继续 → | multilingual |
| src/QuestionnaireFormV2.jsx | 题目 | multilingual |
| src/QuestionnaireFormV2.jsx | 未回答の項目があります。赤い行を確認してください。 | multilingual |
| src/QuestionnaireFormV2.jsx | 下一题 → | multilingual |
| src/QuestionnaireFormV2.jsx | 已回答 | multilingual |
| src/QuestionnaireFormV2.jsx | 愉悦度 | multilingual |
| src/QuestionnaireFormV2.jsx | 質問 | multilingual |
| src/QuestionnaireFormV2.jsx | 質問がありません | multilingual |
| src/QuestionnaireFormV2.jsx | Arousal（覚醒度） | multilingual |
| src/QuestionnaireFormV2.jsx | Dominance（支配感） | multilingual |
| src/QuestionnaireFormV2.jsx | No questions | multilingual |
| src/QuestionnaireFormV2.jsx | Please answer every required row. | multilingual |
| src/QuestionnaireFormV2.jsx | Please rate the following three dimensions. | multilingual |
| src/QuestionnaireFormV2.jsx | Submit and continue → | multilingual |
| src/QuestionnaireFormV2.jsx | Time left | multilingual |
| src/QuestionnaireFormV2.jsx | Valence（快・不快度） | multilingual |
| src/composer/Catalogs.jsx | {n} | data |
| src/composer/Catalogs.jsx | {name} | data |
| src/composer/Catalogs.jsx | {total} | data |
| src/composer/Catalogs.jsx | SANDBOX-P001 | data |
| src/QuestionnaireWorkspace.jsx | ＋ 多语言翻译（可选） | multilingual |
| src/QuestionnaireWorkspace.jsx | button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]) | data |
| src/QuestionnaireWorkspace.jsx | Conditional display · 条件显示 | multilingual |
| src/usability/studyMetrics.js | observations[{0}] | data |
| src/QuestionnaireEditorV2.jsx | type,en,options,min,max,answer likert,Rate your experience,Not at all&#124;Very,1,5,5 | content |
| src/analysis/FeaturePanel.jsx | {0} Hz | data |
| src/analysis/FeaturePanel.jsx | pNN50 | data |
| src/GraphRuntimeRunnerPage.jsx | · v | data |
| src/GraphRuntimeRunnerPage.jsx | {count} | data |
| src/GraphRuntimeRunnerPage.jsx | BrainFlow agent samples.jsonl | data |
| src/GraphRuntimeRunnerPage.jsx | global-completion-v1 | data |
| src/GraphRuntimeRunnerPage.jsx | preflight failed | data |
| src/GraphRuntimeRunnerPage.jsx | preparation edited | data |
| src/GraphRuntimeRunnerPage.jsx | preview exited | data |
| src/GraphRuntimeRunnerPage.jsx | runner closed | data |
| src/GraphRuntimeRunnerPage.jsx | session end | data |
| src/flowCanvas/ShortcutsModal.jsx | Alt+Drag | data |
| src/flowCanvas/ShortcutsModal.jsx | Ctrl+A | data |
| src/flowCanvas/ShortcutsModal.jsx | Ctrl+C/V/D | data |
| src/flowCanvas/ShortcutsModal.jsx | Ctrl+F | data |
| src/flowCanvas/ShortcutsModal.jsx | Ctrl+Z / Ctrl+Shift+Z | data |
| src/flowCanvas/ShortcutsModal.jsx | Shift+Click | data |
| src/flowCanvas/ShortcutsModal.jsx | Space/Middle+Drag | data |
| src/bioDBClient.js | base64 | data |
| src/bioDBClient.js | utf8 | data |
| src/devices/brainflowConnector.js | acquisition agent samples.jsonl | data |
| src/assetStore.js | physioflow-assets-v1 | data |
| src/composer/useComposerState.js | .composer-node, .composer-port, .composer-wires | data |
| src/composer/useComposerState.js | {source} | data |
| src/DataPanel.jsx | 1h | data |
| src/DataPanel.jsx | 24h | data |
| src/DataPanel.jsx | 6h | data |
| src/DataPanel.jsx | created from PF Data panel (D3) | data |
| src/DataPanel.jsx | eda,hr | data |
| src/fsStorage.js | physioflow.current-run-pointer.v2 | data |
| src/fsStorage.js | physioflow.protocols.v1 | data |
| src/fsStorage.js | physioflow.sessions.v2 | data |
| src/physioDBMapping.js | .000Z | data |
| src/legacy/migrateProtocolV1.js | {0} migration draft | content |
| src/legacy/migrateProtocolV1.js | migrated-v1 | data |
| src/physioDBClient.js | streams/{0}/samples?{1} | data |
| src/physioDBClient.js | streams/{0}/samples?follow=true | data |
| src/QuestionnaireForm.jsx | ← 前の問題 | multilingual |
| src/QuestionnaireForm.jsx | 必填 / Required / 必須 | multilingual |
| src/QuestionnaireForm.jsx | 得分: | multilingual |
| src/QuestionnaireForm.jsx | hsl({0}, {1}%, {2}%) | data |
| src/analysis/WindowCards.jsx | 10px system-ui | data |
| src/analysis/WindowCards.jsx | 2d | data |
| src/analysis/WindowCards.jsx | 600 12px system-ui | data |
| src/analysis/WindowCards.jsx | 9px system-ui | data |
| src/SessionManager.jsx | {0} ms | data |
| src/dataStore.js | physioflow-data-v1 | data |
| src/devices/museProtocol.js | -4c4d-454d-96be-f03bac821358 | data |
| src/devices/museProtocol.js | AF7 | data |
| src/devices/museProtocol.js | AF8 | data |
| src/devices/museProtocol.js | p20 | data |
| src/devices/museProtocol.js | p21 | data |
| src/devices/museProtocol.js | p50 | data |
| src/devices/museProtocol.js | TP10 | data |
| src/devices/museProtocol.js | TP9 | data |
| src/Inspector.jsx | .instruction { font-family: Georgia, serif; } | data |
| src/Inspector.jsx | &lt;h1&gt;Hello&lt;/h1&gt; &lt;style&gt;h1{color:#197453;font-family:Georgia}&lt;/style&gt; | content |
| src/Inspector.jsx | Ctrl+C | data |
| src/Inspector.jsx | Ctrl+D | data |
| src/Inspector.jsx | Ctrl+V | data |
| src/Inspector.jsx | e.g. 1.2rem, 18px | data |
| src/Inspector.jsx | HTML / CSS / JS | data |
| src/PhysioDBUpload.jsx | 1, EEG1, uV | data |
| src/PhysioDBUpload.jsx | BrainFlow samples.jsonl | data |
| src/analysis/charts.js | 11px system-ui | data |
| src/analysis/charts.js | 600 13px system-ui | data |
| src/analysis/charts.js | 600 13px system-ui, -apple-system, sans-serif | data |
| src/analysis/charts.js | 9px monospace | data |
| src/analysis/charts.js | bold 10px system-ui | data |
| src/localWorkspace.js | physioflow-workspace-v1 | data |
| src/brainFlowRecording.js | utf-8 | data |
| src/domain.js | {0} / Step {1} | content |
| src/domain.js | {0} / Trial {1} | content |
| src/domain.js | Block {0} | content |
| src/domain.js | name: {0} → {1} | data |
| src/domain.js | New block | content |
| src/domain.js | New trial | content |
| src/exporter.js | 1. Use events.csv for raw timing and reconstruction. | data |
| src/exporter.js | 2. Use analysis_windows.csv for physiology window extraction. | data |
| src/exporter.js | 3. Use responses.csv for questionnaire outcomes, quick Response-node choices, reaction times, and branch variables. | data |
| src/exporter.js | 4. Check integrity_report.json before excluding or accepting a session. | data |
| src/exporter.js | 5. For external questionnaires, join answers from the external service by participant/session labels or appended URL parameters, and use external_questionnaire_* events for timing. | data |
| src/exporter.js | CC0 | data |
| src/CalibrationRunner.jsx | cm · | data |
| src/CalibrationRunner.jsx | CSS px | data |
| src/CalibrationRunner.jsx | px · 5° = | data |
| src/CalibrationRunner.jsx | px/° | data |
| src/FlowCanvas.jsx | {0} (copy) | content |
| src/operator/deviceSnapshot.js | EEG {0} | data |
| src/operator/deviceSnapshot.js | µV | data |
| src/composer/GroupBatchEditor.jsx | {content} | data |
| src/composer/GroupBatchEditor.jsx | {group} | data |
| src/devices/exampleSimulatedConnector.js | SIM-001 | data |
| src/ParticipantUiBuilder.jsx | 1024x768 | data |
| src/ParticipantUiBuilder.jsx | 1280x720 | data |
| src/ParticipantUiBuilder.jsx | 1920x1080 | data |
| src/ParticipantUiBuilder.jsx | 768x1024 | data |
| src/sdk/exampleReactionButtonPackage.js | A declarative SDK example that completes on button press. | content |
| src/sdk/exampleReactionButtonPackage.js | Reaction Button | content |
| src/sdk/exampleReactionButtonPackage.js | Reaction Button Example | content |
| src/sdk/exampleReactionButtonPackage.js | Respond when you are ready | content |
| src/composer/Canvas.jsx | {edges} | data |
| src/composer/Canvas.jsx | {nodes} | data |
| src/composer/RepeatSequenceEditor.jsx | {steps} | data |
| src/composer/RepeatSequenceEditor.jsx | {visits} | data |
| src/QuestionnaireDesigner.jsx | 问卷设计器 · Questionnaire designer · アンケート設計 | multilingual |
| src/QuestionnaireDesigner.jsx | type,en,options,min,max,answer likert,How satisfied?,Very dissatisfied&#124;Neutral&#124;Very satisfied,1,5,3 single_choice,Choose one,Yes&#124;No&#124;Maybe,,,Yes | content |
| src/flowCanvas/layout.js | M{0},{1} C{2},{3} {4},{5} {6},{7} | data |
| src/flowCanvas/layout.js | M{0},{1} L{2},{3} L{4},{5} L{6},{7} | data |
| src/FlowJsonEditor.jsx | flow · steps · layout | data |
| src/Modal.jsx | button, input, select, textarea, [tabindex]:not([tabindex="-1"]) | data |
| src/ParticipantMedia.jsx | participant-ui-media{0} {1} | data |
| src/tauriStorage.js | @tauri-apps/api/core | data |
| src/analysis/chartGeometry.js | {0}L{1} {2}L{3} {4}Z | data |
| src/collaboration/changeSets.js | operations[{0}] | data |
| src/composer/toolbox.js | M {0} {1} C {2} {3}, {4} {5}, {6} {7} | data |
| src/constants.js | iso8601 | data |
| src/flowCanvas/CanvasLayers.jsx | var(--green) | data |
| src/flowCanvas/useNodeDrag.js | button,input,select | data |
| src/GuidePanel.jsx | ~/Documents/PhysioFlow Data | data |
| src/operator/runtimeMonitor.js | physioflow.operator.v1 | data |
| src/participantUi/constants.js | &lt;div style="text-align:center"&gt;Custom HTML&lt;/div&gt; | content |
| src/physioDBConnection.js | physioflow.operator-connection.v1 | data |
| src/ProtocolBioDBConfig.jsx | e.g. exp_xxxxx | data |
| src/runtime/testNavigation.js | operator test navigation | data |
| src/useGuideDialog.js | button, a[href], input, select, textarea, [tabindex="0"] | data |
| src/main.jsx | padding:2rem;font-family:system-ui,sans-serif;color:#a32e25 | data |

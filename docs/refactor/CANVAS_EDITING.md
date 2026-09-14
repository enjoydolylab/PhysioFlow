# Canvas editing workflow

Implemented 2026-09-14.

## Layout modes

- Auto layout: drag a child to reorder its siblings. The insertion marker shows the destination. Dragging does not enable free layout.
- Free canvas: drag changes positions. Switching modes is explicit in the selected container's Layout mode field and is undoable.
- Entering free mode measures the current layout instead of running Auto arrange. Returning to flow restores original sizing while retaining content edits. Text may grow when edited.
- Auto arrange remains an explicit command.

## Screen and view

- Screen size is saved as `root.props.screenWidth` and `screenHeight`. Supported presets: 1280×720, 1920×1080, 1024×768 and 768×1024.
- Design pixels are independent of editor zoom. Fit considers both available width and height; manual zoom/pan disables automatic fitting until Fit is selected again.
- Fixed screens use the same dimensions in the participant renderer and preview. The outer view scales uniformly; overflow beyond the screen is clipped.
- Existing schemas without screen dimensions retain responsive runtime rendering. The editor labels this explicitly. Choose a fixed screen size to opt in; existing experiments are not silently migrated.

## Editing controls

- Shift-click toggles selection. Dragging a selected element preserves the group; Escape cancels an active drag without saving it.
- Multiple selections have a dedicated inspector with selection list, duplicate/delete and alignment controls. Alignment requires unlocked positioned siblings.
- The single-element inspector groups position/size, content, appearance and advanced settings. Position fields apply on Enter or blur; Escape cancels the draft and non-positive dimensions are rejected. Locked elements disable property editing.
- Text saves only after entering text-edit mode by double-clicking; moving focus during ordinary selection does not rewrite text.
- Layers are available at the top of the element library. Select overlapping or locked elements through their layer entries.
- Locks prevent canvas selection/dragging, resize, keyboard movement and selected-element deletion; layer selection remains available for unlocking.
- Common color/alignment controls are directly available. Advanced appearance and bindings/actions are collapsed.
- Presets provide centered fixation, image/instructions, left/right stimuli and question/rating layouts. Replacement requires the existing confirmation and is undoable. Media presets intentionally require stimulus files.
- Screen checks identify out-of-screen elements and unconfigured media. Clicking an overflow entry selects the element.

## Verification and boundaries

- Node tests cover conversion/restoration, preset validity and centered fixation geometry.
- Browser tests cover flow reordering, explicit conversion, free dragging at multiple zoom levels and inside nested layouts, undo, alignment snapping, persisted resolution, lock/keyboard behavior, overflow, presets and proportional preview.
- The comparison preset's actual element bounds are compared between the editor and participant preview, including the media content's height.
- A 1600×1000 screenshot was inspected. Screenshots can be generated using `PHYSIOFLOW_CANVAS_SCREENSHOT` with `npm run test:e2e:participant-public`.
- These checks do not establish physical stimulus size or timing on laboratory computers. Display calibration and user task trials remain separate validation work. Dynamic bindings and external media may change content after authoring checks.

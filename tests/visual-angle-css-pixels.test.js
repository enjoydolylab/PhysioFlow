import test from 'node:test';
import assert from 'node:assert/strict';
import { getViewportDimensions, calibrationReport } from '../src/visualAngle.js';
test('HiDPI calibration uses CSS screen pixels without doubling stimulus size', () => {
  const original = globalThis.window;
  try {
    globalThis.window = {screen:{width:1710,height:1112},devicePixelRatio:2};
    const size = getViewportDimensions();
    assert.deepEqual(size,{widthPx:1710,heightPx:1112,devicePixelRatio:2});
    const report=calibrationReport({displayWidthPx:size.widthPx,displayHeightPx:size.heightPx,displayWidthCm:60,displayHeightCm:34,viewingDistanceCm:60});
    assert.equal(report.display_width_cm,60);
    assert.equal(report.display_height_cm,34);
    assert.ok(report.pixels_per_degree > 29 && report.pixels_per_degree < 31);
  } finally { if (original === undefined) delete globalThis.window; else globalThis.window=original; }
});

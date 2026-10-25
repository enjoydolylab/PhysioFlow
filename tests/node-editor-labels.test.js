import test from 'node:test';
import assert from 'node:assert/strict';
import { composerStrings } from '../src/composer/composerStrings.js';

test('node editor labels distinguish view/edit and cover every library element and hint', () => {
  const ja = composerStrings.ja;
  assert.notEqual(ja.View, ja['✎ Edit']);
  for (const key of ['Settings', 'Screen', 'Previous step', 'Next step', 'Content', 'Form', 'Layout group', 'Shapes', 'Text', 'Media', 'Html', 'Input', 'Button', 'Progress', 'Layout', 'Screen', 'Divider', 'Rectangle', 'Ellipse', 'Group children in a row or column', 'Heading or body copy', 'Image, audio or video', 'Response field', 'Continue / action button', 'Progress indicator', 'Custom HTML fragment', 'Horizontal or vertical separator line', 'Filled rectangle shape', 'Filled ellipse / circle shape', 'Duplicate', 'Copy', 'Paste', 'Move up', 'Move down', 'Bring to front', 'Send to back', 'Edit style', 'Delete']) {
    assert.ok(ja[key], key);
    assert.ok(!ja[key].includes('???'), key);
    if (key !== 'Html') assert.notEqual(ja[key], key, key);
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { composerStrings } from '../src/composer/composerStrings.js';
import { LIBRARY_GROUPS } from '../src/participantUi/constants.js';

test('every library group and root inspector state is localized in Japanese and Chinese', () => {
  for (const language of ['ja', 'zh']) {
    for (const key of [...LIBRARY_GROUPS.map(group => group.label === 'Layout' ? 'Layout group' : group.label), 'Screen elements', 'Screen overview', 'Checks passing', 'No elements yet']) {
      assert.ok(composerStrings[language][key], `${language}: ${key}`);
      assert.notEqual(composerStrings[language][key], key);
    }
  }
});

test('node editor labels distinguish view/edit and cover every library element and hint', () => {
  const ja = composerStrings.ja;
  assert.notEqual(ja.View, ja['✎ Edit']);
  for (const key of ['Settings', 'Screen', 'Previous step', 'Next step', 'Content', 'Form', 'Layout group', 'Shapes', 'Text', 'Media', 'Html', 'Input', 'Button', 'Progress', 'Layout', 'Screen', 'Divider', 'Rectangle', 'Ellipse', 'Group children in a row or column', 'Heading or body copy', 'Image, audio or video', 'Response field', 'Continue / action button', 'Progress indicator', 'Custom HTML fragment', 'Horizontal or vertical separator line', 'Filled rectangle shape', 'Filled ellipse / circle shape', 'Duplicate', 'Copy', 'Paste', 'Move up', 'Move down', 'Bring to front', 'Send to back', 'Edit style', 'Delete']) {
    assert.ok(ja[key], key);
    assert.ok(!ja[key].includes('???'), key);
    if (key !== 'Html') assert.notEqual(ja[key], key, key);
  }
});

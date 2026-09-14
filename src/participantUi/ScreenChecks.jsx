import { elementLabel } from './tree.js';

export function ScreenChecks({ elements, boundsIssues, fixedSize, preview, onLocate, onPreview }) {
  const media = elements.filter(({element}) => element.type === 'Media' && !String(element.props?.sourceUrl || '').trim() && !element.bindings?.sourceUrl);
  const overflow = elements.filter(({element}) => boundsIssues.includes(element.id));
  const label = element => elementLabel(element) || element.props?.alt || `${element.type} ${elements.findIndex(item => item.element.id === element.id) + 1}`;
  return <details className="ui-screen-checks">
    <summary>Screen checks · {overflow.length} outside screen · {media.length} missing media</summary>
    <div className="ui-check-heading"><b>{overflow.length + media.length ? 'Elements to check' : 'Basic checks passed'}</b><button type="button" onClick={onPreview}>{preview ? 'Back to editing' : 'Preview participant screen'}</button></div>
    {!fixedSize && <p>This is a responsive screen. Choose a Screen size above so the editor and the run share the same fixed resolution.</p>}
    {preview && overflow.length > 0 && <p>These out-of-bounds results come from the last edit. Locate returns to the editor so you can fix them.</p>}
    {overflow.map(({element}) => <div className="ui-check-row" key={`bounds-${element.id}`}>
      <div><b>Outside screen: {label(element)}</b><small>Part of this element sits outside the screen. Check its position or size.</small></div>
      <button type="button" aria-label={`Locate out-of-bounds element ${label(element)}`} onClick={() => onLocate(element.id, 'Element X')}>Locate and fix</button>
    </div>)}
    {media.map(({element}) => <div className="ui-check-row" key={`media-${element.id}`}>
      <div><b>Missing media: {label(element)}</b><small>No image, audio or video source is configured yet.</small></div>
      <button type="button" aria-label={`Configure media ${label(element)}`} onClick={() => onLocate(element.id, 'Media source URL')}>Configure</button>
    </div>)}
    {!overflow.length && !media.length && <p>No out-of-bounds elements or missing media sources were found. Still preview to confirm the actual content; this check does not verify that media links load or that the timing is correct.</p>}
  </details>;
}

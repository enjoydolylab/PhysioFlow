import { useBuilderT } from './useBuilderT.js';
import { elementLabel } from './tree.js';

export function ScreenChecks({ elements, boundsIssues, fixedSize, preview, onLocate, onPreview }) {
  const t = useBuilderT();
  const media = elements.filter(({element}) => element.type === 'Media' && !String(element.props?.sourceUrl || '').trim() && !element.bindings?.sourceUrl);
  const overflow = elements.filter(({element}) => boundsIssues.includes(element.id));
  const label = element => elementLabel(element) || element.props?.alt || `${element.type} ${elements.findIndex(item => item.element.id === element.id) + 1}`;
  return <details className="ui-screen-checks">
    <summary>{t('Screen checks')} · {overflow.length} {t('outside screen')} · {media.length} {t('missing media')}</summary>
    <div className="ui-check-heading"><b>{t(overflow.length + media.length ? 'Elements to check' : 'Basic checks passed')}</b><button type="button" onClick={onPreview}>{t(preview ? 'Back to editing' : 'Preview participant screen')}</button></div>
    {!fixedSize && <p>{t("This is a responsive screen. Choose a Screen size above so the editor and the run share the same fixed resolution.")}</p>}
    {preview && overflow.length > 0 && <p>{t("These out-of-bounds results come from the last edit. Locate returns to the editor so you can fix them.")}</p>}
    {overflow.map(({element}) => <div className="ui-check-row" key={`bounds-${element.id}`}>
      <div><b>{t('Outside screen')}: {label(element)}</b><small>{t("Part of this element sits outside the screen. Check its position or size.")}</small></div>
      <button type="button" aria-label={t('Locate out-of-bounds element {name}').replace('{name}', label(element))} onClick={() => onLocate(element.id, 'Element X')}>{t("Locate and fix")}</button>
    </div>)}
    {media.map(({element}) => <div className="ui-check-row" key={`media-${element.id}`}>
      <div><b>{t('Missing media')}: {label(element)}</b><small>{t("No image, audio or video source is configured yet.")}</small></div>
      <button type="button" aria-label={t('Configure media {name}').replace('{name}', label(element))} onClick={() => onLocate(element.id, 'Media source URL')}>{t("Configure")}</button>
    </div>)}
    {!overflow.length && !media.length && <p>{t("No out-of-bounds elements or missing media sources were found. Still preview to confirm the actual content; this check does not verify that media links load or that the timing is correct.")}</p>}
  </details>;
}

import {useT} from '../../i18n';
import {previewBindingChecks} from '../runtimeBindings.js';
export function BindingChecks({schema,context,onLocate}){
  const t=useT();
  const issues=previewBindingChecks(schema,context);
  return <details className="ui-preview-bindings">
    <summary>{t('Preview binding checks')} · {issues.length}</summary>
    <p>{t('Checks use the current preview data. Actual run values may differ.')}</p>
    {!issues.length&&<p>{t('All supported bindings have values in this preview data.')}</p>}
    {issues.map(issue=><div className="ui-preview-binding-issue" key={`${issue.elementId}:${issue.property}`} data-binding-property={issue.property} data-binding-element={issue.elementId}>
      <div><b>{t(issue.kind==='missing'?'Missing preview value':'Unused binding property')}</b><small translate="no">{issue.type} · {issue.property}</small><code translate="no">{issue.path}</code></div>
      {onLocate&&<button type="button" onClick={()=>onLocate(issue.elementId,issue.field)}>{t('Configure')}</button>}
    </div>)}
  </details>;
}

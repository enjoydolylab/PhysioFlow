import {bindingSuggestions} from './bindingExamples.js';
import {useT} from '../i18n';
import {bindingProperties} from './runtimeBindings.js';
const EXAMPLES={text:'variables.message',sourceUrl:'variables.mediaUrl',value:'progress.percent',max:'variables.maximum',html:'variables.html',color:'variables.textColor',background:'variables.background'};
export function RuntimeBindingsEditor({element,onChange,variables}){
  const t=useT();
  const suggestions=bindingSuggestions(variables);
  const properties=bindingProperties(element.type);
  const remove=property=>{const next={...element.bindings};delete next[property];onChange(next);};
  return <div className="ui-runtime-bindings" aria-label="Runtime bindings" tabIndex={-1}>
    <p>{t('Bindings replace saved properties with runtime values. Leave empty to use the saved property.')}</p>
    {properties.map(property=><label key={property}><code translate="no">{property}</code><input aria-label={`Runtime binding ${property}`} value={element.bindings?.[property] ?? ''} placeholder={EXAMPLES[property]} onChange={event=>{if(!event.target.value)remove(property);else onChange({...element.bindings,[property]:event.target.value});}} /><select translate="no" aria-label={`Choose binding ${property}`} value="" onChange={event=>event.target.value&&onChange({...element.bindings,[property]:event.target.value})}><option value="">{t('Choose a runtime value')}</option>{suggestions.map(path=><option key={path} value={path}>{path}</option>)}</select></label>)}
    {Object.keys(element.bindings || {}).filter(key=>!properties.includes(key)).map(property=><div key={property}><code translate="no">{property}</code><small>{t('This binding property is not used by this element.')}</small><button type="button" onClick={()=>remove(property)}>{t('Remove binding')}</button></div>)}
  </div>;
}

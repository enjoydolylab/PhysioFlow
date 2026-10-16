import {resolveUiBinding} from '../core/participantUi.js';
const CONTENT = {Text:['text'],Media:['sourceUrl'],Progress:['value','max'],Html:['html']};
export const bindingProperties = type => [...(CONTENT[type] || []),...(type === 'Media' ? [] : ['color','background'])];
export function previewBindingChecks(schema,context) {
  const issues=[];
  const stack=[schema.root];
  while(stack.length){
    const element=stack.pop();
    const supported=bindingProperties(element.type);
    for(const [property,path] of Object.entries(element.bindings || {})){
      if(!path || typeof path!=='string')continue;
      const used=supported.includes(property);
      if(!used || resolveUiBinding(path,context)===undefined)issues.push({elementId:element.id,type:element.type,property,path,kind:used?'missing':'unused',field:used?`Runtime binding ${property}`:'Runtime bindings'});
    }
    stack.push(...[...(element.children || [])].reverse());
  }
  return issues;
}

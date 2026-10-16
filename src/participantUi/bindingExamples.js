import {isJsonValue} from '../core/jsonValue.js';
const usable = variable => typeof variable?.name==='string' && /^[A-Za-z_][A-Za-z0-9_]*$/.test(variable.name);
export function previewExampleContext(variables){
  return {
    participant:{participant_id:'PREVIEW'},
    variables:Array.isArray(variables)?Object.fromEntries(variables.filter(v=>usable(v)&&isJsonValue(v.defaultValue??null)).map(v=>[v.name,structuredClone(v.defaultValue??null)])):{score:0},
    outputs:{},progress:{percent:40},timer:{elapsedMs:0},
  };
}
export function bindingSuggestions(variables=[]){
  return [...new Set([...(variables||[]).filter(usable).map(v=>`variables.${v.name}`),'participant.participant_id','progress.percent','timer.elapsedMs'])];
}

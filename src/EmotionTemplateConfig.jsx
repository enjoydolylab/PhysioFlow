import TemplateConfigPanel from './TemplateConfigPanel.jsx';
import {useState} from 'react';
import {useT} from './i18n.jsx';
import {validateEmotionTemplateConfig} from './emotionTemplateConfig.js';
export default function EmotionTemplateConfig({onCreate}) {
 const t=useT(),[open,setOpen]=useState(false),[config,setConfig]=useState({fixationMs:500,recoveryMs:3000,orderRule:'latin_square',seed:1}),[creating,setCreating]=useState(false),[error,setError]=useState('');
 const check=validateEmotionTemplateConfig(config);
 const update=(key,value)=>setConfig(current=>({...current,[key]:value}));
 const create=async()=>{if(!check.valid||creating)return;setCreating(true);setError('');try{await onCreate(check.options);setOpen(false);}catch(e){setError(e.message||String(e));}finally{setCreating(false);}};
 return <span className="template-launch"><button disabled={creating} onClick={()=>setOpen(value=>!value)} aria-expanded={open}>{t('Emotion')}</button>{open&&<TemplateConfigPanel title={t('Emotion template configuration')} busy={creating} onClose={()=>setOpen(false)}>
 <p>{t('Five conditions with SAM and emotion-label questions. Add a video for each condition before running.')}</p>
 {['fixationMs','recoveryMs','seed'].map(key=><label key={key}>{t(key==='fixationMs'?'Fixation duration (ms)':key==='recoveryMs'?'Recovery duration (ms)':'Random seed')}<input type="number" min={0} max={key==='seed'?2147483647:3600000} step={1} value={config[key]} disabled={creating} onChange={e=>update(key,e.target.value)}/></label>)}
 <label>{t('Condition order')}<select value={config.orderRule} disabled={creating} onChange={e=>update('orderRule',e.target.value)}><option value="fixed">{t('Fixed order')}</option><option value="random">{t('Random order')}</option><option value="latin_square">{t('Latin square')}</option></select></label>
 {check.errors.map(message=><p role="alert" key={message}>{t(message)}</p>)}{error&&<p role="alert">{error}</p>}
 <div className="template-config-actions"><button className="primary" disabled={!check.valid||creating} onClick={create}>{t(creating?'Creating…':'Create')}</button><button disabled={creating} onClick={()=>setOpen(false)}>{t('Cancel')}</button>
 </div></TemplateConfigPanel>}</span>;
}

import {useEffect,useRef,useId} from 'react';
import {useT} from './i18n.jsx';
import './template-config.css';
export default function TemplateConfigPanel({title,busy,onClose,children}) {
 const t=useT(),panel=useRef(null),close=useRef(onClose),busyRef=useRef(busy),id=useId();
 close.current=onClose;busyRef.current=busy;
 useEffect(()=>{
  const trigger=panel.current.closest('.template-launch')?.querySelector(':scope > button') || document.activeElement;
  const controls=()=>[...panel.current.querySelectorAll('button,input,select,textarea,[tabindex="0"]')].filter(element=>!element.disabled);
  (panel.current.querySelector('input,select')||panel.current).focus();
  const keyboard=event=>{
   if(event.key==='Escape'&&!busyRef.current){event.preventDefault();event.stopPropagation();close.current();}
   if(event.key==='Tab'){
    const items=controls(),first=items[0],last=items.at(-1);
    if(!items.length){event.preventDefault();panel.current.focus();return;}
    if(event.shiftKey&&(document.activeElement===first||document.activeElement===panel.current)){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
   }
  };
  document.addEventListener('keydown',keyboard,true);
  return()=>{document.removeEventListener('keydown',keyboard,true);if(trigger?.isConnected)trigger.focus();};
 },[]);
 return <div className="template-config-overlay" onMouseDown={event=>{if(event.target===event.currentTarget&&!busy)onClose();}}>
  <section className="template-config-panel setup-note" ref={panel} role="dialog" aria-modal="true" aria-labelledby={id} aria-busy={busy} tabIndex={-1}>
   <header><div><small>{t('Configure before creating')}</small><h2 id={id}>{title}</h2></div><button type="button" disabled={busy} aria-label={t('Close')} onClick={onClose}>×</button></header>
   <div className="template-config-body">{children}</div>
  </section>
 </div>;
}

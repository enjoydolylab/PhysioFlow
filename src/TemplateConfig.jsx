import { useState } from 'react';
import { useT } from './i18n.jsx';
import { validateTemplateConfig } from './templateConfigValidation.js';

export default function TemplateButton({ label, onCreate, templateKey }) {
  const t = useT();
  const [creationError, setCreationError] = useState('');
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const [cfg, setCfg] = useState(templateKey === 'stroop'
    ? { trials: 16, practice: true, jitter: 300 }
    : { trials: 40, goRatio: 70, practice: true, jitter: 250 }
  );

  const check = validateTemplateConfig(templateKey, cfg);
  const handleCreate = async () => {
    if (!check.valid || creating) return;
    setCreating(true); setCreationError('');
    try { await onCreate({ ...cfg, trials: Number(cfg.trials) }); setOpen(false); }
    catch (error) { setCreationError(error.message || String(error)); }
    finally { setCreating(false); }
  };

  return <span style={{ position: 'relative', display: 'inline-block' }}>
    <button onClick={() => setOpen(o => !o)}>{label}{open ? ' ▾' : ' ▸'}</button>
    {open && <>
      <div style={{ position:'fixed',inset:0,zIndex:80 }} onClick={() => setOpen(false)} />
      <div style={{ position:'absolute',top:'100%',left:0,marginTop:4,zIndex:81,background:'var(--paper)',border:'1px solid var(--line)',borderRadius:8,padding:'.8rem',minWidth:220,boxShadow:'var(--shadow-md)',fontSize:'.78rem' }}>
        {templateKey === 'stroop' ? <>
          <label style={{ display:'grid',gap:'.2rem',marginBottom:'.5rem' }}>
            {t('Trials')} <input type="number" min={4} max={64} step={4} value={cfg.trials} onChange={e => setCfg(p => ({...p,trials:e.target.value}))} style={{ width:'100%',padding:'.3rem',border:'1px solid var(--line)',borderRadius:4 }} />
            <small style={{color:'var(--muted)'}}>{t('Trials are balanced across four ink colors.')}</small>
          </label>
        </> : <>
          <label style={{ display:'grid',gap:'.2rem',marginBottom:'.5rem' }}>
            {t('Trials')} <input type="number" min={10} max={100} step={10} value={cfg.trials} onChange={e => setCfg(p => ({...p,trials:e.target.value}))} style={{ width:'100%',padding:'.3rem',border:'1px solid var(--line)',borderRadius:4 }} />
          </label>
          <label style={{ display:'grid',gap:'.2rem',marginBottom:'.5rem' }}>
            {t('Go ratio')}: {cfg.goRatio}%
            <input type="range" min={50} max={90} step={5} value={cfg.goRatio} onChange={e => setCfg(p => ({...p,goRatio:Number(e.target.value)}))} />
          </label>
        </>}
        <label style={{ display:'flex',alignItems:'center',gap:'.3rem',marginBottom:'.5rem',fontSize:'.75rem' }}>
          <input type="checkbox" checked={cfg.practice} onChange={e => setCfg(p => ({...p,practice:e.target.checked}))} /> {t('Practice block')}
        </label>
        <label style={{ display:'grid',gap:'.2rem',marginBottom:'.5rem' }}>
          {t('ITI jitter')}: {cfg.jitter} ms
          <input type="range" min={0} max={1000} step={50} value={cfg.jitter} onChange={e => setCfg(p => ({...p,jitter:Number(e.target.value)}))} />
        </label>
        {check.errors.map(message => <p role="alert" key={message}>{t(message)}</p>)}
        {creationError && <p role="alert">{creationError}</p>}
        {check.valid && <p role="status">{t('Main trials')}: {check.mainTrials} · {t('Practice trials')}: {check.practiceTrials}{check.goTrials !== null && <> · Go: {check.goTrials} / No-Go: {check.nogoTrials}</>}</p>}
        <div style={{ display:'flex',gap:'.4rem',marginTop:'.6rem' }}>
          <button className="primary" disabled={!check.valid || creating} onClick={handleCreate} style={{flex:1}}>{t(creating ? 'Creating…' : 'Create')}</button>
          <button onClick={() => setOpen(false)}>{t('Cancel')}</button>
        </div>
      </div>
    </>}
  </span>;
}

import TemplateConfigPanel from './TemplateConfigPanel.jsx';
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

  return <span className="template-launch">
    <button disabled={creating} aria-expanded={open} onClick={() => setOpen(o => !o)}>{label}{open ? ' ▾' : ' ▸'}</button>
    {open && <TemplateConfigPanel title={label} busy={creating} onClose={() => setOpen(false)}>
        {templateKey === 'stroop' ? <>
          <label>
            {t('Trials')} <input disabled={creating} type="number" min={4} max={64} step={4} value={cfg.trials} onChange={e => setCfg(p => ({...p,trials:e.target.value}))} />
            <small>{t('Trials are balanced across four ink colors.')}</small>
          </label>
        </> : <>
          <label>
            {t('Trials')} <input disabled={creating} type="number" min={10} max={100} step={10} value={cfg.trials} onChange={e => setCfg(p => ({...p,trials:e.target.value}))} />
          </label>
          <label>
            {t('Go ratio')}: {cfg.goRatio}%
            <input disabled={creating} type="range" min={50} max={90} step={5} value={cfg.goRatio} onChange={e => setCfg(p => ({...p,goRatio:Number(e.target.value)}))} />
          </label>
        </>}
        <label className="template-check">
          <input disabled={creating} type="checkbox" checked={cfg.practice} onChange={e => setCfg(p => ({...p,practice:e.target.checked}))} /> {t('Practice block')}
        </label>
        <label>
          {t('ITI jitter')}: {cfg.jitter} ms
          <input disabled={creating} type="range" min={0} max={1000} step={50} value={cfg.jitter} onChange={e => setCfg(p => ({...p,jitter:Number(e.target.value)}))} />
        </label>
        {check.errors.map(message => <p role="alert" key={message}>{t(message)}</p>)}
        {creationError && <p role="alert">{creationError}</p>}
        {check.valid && <p role="status">{t('Main trials')}: {check.mainTrials} · {t('Practice trials')}: {check.practiceTrials}{check.goTrials !== null && <> · Go: {check.goTrials} / No-Go: {check.nogoTrials}</>}</p>}
        <div className="template-config-actions">
          <button className="primary" disabled={!check.valid || creating} onClick={handleCreate}>{t(creating ? 'Creating…' : 'Create')}</button>
          <button disabled={creating} onClick={() => setOpen(false)}>{t('Cancel')}</button>
        </div>
    </TemplateConfigPanel>}
  </span>;
}

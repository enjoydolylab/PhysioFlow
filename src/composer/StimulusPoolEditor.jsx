import { useMemo, useState } from 'react';

// Full-size editor for a stimulus pool. The left panel is far too narrow to list every
// asset, so the pool card shows a summary and this dialog does the actual picking with
// thumbnails, search and bulk actions — which is what scales to hundreds of stimuli.

const MEDIA_LABEL = { image: 'image', audio: 'audio', video: 'video' };

export default function StimulusPoolEditor({ pool, assets = [], locked = false, onSave, onClose }) {
  const mediaType = pool.mediaType || 'image';
  const [name, setName] = useState(pool.name || '');
  const [selected, setSelected] = useState(() => new Set(pool.assetIds || []));
  const [query, setQuery] = useState('');

  const candidates = useMemo(
    () => assets.filter(asset => (asset.mediaType || asset.type || 'image') === mediaType),
    [assets, mediaType],
  );
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return candidates;
    return candidates.filter(asset => String(asset.name || asset.id || '').toLowerCase().includes(needle));
  }, [candidates, query]);

  const assetIdOf = asset => asset.id || asset.assetId;
  const toggle = id => setSelected(previous => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return <div className="pool-editor-backdrop" onMouseDown={onClose}>
    <div className="pool-editor" role="dialog" aria-label={`Edit ${pool.name}`} onMouseDown={event => event.stopPropagation()}>
      <header className="pool-editor-head">
        <div>
          <input className="pool-editor-name" aria-label="Pool name" disabled={locked} placeholder="Pool name" value={name} onChange={event => setName(event.target.value)} />
          <small>{MEDIA_LABEL[mediaType] || mediaType} · Selected <b>{selected.size}</b> / {candidates.length}</small>
        </div>
        <button type="button" className="pool-editor-close" onClick={onClose} aria-label="Close">✕</button>
      </header>

      <div className="pool-editor-toolbar">
        <input aria-label="Search assets" placeholder="Search assets…" value={query} onChange={event => setQuery(event.target.value)} />
        <button type="button" disabled={locked || !filtered.length} onClick={() => setSelected(previous => new Set([...previous, ...filtered.map(assetIdOf)]))}>Select all{query.trim() ? ' · in results' : ''}</button>
        <button type="button" disabled={locked || !selected.size} onClick={() => setSelected(new Set())}>Clear</button>
      </div>

      <div className="pool-editor-grid">
        {filtered.map(asset => {
          const id = assetIdOf(asset);
          const on = selected.has(id);
          const source = asset.sourceUrl || asset.url;
          const showThumb = mediaType === 'image' && source;
          return <button key={id} type="button" disabled={locked} className={`pool-tile${on ? ' selected' : ''}`} onClick={() => toggle(id)} title={asset.name || id}>
            <span className="pool-tile-thumb">{showThumb ? <img src={source} alt="" loading="lazy" /> : <em>{MEDIA_LABEL[mediaType] || mediaType}</em>}</span>
            <span className="pool-tile-name">{asset.name || id}</span>
            {on && <span className="pool-tile-check" aria-hidden="true">✓</span>}
          </button>;
        })}
        {!filtered.length && <p className="pool-editor-empty">{candidates.length ? 'No matching assets.' : `No ${MEDIA_LABEL[mediaType] || mediaType} assets in the media library yet.`}</p>}
      </div>

      <footer className="pool-editor-foot">
        <small>Draws without replacement each cycle; repeats its seeded order once exhausted.</small>
        <button type="button" onClick={onClose}>Cancel</button>
        <button type="button" className="primary" disabled={locked} onClick={() => onSave({ name: name.trim() || 'Stimulus pool', assetIds: [...selected] })}>{'Done'} ({selected.size})</button>
      </footer>
    </div>
  </div>;
}

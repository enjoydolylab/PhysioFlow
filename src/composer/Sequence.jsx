import { moveSequenceStep } from './sequenceModel.js';

export default function Sequence({s,ordered,onGraph}) {
  const {t,locked,selectedNodeId,setSelectedNodeId,setSelectedIds,setSelectedEdgeId,commit,setMessage,message} = s;
  const select = node => { setSelectedNodeId(node.id); setSelectedIds(new Set([node.id])); setSelectedEdgeId(null); };
  const move = (node,direction) => { try { commit(moveSequenceStep(s.protocol,node.id,direction)); select(node); setMessage(''); } catch(error) { setMessage(error.message); } };
  return <section className="composer-sequence" aria-label={t('Experiment sequence')}>
    <div className="sequence-heading"><div><h2>{t('Experiment sequence')}</h2><p>{t('Select a step to edit. Add components from the left panel.')}</p></div><button onClick={onGraph}>{t('Flow graph')}</button></div>
    {message && <p role="status">{t(message)}</p>}
    <ol>{ordered.map((node,index) => <li key={node.id} data-node-id={node.id} className={selectedNodeId === node.id ? 'selected' : ''}>
      <button className="sequence-select" aria-current={selectedNodeId === node.id ? 'step' : undefined} onClick={() => select(node)}><span>{index === 0 || index === ordered.length - 1 ? '•' : index}</span><div><b>{node.label}</b><small>{node.component.type}</small></div></button>
      {index > 0 && index < ordered.length - 1 && <div className="sequence-actions"><button aria-label={`${t('Move up')}: ${node.label}`} disabled={locked || index === 1} onClick={() => move(node,-1)}>↑</button><button aria-label={`${t('Move down')}: ${node.label}`} disabled={locked || index === ordered.length - 2} onClick={() => move(node,1)}>↓</button></div>}
    </li>)}</ol>
  </section>;
}

import ParticipantRenderer from '../../ParticipantRenderer.jsx';

export function ParticipantPreview({ schema, width }) {
  return <div className="ui-builder-preview"><div style={{ width: width || '100%', margin: 'auto' }}><ParticipantRenderer schema={schema} context={{ progress: { percent: 40 } }} preview /></div></div>;
}

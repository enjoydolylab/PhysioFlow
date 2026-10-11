export default function GroupSequenceEditor({ protocol, locked, onChange }) {
  const groups = protocol.graph.groups || [];
  if (groups.length < 2 && !protocol.groupRandomization?.enabled) return null;
  const config = protocol.groupRandomization || { enabled: false, groupIds: [] };
  const update = changes => onChange({ ...protocol, groupRandomization: { ...config, ...changes } });
  return <fieldset disabled={locked} className="setup-note" aria-label="Group randomization">
    <legend>Group randomization</legend>
    <label><input type="checkbox" checked={Boolean(config.enabled)} onChange={event => update({ enabled: event.target.checked })} />Shuffle selected groups once per session</label>
    <p>Keep the internal flow of each group unchanged. Select at least two adjacent groups.</p>
    {groups.map(group => <label key={group.id} style={{ display: 'block' }}><input type="checkbox" checked={(config.groupIds || []).includes(group.id)} onChange={event => update({ groupIds: event.target.checked ? [...(config.groupIds || []), group.id] : (config.groupIds || []).filter(id => id !== group.id) })} />{group.name}</label>)}
    <small>The preparation page shows the session order. Include complete branches and bounded loops inside each group. Each group needs one entry and one exit connection. Cross-group data connections are not supported.</small>
  </fieldset>;
}

import { useState } from 'react';
import {
  AssetLibrary,
  CollaborationCatalog,
  ComponentPackageCatalog,
  DeploymentCatalog,
  DeviceConnectorCatalog,
  GroupCatalog,
  SubflowTemplateCatalog,
  StimulusPoolCatalog,
  VariableCatalog,
  VisualAngleCalculator,
} from './Catalogs.jsx';

// A collapsible top-level group. The palette used to stack a dozen sibling sections
// that all looked alike, so the panel read as one long undifferentiated list. Grouping
// them under a few labelled, collapsible headings keeps the common path (flow nodes,
// media) open and tucks the rest away.
function PaletteGroup({ title, hint, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return <details className="palette-group" open={open} onToggle={event => {
    // Nested <details> (media library, pool catalog) would otherwise toggle the group.
    if (event.target === event.currentTarget) setOpen(event.currentTarget.open);
  }}>
    <summary><b>{title}</b>{hint && <small>{hint}</small>}</summary>
    <div className="palette-group-body">{children}</div>
  </details>;
}

export default function Palette({ s, onHostedRun }) {
  const {
    t, locked, editorMode, paletteGroups, addComponent, actions,
    protocol, registry, collaborationBaseline, setMessage,
  } = s;
  const modeDescription = editorMode === 'quick'
    ? 'Quick mode: build the execution flow and set essential properties.'
    : editorMode === 'design'
      ? 'Design mode: manage media, random stimulus pools, variables, and participant screens.'
      : 'Advanced mode: SDK packages, devices, collaboration, deployment, and raw configuration.';
  return <aside className="composer-palette">
    <h2>{t('Components')}</h2>
    <p className="composer-mode-description">{modeDescription}</p>

    <PaletteGroup title="Flow nodes" hint="Click or drag onto the canvas to insert" defaultOpen>
      {paletteGroups.map(([category, definitions]) => <section key={category} className="palette-node-group">
        <h4>{category}</h4>
        {definitions.map(definition => <button key={definition.type} draggable={!locked} title="Drag onto the canvas" onClick={() => addComponent(definition)} onDragStart={event => { event.dataTransfer.setData('application/x-physioflow-node', definition.type); event.dataTransfer.effectAllowed = 'copy'; }}><b>{definition.label}</b><small>{definition.type}</small></button>)}
      </section>)}
    </PaletteGroup>

    <PaletteGroup title="Media & stimuli" hint="Asset library and randomized pools" defaultOpen>
      <AssetLibrary assets={protocol.assets || []} stimulusPools={protocol.stimulusPools || []} locked={locked} onUpdate={actions.updateAssets} />
      <StimulusPoolCatalog pools={protocol.stimulusPools || []} assets={protocol.assets || []} nodes={protocol.graph.nodes || []} locked={locked} onUpdate={actions.updateStimulusPools} />
    </PaletteGroup>

    {editorMode !== 'quick' && <PaletteGroup title="Variables & structure" hint="Variables, groups, reusable subflows">
      <VariableCatalog mode={editorMode} variables={protocol.variables || []} locked={locked} onError={error => setMessage(error.message || String(error))} onAdd={actions.addVariable} onUpdate={actions.updateVariable} onRemove={actions.removeVariable} />
      <GroupCatalog registry={registry} groups={protocol.graph.groups || []} nodes={protocol.graph.nodes} locked={locked} onUpdate={actions.updateGroup} onRemove={actions.removeGroup} onPublish={actions.publishGroup} />
      <SubflowTemplateCatalog templates={protocol.subflowTemplates || []} variables={protocol.variables || []} locked={locked} onInstantiate={actions.instantiateSubflow} onRemove={actions.removeSubflowTemplate} />
      <VisualAngleCalculator />
    </PaletteGroup>}

    {editorMode === 'advanced' && <PaletteGroup title="Advanced" hint="SDK packages, devices, collaboration, deployment">
      <ComponentPackageCatalog packages={protocol.componentPackages || []} locked={locked} onInstallExample={actions.installExamplePackage} onImport={actions.importPackage} onRemove={actions.removePackage} />
      <DeviceConnectorCatalog connectors={protocol.deviceConnectors || []} locked={locked} onInstallExample={actions.installExampleConnector} onImport={actions.importConnector} onRemove={actions.removeConnector} />
      <CollaborationCatalog protocol={protocol} baseline={collaborationBaseline} locked={locked} onSetBaseline={actions.setBaseline} onApply={actions.applyChangeSet} onMessage={setMessage} />
      <DeploymentCatalog protocol={protocol} onHostedRun={onHostedRun} onMessage={setMessage} />
    </PaletteGroup>}
  </aside>;
}

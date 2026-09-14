// Measure before switching layout modes; preserve visual bounds and original sizing.
export function measureLayout(container, scope, zoom = 1) {
  const nodes = new Map([...scope.querySelectorAll('[data-ui-id]')].map(node => [node.dataset.uiId, node]));
  const parent = nodes.get(container.id);
  if (!parent) return null;
  const bounds = parent.getBoundingClientRect();
  return { height: bounds.height / zoom, children: Object.fromEntries(container.children.map(child => {
    const node = nodes.get(child.id);
    if (!node) return [child.id, null];
    const rect = node.getBoundingClientRect();
    const css = window.getComputedStyle(node);
    return [child.id, { x: (rect.left - bounds.left) / zoom - parent.clientLeft - (parseFloat(css.marginLeft) || 0),
      y: (rect.top - bounds.top) / zoom - parent.clientTop - (parseFloat(css.marginTop) || 0),
      width: rect.width / zoom, height: rect.height / zoom }];
  })) };
}

export function freezeLayout(container, geometry) {
  if (!geometry) return container;
  const sizing = props => Object.fromEntries(['width', 'height'].filter(key => props?.[key] != null).map(key => [key, props[key]]));
  return { ...container, props: { ...container.props, free: true, height: geometry.height,
    flowSizing: { ...sizing(container.props), children: Object.fromEntries(container.children.map(child => [child.id, sizing(child.props)])) } },
    children: container.children.map(child => {
      const bounds = geometry.children[child.id];
      if (!bounds) return child;
      // Text and form content may grow when edited; containers must keep their space.
      const { height, ...placement } = bounds;
      return { ...child, props: { ...child.props, ...placement, ...(['Layout', 'Media', 'Html', 'Rectangle', 'Ellipse'].includes(child.type) ? { height } : {}) } };
    }) };
}

export function restoreFlow(container) {
  const { flowSizing, ...props } = container.props || {};
  if (flowSizing) { delete props.height; delete props.width; Object.assign(props, { ...flowSizing, children: undefined }); delete props.children; }
  return { ...container, props: { ...props, free: false }, children: container.children.map(child => {
    const next = { ...child.props }; delete next.x; delete next.y;
    if (flowSizing?.children[child.id]) { delete next.width; delete next.height; Object.assign(next, flowSizing.children[child.id]); }
    return { ...child, props: next };
  }) };
}

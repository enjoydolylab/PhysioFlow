import { useEffect, useRef, useState } from 'react';

// The screen is laid out once at its design resolution; only the outer view scales.
export function ScreenFrame({ width, height, children }) {
  const ref = useRef(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const node = ref.current;
    const observer = new window.ResizeObserver(() => setScale(Math.min(1, node.clientWidth / width)));
    observer.observe(node);
    return () => observer.disconnect();
  }, [width]);
  return <div ref={ref} className="ui-screen-frame" style={{ height: height * scale }}>
    <div className="ui-screen-surface" style={{ width, height, left: `calc(50% - ${width * scale / 2}px)`, transform: `scale(${scale})` }}>{children}</div>
  </div>;
}

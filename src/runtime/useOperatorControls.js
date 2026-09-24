import { useEffect, useState } from 'react';

export default function useOperatorControls(active = true) {
  const [operatorVisible, setOperatorVisible] = useState(false);
  useEffect(() => {
    if (!active) return;
    const toggle = event => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.code === 'KeyO') {
        event.preventDefault();
        event.stopImmediatePropagation();
        setOperatorVisible(visible => !visible);
      }
    };
    window.addEventListener('keydown', toggle, true);
    return () => window.removeEventListener('keydown', toggle, true);
  }, [active]);
  return operatorVisible;
}

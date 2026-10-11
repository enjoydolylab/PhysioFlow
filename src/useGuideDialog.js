import { useEffect } from 'react';

export default function useGuideDialog(closeButton, onClose) {
  useEffect(() => {
    const previous = document.activeElement;
    closeButton.current?.focus();
    const handler = event => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (event.key !== 'Tab') return;
      const dialog = closeButton.current?.closest('[role="dialog"]');
      const controls = [...(dialog?.querySelectorAll('button, a[href], input, select, textarea, [tabindex="0"]') || [])].filter(element => !element.disabled && element.checkVisibility());
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    window.addEventListener('keydown', handler);
    return () => { window.removeEventListener('keydown', handler); if (previous?.isConnected) previous.focus?.(); };
  }, [closeButton, onClose]);
}

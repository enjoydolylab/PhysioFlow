// Shared UI helpers used by App shell and session setup pages.

export const clone = x => structuredClone(x);

export function saveFile(name, text) {
  const a = document.createElement('a');
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.href = url;
  a.download = name;
  try {
    a.click();
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
  setTimeout(() => { URL.revokeObjectURL(url); }, 30000);
}

// Toast helper — uses globally injected container for cross-view availability
export function showToast(message, { duration = 2500 } = {}) {
  const container = document.getElementById('toast-root');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 300); }, duration);
}

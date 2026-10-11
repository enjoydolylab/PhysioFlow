// PF operator credential only. The PhysioDB token never enters browser storage.
const key = 'physioflow.operator-connection.v1';
export function getPhysioDBConnection() {
  try { const value = JSON.parse(globalThis.sessionStorage.getItem(key)); return value?.accessToken && value?.baseUrl ? value : null; } catch { return null; }
}
export function setPhysioDBConnection(value) {
  if (value) globalThis.sessionStorage.setItem(key, JSON.stringify(value)); else globalThis.sessionStorage.removeItem(key);
}

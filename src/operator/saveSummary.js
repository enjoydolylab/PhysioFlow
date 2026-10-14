// A recovery checkpoint never proves that the final session was saved.
export function operatorSaveSummary({ runtimeStatus, saved, recoverySave, hostedStatus }) {
 const terminal = ['completed', 'failed'].includes(runtimeStatus);
 return {
  saveStatus: terminal ? (saved === true ? 'saved' : typeof saved === 'string' ? 'error' : 'saving') : recoverySave.status,
  saveError: terminal ? (typeof saved === 'string' ? saved : '') : recoverySave.error,
  hostedSaveStatus: hostedStatus ? (hostedStatus.completed ? 'saved' : hostedStatus.error ? 'error' : 'saving') : null,
  hostedSaveError: hostedStatus?.error || '',
 };
}

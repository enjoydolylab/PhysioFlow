import { useState } from 'react';
import { ConfirmDialog } from './Modal.jsx';

export default function TestRunExitButton({ onExit }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [error, setError] = useState('');

  if (!onExit) return null;

  const confirmExit = async () => {
    if (exiting) return;
    setExiting(true);
    setError('');
    try {
      await onExit();
      // Success unmounts this component and returns to the current editor.
    } catch (failure) {
      setError(`Could not exit test: ${failure?.message || String(failure)} Retry to return safely.`);
      setConfirmOpen(false);
    } finally {
      setExiting(false);
    }
  };

  return <>
    <button type="button" className="test-exit-button" onClick={() => { setError(''); setConfirmOpen(true); }} disabled={exiting}>
      {exiting ? 'Exiting…' : 'Exit test and return to editor'}
    </button>
    {error && <span role="alert" className="test-exit-error">{error}</span>}
    {confirmOpen && <ConfirmDialog
      title="Exit test run?"
      message="Discard this test’s answers and recovery checkpoint. Protocol edits and undo history are preserved. Device raw recordings are retained."
      confirmLabel={exiting ? 'Exiting…' : 'Discard test and return'}
      danger
      onConfirm={confirmExit}
      onCancel={() => { if (!exiting) setConfirmOpen(false); }}
    />}
  </>;
}
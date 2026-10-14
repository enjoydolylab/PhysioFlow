import { useCallback, useRef, useState } from 'react';

const MAX_UNDO = 60;
const clone = x => structuredClone(x);

/**
 * App-level undo/redo stack for protocol editors.
 *
 * Owns the undo/redo snapshot stacks and the interaction throttle. The dirty
 * flag is delegated to `setHasUnsaved` (owned by the caller) so that save
 * flow and editor state stay decoupled. Later work (W5) can scope this stack
 * per editor session without touching the caller's contract.
 *
 * @param {object} params
 * @param {any} params.current the current protocol being edited
 * @param {(v: any) => void} params.setCurrent updates the current protocol
 * @param {(v: boolean) => void} params.setHasUnsaved marks the project dirty
 */
export function useUndoRedo({ current, setCurrent, setHasUnsaved }) {
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const undoThrottle = useRef(0);
  // Editor-session scope: frames recorded inside `beginScope()` are discarded
  // when the editor is exited via `endScope()`, so global navigation actions
  // never share a history stack with editor work.
  const scopeBase = useRef(0);
  const scopeActive = useRef(false);
  const undoStackRef = useRef([]);
  undoStackRef.current = undoStack;
  const redoStackRef = useRef([]);
  redoStackRef.current = redoStack;

  const pushUndo = useCallback((val, pushRedo = true) => {
    const frames = [...undoStackRef.current, val];
    const dropped = Math.max(0, frames.length - MAX_UNDO);
    if (scopeActive.current && dropped) scopeBase.current = Math.max(0, scopeBase.current - dropped);
    undoStackRef.current = frames.slice(-MAX_UNDO);
    setUndoStack(undoStackRef.current);
    if (pushRedo) { redoStackRef.current = []; setRedoStack([]); }
    setHasUnsaved(true);
  }, [setHasUnsaved]);

  const undo = useCallback(() => {
    if (current?.version?.status === 'frozen' || current?.status === 'frozen') return;
    const previous = undoStackRef.current;
    if (!previous.length || (scopeActive.current && previous.length <= scopeBase.current)) return;
    const snapshot = previous.at(-1);
    const nextUndo = previous.slice(0, -1), nextRedo = [...redoStackRef.current, clone(current)];
    undoStackRef.current = nextUndo; redoStackRef.current = nextRedo;
    setUndoStack(nextUndo); setRedoStack(nextRedo);
    undoThrottle.current = 0;
    setCurrent(clone(snapshot)); setHasUnsaved(true);
  }, [current, setCurrent, setHasUnsaved]);

  const redo = useCallback(() => {
    if (current?.version?.status === 'frozen' || current?.status === 'frozen') return;
    const previous = redoStackRef.current;
    if (!previous.length) return;
    const snapshot = previous.at(-1);
    const nextRedo = previous.slice(0, -1), nextUndo = [...undoStackRef.current, clone(current)].slice(-MAX_UNDO);
    redoStackRef.current = nextRedo; undoStackRef.current = nextUndo;
    setRedoStack(nextRedo); setUndoStack(nextUndo);
    undoThrottle.current = 0;
    setCurrent(clone(snapshot)); setHasUnsaved(true);
  }, [current, setCurrent, setHasUnsaved]);

  const resetUndo = useCallback(() => {
    undoThrottle.current = 0;
    scopeBase.current = 0;
    scopeActive.current = false;
    undoStackRef.current = []; redoStackRef.current = [];
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  /** Begin an editor session scope. Frames recorded after this point are
   *  owned by the editor and are discarded when `endScope()` is called. */
  const beginScope = useCallback(() => {
    undoThrottle.current = 0;
    scopeBase.current = undoStackRef.current.length;
    scopeActive.current = true;
    redoStackRef.current = [];
    setRedoStack([]);
  }, []);

  /** End the editor session scope, discarding editor-owned history frames so
   *  they do not leak into global navigation history. */
  const endScope = useCallback(() => {
    if (!scopeActive.current) return;
    undoThrottle.current = 0;
    scopeActive.current = false;
    undoStackRef.current = undoStackRef.current.slice(0, scopeBase.current);
    redoStackRef.current = [];
    setUndoStack(undoStackRef.current);
    setRedoStack([]);
  }, []);

  return {
    undoStack,
    setUndoStack,
    redoStack,
    setRedoStack,
    undoThrottle,
    pushUndo,
    undo,
    redo,
    resetUndo,
    beginScope,
    endScope,
  };
}

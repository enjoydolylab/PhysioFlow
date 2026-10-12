import { useEffect, useRef, useState } from 'react';
import { openRuntimeMonitor } from './runtimeMonitor.js';

export default function useRuntimeMonitor(sessionId, getSnapshot, onCommand) {
  const snapshot = useRef(getSnapshot), command = useRef(onCommand);
  snapshot.current = getSnapshot; command.current = onCommand;
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!globalThis.BroadcastChannel || !sessionId) return undefined;
    const monitor = openRuntimeMonitor({ sessionId, getSnapshot: () => snapshot.current(), onCommand: (value, details) => command.current(value, details) });
    setUrl(monitor.url);
    const timer = setInterval(monitor.publish, 500); monitor.publish();
    return () => { clearInterval(timer); monitor.close(); };
  }, [sessionId]);
  return url;
}

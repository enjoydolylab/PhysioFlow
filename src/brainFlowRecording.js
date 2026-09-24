/** Read an agent samples.jsonl Blob incrementally; never parse browser previews.
 * Cancellation or early iterator return releases the underlying file reader.
 */
export async function* readBrainFlowRecording(file, { signal, maxLineBytes = 1024 * 1024 } = {}) {
  if (typeof file?.stream !== 'function') throw new Error('A raw recording file is required');
  if (!Number.isInteger(maxLineBytes) || maxLineBytes < 1) throw new Error('Invalid recording line limit');
  const reader = file.stream().getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let pending = '';
  let line = 0;
  const parse = text => {
    line += 1;
    if (!text.trim()) throw new Error(`Empty recording row at line ${line}`);
    if (new TextEncoder().encode(text).length > maxLineBytes) throw new Error(`Recording row exceeds limit at line ${line}`);
    let record;
    try { record = JSON.parse(text); } catch { throw new Error(`Invalid recording JSON at line ${line}`); }
    if (!record || !Number.isInteger(record.sequence) || record.sequence < 1 || !Number.isFinite(record.timestamp) || !Array.isArray(record.rows) || !record.rows.length || record.rows.some(value => !Number.isFinite(value))) throw new Error(`Invalid raw sample at line ${line}`);
    return record;
  };
  try {
    while (true) {
      if (signal?.aborted) throw new Error('Recording read cancelled');
      const { value, done } = await reader.read();
      if (signal?.aborted) throw new Error('Recording read cancelled');
      try { pending += decoder.decode(value, { stream: !done }); } catch { throw new Error(`Invalid recording UTF-8 near line ${line + 1}`); }
      let end;
      while ((end = pending.indexOf('\n')) >= 0) {
        const text = pending.slice(0, end).replace(/\r$/, '');
        pending = pending.slice(end + 1);
        yield parse(text);
      }
      if (new TextEncoder().encode(pending).length > maxLineBytes) throw new Error(`Recording row exceeds limit at line ${line + 1}`);
      if (done) break;
    }
    if (pending) yield parse(pending);
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

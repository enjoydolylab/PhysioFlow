/** Normalize passive BrainFlow and Koguchi monitor snapshots without altering acquisition. */
export function normalizeDeviceSnapshot({ source, snapshot }, now = Date.now()) {
  if (!snapshot || typeof snapshot !== 'object') throw new Error('Invalid device snapshot');
  if (source === 'brainflow') {
    const list = Array.isArray(snapshot.samples) ? snapshot.samples : [];
    const times = list.map(row => row.timestamp * 1000);
    const age = snapshot.lastSampleAgeMs;
    const synthetic = snapshot.source === 'synthetic' || snapshot.boardId < 0;
    return { source, synthetic, rate: snapshot.sampleRateHz, recording: snapshot.recordingActive === true, warning: snapshot.error || '', signals: (snapshot.manifest?.channels || []).filter(c => c.direction === 'input').map(channel => {
      const values = list.map(row => Number.isFinite(row.values?.[channel.id]) ? row.values[channel.id] : null);
      const flat = values.length > 5 && values.every(v => v === values[0]);
      return { id: channel.id, name: channel.name || channel.id, unit: channel.unit || null, times, values, value: values.at(-1) ?? null, ready: !snapshot.error && Number.isFinite(age) && age <= 3000 && values.length >= 5 && values.every(Number.isFinite) && !flat, status: snapshot.error ? 'error' : !Number.isFinite(age) || age > 3000 ? 'stale' : flat ? 'flat' : values.length < 5 ? 'waiting' : 'receiving' };
    }) };
  }
  if (source !== 'koguchi') throw new Error('Unknown device source');
  const eeg = snapshot.openbci || {}, hr = snapshot.mybeat || {};
  const eegReady = eeg.health === 'ok' && Number.isFinite(eeg.last_packet_age_sec) && eeg.last_packet_age_sec <= 3 && eeg.received_channels >= eeg.configured_channels;
  return { source, synthetic: eeg.source === 'mock' || hr.source === 'mock', recording: Boolean(snapshot.recording?.active), warning: snapshot.recording?.last_error || (snapshot.recording?.dropped ? 'Recording contains dropped samples.' : ''), signals: [
    ...(eeg.waveforms || []).map((values, i) => ({ id: `eeg_${i}`, name: eeg.channel_labels?.[i] || `EEG ${i + 1}`, unit: 'µV', values, times: [], value: values.at(-1) ?? null, ready: eegReady && values.length >= 5 && values.every(Number.isFinite) && !values.every(v => v === values[0]), status: !eegReady ? 'stale' : values.every(v => v === values[0]) ? 'flat' : 'receiving' })),
    { id: 'heart_rate', name: 'Heart rate', unit: 'bpm', values: [], times: [], value: hr.heart_rate_bpm ?? null, ready: hr.health === 'ok' && hr.hr_fresh === true && Number.isFinite(hr.heart_rate_bpm) && hr.heart_rate_bpm > 0, status: hr.health === 'ok' && hr.hr_fresh === true && Number.isFinite(hr.heart_rate_bpm) && hr.heart_rate_bpm > 0 ? 'receiving' : 'waiting' },
  ], observedAt: now };
}

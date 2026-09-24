export function isTauriRuntime() {
  return typeof window !== 'undefined' && Boolean(window.__TAURI_INTERNALS__);
}

async function invoke(command, args = {}) {
  const api = await import('@tauri-apps/api/core');
  return api.invoke(command, args);
}

export async function storageInfo() {
  return invoke('storage_info');
}

export async function selectDataDirectory() {
  return invoke('select_data_directory');
}

export async function openDataDirectory() {
  return invoke('open_data_directory');
}

export async function readText(path) {
  return invoke('read_text', { path });
}

export async function writeText(path, text) {
  return invoke('write_text', { path, text });
}

const BINARY_CHUNK_SIZE = 1024 * 1024;

export async function readBlob(path) {
  const size = await invoke('binary_size', { path });
  if (size === null) return null;
  const chunks = [];
  for (let offset = 0; offset < size; offset += BINARY_CHUNK_SIZE) {
    const length = Math.min(BINARY_CHUNK_SIZE, size - offset);
    const bytes = await invoke('read_binary_chunk', { path, offset, length });
    if (bytes.length !== length) throw new Error('Incomplete media read');
    chunks.push(new Uint8Array(bytes));
  }
  return new Blob(chunks);
}

export async function writeBlob(path, blob) {
  const uploadId = crypto.randomUUID();
  try {
    for (let offset = 0; offset < blob.size || offset === 0; offset += BINARY_CHUNK_SIZE) {
      const bytes = Array.from(new Uint8Array(await blob.slice(offset, offset + BINARY_CHUNK_SIZE).arrayBuffer()));
      await invoke('write_binary_chunk', { path, uploadId, offset, bytes, finalChunk: offset + bytes.length >= blob.size });
    }
    return true;
  } catch (error) {
    await invoke('abort_binary_upload', { path, uploadId }).catch(() => {});
    throw error;
  }
}

export async function removeEntry(path) {
  return invoke('remove_entry', { path });
}

export async function listFiles(path) {
  return invoke('list_files', { path });
}

export async function listDirectories(path) {
  return invoke('list_directories', { path });
}

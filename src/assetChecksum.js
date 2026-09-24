import { sha256 } from '@noble/hashes/sha2.js';

// Bounded reads avoid allocating an entire video for integrity verification.
export async function checksumBlob(blob) {
  const hash = sha256.create();
  const chunkSize = 4 * 1024 * 1024;
  try {
    for (let offset = 0; offset < blob.size; offset += chunkSize) {
      hash.update(new Uint8Array(await blob.slice(offset, offset + chunkSize).arrayBuffer()));
    }
    return Array.from(hash.digest(), byte => byte.toString(16).padStart(2, '0')).join('');
  } finally { hash.destroy(); }
}

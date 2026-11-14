// A small zip writer for the website builder: runs in the browser and in Node, with no dependencies. Files are
// stored, not compressed (a website of HTML, CSS and JavaScript is small, and web servers compress it anyway), with
// UTF-8 names and a fixed date, so the same files always make the same zip.

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// 1 January 1980, 00:00: the earliest date a zip can hold, so nothing about the machine or the moment is in it.
const DOS_TIME = 0;
const DOS_DATE = (1 << 5) | 1;

/**
 * Makes a zip. files: { 'path/in/zip': string | Uint8Array }, in the order they should appear.
 * folder: put every file inside this folder. Returns a Uint8Array.
 */
export function makeZip(files, { folder = '' } = {}) {
  const enc = new TextEncoder();
  const prefix = folder ? `${folder.replace(/\/+$/, '')}/` : '';
  const local = [];
  const central = [];
  let offset = 0;
  for (const [path, content] of Object.entries(files)) {
    if (/^\/|(^|\/)\.\.(\/|$)/.test(path)) throw new Error(`zip: unsafe path ${path}`);
    const name = enc.encode(prefix + path);
    const data = typeof content === 'string' ? enc.encode(content) : content;
    const crc = crc32(data);
    const head = new DataView(new ArrayBuffer(30));
    head.setUint32(0, 0x04034b50, true);
    head.setUint16(4, 20, true); // version needed: 2.0
    head.setUint16(6, 0x0800, true); // UTF-8 names
    head.setUint16(8, 0, true); // stored
    head.setUint16(10, DOS_TIME, true);
    head.setUint16(12, DOS_DATE, true);
    head.setUint32(14, crc, true);
    head.setUint32(18, data.length, true);
    head.setUint32(22, data.length, true);
    head.setUint16(26, name.length, true);
    head.setUint16(28, 0, true);
    local.push(new Uint8Array(head.buffer), name, data);

    const entry = new DataView(new ArrayBuffer(46));
    entry.setUint32(0, 0x02014b50, true);
    entry.setUint16(4, 0x031e, true); // made by: Unix, 3.0 (so the permissions below are read)
    entry.setUint16(6, 20, true);
    entry.setUint16(8, 0x0800, true);
    entry.setUint16(10, 0, true);
    entry.setUint16(12, DOS_TIME, true);
    entry.setUint16(14, DOS_DATE, true);
    entry.setUint32(16, crc, true);
    entry.setUint32(20, data.length, true);
    entry.setUint32(24, data.length, true);
    entry.setUint16(28, name.length, true);
    entry.setUint32(38, (0o100644 << 16) >>> 0, true); // a plain file, rw-r--r--
    entry.setUint32(42, offset, true);
    central.push(new Uint8Array(entry.buffer), name);
    offset += 30 + name.length + data.length;
  }
  const centralSize = central.reduce((n, b) => n + b.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, Object.keys(files).length, true);
  end.setUint16(10, Object.keys(files).length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);
  const parts = [...local, ...central, new Uint8Array(end.buffer)];
  const out = new Uint8Array(parts.reduce((n, b) => n + b.length, 0));
  let at = 0;
  for (const b of parts) { out.set(b, at); at += b.length; }
  return out;
}

/** Reads a zip made by makeZip (stored files only): { path: Uint8Array }. For tests and for "update my website". */
export function readZip(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const dec = new TextDecoder();
  let endAt = bytes.length - 22;
  while (endAt >= 0 && view.getUint32(endAt, true) !== 0x06054b50) endAt--;
  if (endAt < 0) throw new Error('Not a zip file');
  const count = view.getUint16(endAt + 10, true);
  let at = view.getUint32(endAt + 16, true);
  const files = {};
  for (let i = 0; i < count; i++) {
    if (view.getUint32(at, true) !== 0x02014b50) throw new Error('The zip is damaged');
    const method = view.getUint16(at + 10, true);
    const size = view.getUint32(at + 20, true);
    const nameLen = view.getUint16(at + 28, true);
    const extraLen = view.getUint16(at + 30, true);
    const commentLen = view.getUint16(at + 32, true);
    const localAt = view.getUint32(at + 42, true);
    const name = dec.decode(bytes.subarray(at + 46, at + 46 + nameLen));
    at += 46 + nameLen + extraLen + commentLen;
    if (name.endsWith('/')) continue;
    if (method !== 0) { files[name] = null; continue; } // compressed: not ours, skipped
    const dataAt = localAt + 30 + view.getUint16(localAt + 26, true) + view.getUint16(localAt + 28, true);
    files[name] = bytes.subarray(dataAt, dataAt + size);
  }
  return files;
}

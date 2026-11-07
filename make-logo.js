const fs = require('fs');
const zlib = require('zlib');

function makePng(W, H, fillFn) {
  const rows = [];
  for (let y = 0; y < H; y++) {
    const row = Buffer.alloc(1 + W * 4);
    row[0] = 0;
    for (let x = 0; x < W; x++) {
      const [r, g, b, a] = fillFn(x, y, W, H);
      const o = 1 + x * 4;
      row[o] = r; row[o+1] = g; row[o+2] = b; row[o+3] = a;
    }
    rows.push(row);
  }
  const raw = Buffer.concat(rows);
  const compressed = zlib.deflateSync(raw, { level: 9 });

  const tbl = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let v = n;
    for (let k = 0; k < 8; k++) v = v & 1 ? 0xEDB88320 ^ (v >>> 1) : v >>> 1;
    tbl[n] = v;
  }
  function crc32(buf) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) c = tbl[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function chunk(type, data) {
    const b = Buffer.alloc(12 + data.length);
    b.writeUInt32BE(data.length, 0);
    b.write(type, 4, 'ascii');
    data.copy(b, 8);
    b.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), data])), 8 + data.length);
    return b;
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

// Softixer asterisk logo: dark purple background + 6-line asterisk in lavender
function softixerIcon(x, y, W, H) {
  const cx = x - W/2 + 0.5, cy = y - H/2 + 0.5;
  const dist = Math.sqrt(cx*cx + cy*cy);
  const R = W * 0.44; // background circle radius

  // Rounded square background - use circle as approximation
  const inBg = dist < R;

  // 6-line asterisk at 30-degree increments
  let onLine = false;
  if (dist < R * 0.9) {
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 6;
      const perp = Math.abs(-cx * Math.sin(a) + cy * Math.cos(a));
      if (perp < W * 0.028) onLine = true;
    }
  }

  if (onLine) return [196, 181, 253, 255]; // lavender
  if (inBg) return [26, 5, 51, 255];       // dark purple
  return [0, 0, 0, 0];                      // transparent
}

// White version for panel_light (white asterisk on transparent)
function softixerWhite(x, y, W, H) {
  const cx = x - W/2 + 0.5, cy = y - H/2 + 0.5;
  const dist = Math.sqrt(cx*cx + cy*cy);
  const R = W * 0.44;
  let onLine = false;
  if (dist < R * 0.9) {
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 6;
      const perp = Math.abs(-cx * Math.sin(a) + cy * Math.cos(a));
      if (perp < W * 0.028) onLine = true;
    }
  }
  if (onLine) return [255, 255, 255, 255];
  return [0, 0, 0, 0];
}

const sizes = [
  ['src/assets/icons/icon.png', 128, softixerIcon],
  ['src/assets/icons/icon-nightly.png', 128, softixerIcon],
  ['src/assets/icons/panel_dark.png', 32, softixerWhite],
  ['src/assets/icons/panel_light.png', 32, softixerIcon],
  ['src/assets/images/roo.png', 128, softixerIcon],
  ['publisher-logo.png', 128, softixerIcon],
];

for (const [path, size, fn] of sizes) {
  const buf = makePng(size, size, fn);
  fs.writeFileSync(path, buf);
  console.log('wrote', path, buf.length, 'bytes');
}

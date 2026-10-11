import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, getPixel) {
  // getPixel(x, y) -> [r, g, b, a]
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc ^= buf[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crcVal, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdr = makeChunk('IHDR', ihdrData);
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

function renderJahdarIcon(size) {
  const center = size / 2;
  const radius = size * 0.46;
  const borderWidth = Math.max(1, size * 0.08);

  return createPNG(size, size, (x, y) => {
    const dx = x - center;
    const dy = y - center;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > radius) {
      return [0, 0, 0, 0]; // transparent outside
    }

    // Border
    if (dist >= radius - borderWidth) {
      // Golden border: #f59e0b to #fbbf24
      const t = (dist - (radius - borderWidth)) / borderWidth;
      return [245 + Math.floor(t * 10), 158 + Math.floor(t * 30), 11, 255];
    }

    // Inner core
    // Dark cyber Arabesque: #0f172a
    // Center glow: #b45309 to #ea580c
    const coreDist = Math.sqrt(dx * dx + (dy + size * 0.05) * (dy + size * 0.05));
    if (coreDist < size * 0.22) {
      // Golden scimitar spark / code disruption core
      return [254, 240, 138, 255]; // Bright gold (#fef08a)
    } else if (coreDist < size * 0.35) {
      return [245, 158, 11, 255]; // Amber (#f59e0b)
    }

    // Background shield gradient
    const gradT = (y / size);
    const r = Math.floor(15 * (1 - gradT) + 3 * gradT);
    const g = Math.floor(23 * (1 - gradT) + 7 * gradT);
    const b = Math.floor(42 * (1 - gradT) + 18 * gradT);
    return [r, g, b, 255];
  });
}

const outDir = path.resolve('extension/icons');
fs.mkdirSync(outDir, { recursive: true });

for (const s of [16, 48, 128]) {
  const buf = renderJahdarIcon(s);
  fs.writeFileSync(path.join(outDir, `icon-${s}.png`), buf);
  console.log(`Generated icon-${s}.png (${buf.length} bytes)`);
}

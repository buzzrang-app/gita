import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';

function createPng(width, height, r, g, b) {
  // Generates an uncompressed or zlib-compressed raw RGBA PNG
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: 6 (RGBA)
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Raw image scanlines
  const rowBytes = width * 4;
  const rawData = Buffer.alloc((rowBytes + 1) * height);
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.44;
  const innerRadius = radius * 0.65;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowBytes + 1);
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Gold / Saffron theme (#D97706 with warm paper #F5EFE4)
      if (dist < innerRadius) {
        // Center emblem color (Golden Saffron #D97706)
        rawData[pixelOffset] = 217;
        rawData[pixelOffset + 1] = 119;
        rawData[pixelOffset + 2] = 6;
        rawData[pixelOffset + 3] = 255;
      } else if (dist < radius) {
        // Outer ring (Dark charcoal #191815)
        rawData[pixelOffset] = 25;
        rawData[pixelOffset + 1] = 24;
        rawData[pixelOffset + 2] = 21;
        rawData[pixelOffset + 3] = 255;
      } else {
        // Background (Warm Paper #F5EFE4)
        rawData[pixelOffset] = 245;
        rawData[pixelOffset + 1] = 239;
        rawData[pixelOffset + 2] = 228;
        rawData[pixelOffset + 3] = 255;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const length = data.length;
  const buffer = Buffer.alloc(12 + length);
  buffer.writeUInt32BE(length, 0);
  buffer.write(type, 4);
  data.copy(buffer, 8);
  const crc = crc32(buffer.subarray(4, 8 + length));
  buffer.writeInt32BE(crc, 8 + length);
  return buffer;
}

// Precomputed CRC table
const crcTable = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPng(32, 32));

console.log('Successfully generated compliant PNG icons in /public!');

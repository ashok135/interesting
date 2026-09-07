const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c;
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  chunk.writeUInt32BE(crc32(typeAndData), 8 + len);
  return chunk;
}

function createPng(width, height, getPixel) {
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth 8
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace
  const ihdrChunk = createChunk('IHDR', ihdr);

  // Scanlines with filter 0
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);
  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // filter byte
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Letter patterns for "INT" monogram (15x7 grid)
const monogramGrid = [
  "### ### #   #",
  " #   #  ##  #",
  " #   #  # # #",
  " #   #  #  ##",
  "###  #  #   #"
];

function drawIcon(width, height, isMaskable = false) {
  return createPng(width, height, (x, y, w, h) => {
    // Normalised coordinates (-1 to 1)
    const nx = (x / w) * 2 - 1;
    const ny = (y / h) * 2 - 1;
    const dist = Math.sqrt(nx * nx + ny * ny);

    // Deep forest emerald luxury background (#0d3821 to #082415 gradient)
    const gradFactor = 0.5 * (1 + ny);
    let bgR = Math.round(13 * (1 - gradFactor * 0.3));
    let bgG = Math.round(56 * (1 - gradFactor * 0.3));
    let bgB = Math.round(33 * (1 - gradFactor * 0.3));

    // For non-maskable rounded squircle
    if (!isMaskable) {
      const cornerRadius = 0.22;
      const qx = Math.max(0, Math.abs(nx) - (1 - cornerRadius));
      const qy = Math.max(0, Math.abs(ny) - (1 - cornerRadius));
      const cornerDist = Math.sqrt(qx * qx + qy * qy);
      if (cornerDist > cornerRadius) {
        return [0, 0, 0, 0]; // Transparent outside squircle
      }
    }

    // Outer subtle gold accent ring
    const ringRadius = isMaskable ? 0.68 : 0.76;
    const ringThickness = isMaskable ? 0.025 : 0.03;
    if (Math.abs(dist - ringRadius) < ringThickness) {
      // Warm gold ring (#e6b800)
      return [230, 184, 0, 255];
    }

    // Inner subtle glow
    if (dist < ringRadius) {
      const glow = Math.max(0, 1 - (dist / ringRadius));
      bgR = Math.min(255, Math.round(bgR + 15 * glow));
      bgG = Math.min(255, Math.round(bgG + 35 * glow));
      bgB = Math.min(255, Math.round(bgB + 20 * glow));
    }

    // Diamond emblem at top center
    const dCenterX = 0;
    const dCenterY = isMaskable ? -0.42 : -0.46;
    const dSize = isMaskable ? 0.10 : 0.12;
    const dDist = Math.abs(nx - dCenterX) + Math.abs(ny - dCenterY);
    if (dDist < dSize) {
      // Shiny gold diamond
      return [255, 215, 0, 255];
    }

    // Monogram "INT" mapping
    const scale = isMaskable ? 0.52 : 0.62;
    // Map monogram from (-scale, -0.15) to (scale, 0.25)
    const mLeft = -scale;
    const mRight = scale;
    const mTop = -0.18;
    const mBottom = 0.28;

    if (nx >= mLeft && nx <= mRight && ny >= mTop && ny <= mBottom) {
      const colFrac = (nx - mLeft) / (mRight - mLeft);
      const rowFrac = (ny - mTop) / (mBottom - mTop);
      const gridW = 13;
      const gridH = 5;
      const gridX = Math.floor(colFrac * gridW);
      const gridY = Math.floor(rowFrac * gridH);

      if (gridY >= 0 && gridY < gridH && gridX >= 0 && gridX < gridW) {
        if (monogramGrid[gridY][gridX] === '#') {
          // Luxury polished gold (#f3c623 to #d4a017)
          const goldGrad = 0.5 * (1 + rowFrac);
          const gR = Math.round(255 - 20 * goldGrad);
          const gG = Math.round(215 - 30 * goldGrad);
          const gB = Math.round(40 - 20 * goldGrad);
          return [gR, gG, gB, 255];
        }
      }
    }

    // Bottom subtle ribbon line
    const bY = isMaskable ? 0.44 : 0.48;
    if (Math.abs(ny - bY) < 0.015 && Math.abs(nx) < (isMaskable ? 0.35 : 0.45)) {
      return [230, 184, 0, 220];
    }

    return [bgR, bgG, bgB, 255];
  });
}

const publicDir = path.join(__dirname, '..', 'public');

console.log('Generating PWA icons...');
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), drawIcon(192, 192, false));
console.log('Created icon-192.png');

fs.writeFileSync(path.join(publicDir, 'icon-512.png'), drawIcon(512, 512, false));
console.log('Created icon-512.png');

fs.writeFileSync(path.join(publicDir, 'icon-maskable-512.png'), drawIcon(512, 512, true));
console.log('Created icon-maskable-512.png');

fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), drawIcon(180, 180, false));
console.log('Created apple-touch-icon.png');

console.log('All icons generated successfully!');

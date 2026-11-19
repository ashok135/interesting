import sharp from 'sharp';
import fs from 'fs';

async function generateAllRoundIcons() {
  const size = 512;
  const radius = 246; // circle radius leaving safe margin
  
  // 1. Crisp white circle SVG with anti-aliasing
  const circleSvg = Buffer.from(`
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="#ffffff" />
    </svg>
  `);
  
  // 2. Scale squirrel emblem comfortably inside the round white badge
  // 158 x 138 original aspect ratio
  const sqW = 340;
  const sqH = Math.round(sqW * (138 / 158)); // 297
  
  const resizedSq = await sharp('public/images/squirrel-logo.png')
    .resize(sqW, sqH, { kernel: sharp.kernel.lanczos3, fit: 'contain' })
    .toBuffer();
    
  // 3. Composite Master 512x512 Round Badge Icon
  const masterBadgeBuffer = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  .composite([
    { input: circleSvg, top: 0, left: 0 },
    { input: resizedSq, gravity: 'center' }
  ])
  .png()
  .toBuffer();
  
  // Save 512x512 icons
  fs.writeFileSync('public/icon-512.png', masterBadgeBuffer);
  fs.writeFileSync('public/icon.png', masterBadgeBuffer);
  fs.writeFileSync('app/icon.png', masterBadgeBuffer);
  console.log('✓ Saved 512x512 master icons (public/icon-512.png, public/icon.png, app/icon.png)');

  // 4. Save 192x192 icon for mobile and desktop browser tabs
  const icon192 = await sharp(masterBadgeBuffer)
    .resize(192, 192, { kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();
  fs.writeFileSync('public/icon-192.png', icon192);
  console.log('✓ Saved 192x192 icon (public/icon-192.png)');

  // 5. Save Apple Touch Icon (180x180)
  const appleIcon = await sharp(masterBadgeBuffer)
    .resize(180, 180, { kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();
  fs.writeFileSync('public/apple-touch-icon.png', appleIcon);
  fs.writeFileSync('app/apple-icon.png', appleIcon);
  console.log('✓ Saved 180x180 Apple touch icons (public/apple-touch-icon.png, app/apple-icon.png)');

  // 6. Save Maskable 512x512 icon for Android PWA
  fs.writeFileSync('public/icon-maskable-512.png', masterBadgeBuffer);
  console.log('✓ Saved 512x512 maskable icon');

  // 7. Generate Multi-resolution ICO (16x16, 32x32, 48x48)
  const p16 = await sharp(masterBadgeBuffer).resize(16, 16, { kernel: sharp.kernel.lanczos3 }).png().toBuffer();
  const p32 = await sharp(masterBadgeBuffer).resize(32, 32, { kernel: sharp.kernel.lanczos3 }).png().toBuffer();
  const p48 = await sharp(masterBadgeBuffer).resize(48, 48, { kernel: sharp.kernel.lanczos3 }).png().toBuffer();

  const count = 3;
  const headerSize = 6;
  const dirEntrySize = 16;
  let offset = headerSize + count * dirEntrySize;
  const icoBuffers = [
    { width: 16, height: 16, buffer: p16 },
    { width: 32, height: 32, buffer: p32 },
    { width: 48, height: 48, buffer: p48 }
  ];

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: 1 = ICO
  header.writeUInt16LE(count, 4); // count
  
  const entries = [];
  for (const item of icoBuffers) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(item.width, 0);
    entry.writeUInt8(item.height, 1);
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(item.buffer.length, 8); // image size
    entry.writeUInt32LE(offset, 12); // image offset
    entries.push(entry);
    offset += item.buffer.length;
  }
  
  const fullIco = Buffer.concat([
    header,
    ...entries,
    ...icoBuffers.map(b => b.buffer)
  ]);

  fs.writeFileSync('public/favicon.ico', fullIco);
  fs.writeFileSync('app/favicon.ico', fullIco);
  console.log(`✓ Saved multi-resolution public/favicon.ico and app/favicon.ico (${fullIco.length} bytes)`);
}

generateAllRoundIcons();

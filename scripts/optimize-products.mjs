import fs from 'fs';
import path from 'path';
import https from 'https';
import sharp from 'sharp';

const urls = [
  'https://intersting.duckdns.org/wp-content/uploads/2026/11/hamper-casket-1.jpg',
  'https://intersting.duckdns.org/wp-content/uploads/2026/11/packaging-tin-seal-1.jpg',
  'https://intersting.duckdns.org/wp-content/uploads/2026/11/purity-quality-seal-1.jpg',
  'https://intersting.duckdns.org/wp-content/uploads/2026/11/hamper-gold.jpg',
  'https://intersting.duckdns.org/wp-content/uploads/2026/11/dryfruit-chikki.jpg',
  'https://intersting.duckdns.org/wp-content/uploads/2026/11/gourmet-laddu.jpg',
  'https://intersting.duckdns.org/wp-content/uploads/2026/11/trad-kajukatli-1.jpg',
  'https://intersting.duckdns.org/wp-content/uploads/2026/11/trail-mix-omega.jpg',
  'https://intersting.duckdns.org/wp-content/uploads/2026/11/dryfruit-berries.jpg',
  'https://intersting.duckdns.org/wp-content/uploads/2026/11/nuts-pistachios.jpg',
  'https://intersting.duckdns.org/wp-content/uploads/2026/11/nuts-almonds.jpg',
  'https://intersting.duckdns.org/wp-content/uploads/2026/11/nuts-cashews-1.jpg',
  'https://intersting.duckdns.org/wp-content/uploads/2026/11/makhana-roasted.jpg',
  'https://intersting.duckdns.org/wp-content/uploads/2026/11/roasted-chana-1.jpg',
  'https://intersting.duckdns.org/wp-content/uploads/2026/11/dryfruit-raisins-1.jpg',
  'https://intersting.duckdns.org/wp-content/uploads/2026/11/dryfruit-dates-1.jpg',
  'https://intersting.duckdns.org/wp-content/uploads/2026/11/dryfruit-anjeer.jpg',
  'https://intersting.duckdns.org/wp-content/uploads/2026/11/seeds-mix-1.jpg',
  'https://intersting.duckdns.org/wp-content/uploads/2026/11/seeds-pumpkin-1.jpg',
  'https://intersting.duckdns.org/wp-content/uploads/2026/11/seeds-chia-1.jpg',
  'https://intersting.duckdns.org/wp-content/uploads/2026/11/nuts-walnuts-1.jpg'
];

const targetDir = path.resolve('public/images/products');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { rejectUnauthorized: false }, res => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to fetch ${url}, status: ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function processAll() {
  console.log(`Starting download & optimization of ${urls.length} product images...`);
  let totalOriginalBytes = 0;
  let totalOptimizedWebpBytes = 0;
  let totalOptimizedJpgBytes = 0;

  for (const url of urls) {
    const filename = path.basename(url);
    const basename = filename.replace(/\.[^.]+$/, '');
    
    try {
      const originalBuffer = await download(url);
      totalOriginalBytes += originalBuffer.length;
      
      const meta = await sharp(originalBuffer).metadata();
      
      // Target dimensions: Max 800px width/height (retina resolution for ecommerce grids & detail views)
      // High quality WebP
      const webpBuffer = await sharp(originalBuffer)
        .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82, effort: 6 })
        .toBuffer();
        
      // High quality progressive JPEG (fallback)
      const jpgBuffer = await sharp(originalBuffer)
        .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 82, progressive: true, mozjpeg: true })
        .toBuffer();

      totalOptimizedWebpBytes += webpBuffer.length;
      totalOptimizedJpgBytes += jpgBuffer.length;

      // Save both webp and jpg
      fs.writeFileSync(path.join(targetDir, `${basename}.webp`), webpBuffer);
      fs.writeFileSync(path.join(targetDir, `${basename}.jpg`), jpgBuffer);

      const origKb = (originalBuffer.length / 1024).toFixed(1);
      const webpKb = (webpBuffer.length / 1024).toFixed(1);
      const savings = (100 - (webpBuffer.length / originalBuffer.length * 100)).toFixed(1);

      console.log(`✓ ${filename} [${meta.width}x${meta.height}] : ${origKb} KB -> ${webpKb} KB WebP (-${savings}%)`);
    } catch (err) {
      console.error(`✗ Error processing ${url}:`, err.message);
    }
  }

  const origMb = (totalOriginalBytes / (1024 * 1024)).toFixed(2);
  const webpMb = (totalOptimizedWebpBytes / (1024 * 1024)).toFixed(2);
  const totalSavings = (100 - (totalOptimizedWebpBytes / totalOriginalBytes * 100)).toFixed(1);

  console.log('====================================================');
  console.log(`TOTAL ORIGINAL SIZE: ${origMb} MB`);
  console.log(`TOTAL OPTIMIZED WEBP SIZE: ${webpMb} MB (-${totalSavings}% reduction!)`);
  console.log(`Saved all files to: ${targetDir}`);
}

processAll();

import fs from 'fs';
import https from 'https';

const envText = fs.readFileSync('.env.local', 'utf8');
const env = {};
envText.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value.trim();
  }
});

const wcUrl = (env.NEXT_PUBLIC_WC_URL || env.WC_URL || 'https://intersting.duckdns.org').replace(/\/$/, '');
const ck = env.WC_CONSUMER_KEY;
const cs = env.WC_CONSUMER_SECRET;
const auth = Buffer.from(`${ck}:${cs}`).toString('base64');

const req = https.get(`${wcUrl}/wp-json/wc/v3/products?per_page=100`, {
  headers: { Authorization: `Basic ${auth}` },
  rejectUnauthorized: false
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    try {
      const prods = JSON.parse(body);
      console.log('Total products count:', prods.length);
      const uniqueImages = new Set();
      const productImages = [];
      prods.forEach(p => {
        (p.images || []).forEach(img => {
          uniqueImages.add(img.src);
          productImages.push({ id: p.id, name: p.name, src: img.src });
        });
      });
      console.log('Total product images:', productImages.length);
      console.log('Unique image URLs:', uniqueImages.size);
      console.log(Array.from(uniqueImages));
    } catch (e) {
      console.error('JSON parse error:', e.message);
    }
  });
});
req.on('error', console.error);

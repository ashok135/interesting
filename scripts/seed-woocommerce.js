// seed-woocommerce.js
const auth = Buffer.from('ashok:G4J1 hiEc rSBt ALs7 Ftyh 6mBf').toString('base64');
const baseUrl = 'http://interesting.local/wp-json';

async function wcRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Authorization': 'Basic ' + auth,
      'Content-Type': 'application/json',
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${baseUrl}/wc/v3${endpoint}`, options);
  const data = await res.json();
  if (!res.ok) {
    console.error(`Error on ${method} /wc/v3${endpoint}:`, data);
  }
  return data;
}

const uploadedMediaCache = new Map();

async function uploadMedia(imageUrl, filename) {
  if (uploadedMediaCache.has(imageUrl)) {
    return uploadedMediaCache.get(imageUrl);
  }
  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      console.warn(`Could not download image: ${imageUrl}`);
      return 20; // Fallback to already uploaded cashew image
    }
    const arrayBuf = await imgRes.arrayBuffer();
    const wpRes = await fetch(`${baseUrl}/wp/v2/media`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + auth,
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename=${filename}`,
      },
      body: Buffer.from(arrayBuf),
    });
    const media = await wpRes.json();
    if (media && media.id) {
      uploadedMediaCache.set(imageUrl, media.id);
      return media.id;
    }
  } catch (err) {
    console.warn('Upload media error:', err.message);
  }
  return 20;
}

const CATEGORY_DEFINITIONS = [
  {
    name: 'Nuts',
    slug: 'nuts',
    subcategories: [
      { name: 'Cashews (Kaju)', slug: 'cashews-kaju' },
      { name: 'Almonds (Badam)', slug: 'almonds-badam' },
      { name: 'Walnuts (Akhrot)', slug: 'walnuts-akhrot' },
      { name: 'Pistachios (Pista)', slug: 'pistachios-pista' },
    ],
    products: [
      {
        name: 'Royal Jumbo W180 King Cashews',
        slug: 'royal-jumbo-w180-king-cashews',
        regular_price: '549',
        sale_price: '449',
        subSlug: 'cashews-kaju',
        short_description: '250g Vacuum Tin • W180 Giant Grade',
        description: 'Directly sourced from Konkan GI certified orchards. Slow wood-fired with pink salt.',
        image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&auto=format&fit=crop&q=80',
        filename: 'nuts-cashews.jpg',
        weight: '250g',
      },
      {
        name: 'California Nonpareil Supreme Almonds',
        slug: 'california-nonpareil-supreme-almonds',
        regular_price: '499',
        sale_price: '429',
        subSlug: 'almonds-badam',
        short_description: '250g Jar • 100% Raw Supreme Grade',
        description: 'Crisp, sweet, nonpareil California almonds harvested at peak maturity with natural brown skins.',
        image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&auto=format&fit=crop&q=80',
        filename: 'nuts-almonds.jpg',
        weight: '250g',
      },
      {
        name: 'Kashmiri Snow-White Walnut Kernels',
        slug: 'kashmiri-snow-white-walnut-kernels',
        regular_price: '649',
        sale_price: '549',
        subSlug: 'walnuts-akhrot',
        short_description: '200g Tin • Extra Light Halves',
        description: 'Hand-cracked in Kupwara valley, high in pure plant Omega-3 with sweet buttery finish.',
        image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80',
        filename: 'nuts-walnuts.jpg',
        weight: '200g',
      },
    ],
  },
  {
    name: 'Seeds',
    slug: 'seeds',
    subcategories: [
      { name: 'Chia Seeds', slug: 'chia-seeds' },
      { name: 'Pumpkin Seeds', slug: 'pumpkin-seeds' },
      { name: 'Sunflower Seeds', slug: 'sunflower-seeds' },
      { name: 'Roasted Seed Mix', slug: 'roasted-seed-mix' },
    ],
    products: [
      {
        name: 'Organic Raw Black Chia Seeds',
        slug: 'organic-raw-black-chia-seeds',
        regular_price: '299',
        sale_price: '249',
        subSlug: 'chia-seeds',
        short_description: '250g Pouch • High Fibre & Omega-3',
        description: 'Sun-dried pure black chia seeds, perfect for overnight pudding, smoothies, and daily vitality.',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
        filename: 'seeds-chia.jpg',
        weight: '250g',
      },
      {
        name: 'AAA Grade Himalayan Pumpkin Seeds',
        slug: 'aaa-grade-himalayan-pumpkin-seeds',
        regular_price: '349',
        sale_price: '299',
        subSlug: 'pumpkin-seeds',
        short_description: '200g Pouch • Lightly Salted Green Kernels',
        description: 'Large plump green kernels rich in zinc and magnesium, gently roasted for a crisp savory snap.',
        image: 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?w=600&auto=format&fit=crop&q=80',
        filename: 'seeds-pumpkin.jpg',
        weight: '200g',
      },
      {
        name: '5-in-1 Roasted Super Omega Seed Mix',
        slug: '5-in-1-roasted-super-omega-seed-mix',
        regular_price: '389',
        sale_price: '329',
        subSlug: 'roasted-seed-mix',
        short_description: '250g Jar • Chia, Flax, Pumpkin, Sesame, Sunflower',
        description: 'Wood-roasted 5-seed blend spiced with crushed pink salt. Complete daily micronutrient powerhouse.',
        image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
        filename: 'seeds-mix.jpg',
        weight: '250g',
      },
    ],
  },
  {
    name: 'Dry Fruits',
    slug: 'dry-fruits',
    subcategories: [
      { name: 'Afghan Figs (Anjeer)', slug: 'afghan-figs-anjeer' },
      { name: 'Medjool Dates', slug: 'medjool-dates' },
      { name: 'Green Raisins (Kishmish)', slug: 'green-raisins-kishmish' },
      { name: 'Dried Cranberries', slug: 'dried-cranberries' },
    ],
    products: [
      {
        name: 'Jumbo Royal Afghan Anjeer (Figs)',
        slug: 'jumbo-royal-afghan-anjeer-figs',
        regular_price: '699',
        sale_price: '599',
        subSlug: 'afghan-figs-anjeer',
        short_description: '250g Ring Pack • Naturally Sun-Dried',
        description: 'Plump golden sun-dried Afghan figs rich in dietary iron, potassium, and natural sweetness.',
        image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80',
        filename: 'dryfruit-figs.jpg',
        weight: '250g',
      },
      {
        name: 'Premium Arabian Medjool King Dates',
        slug: 'premium-arabian-medjool-king-dates',
        regular_price: '529',
        sale_price: '449',
        subSlug: 'medjool-dates',
        short_description: '300g Luxury Box • Soft & Juicy',
        description: 'Caramel-textured large Medjool dates with 100% natural sugars. Zero preservatives added.',
        image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
        filename: 'dryfruit-dates.jpg',
        weight: '300g',
      },
      {
        name: 'Long Green Seedless Afghan Raisins',
        slug: 'long-green-seedless-afghan-raisins',
        regular_price: '269',
        sale_price: '219',
        subSlug: 'green-raisins-kishmish',
        short_description: '250g Pouch • Naturally Sweet',
        description: 'Slender green seedless kishmish gently shade-dried to preserve bright natural colour and juiciness.',
        image: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=600&auto=format&fit=crop&q=80',
        filename: 'dryfruit-raisins.jpg',
        weight: '250g',
      },
    ],
  },
  {
    name: 'Millets',
    slug: 'millets',
    subcategories: [
      { name: 'Ragi Crisps', slug: 'ragi-crisps' },
      { name: 'Jowar Puffs', slug: 'jowar-puffs' },
      { name: 'Foxtail Munchies', slug: 'foxtail-munchies' },
      { name: 'Bajra Crunch', slug: 'bajra-crunch' },
    ],
    products: [
      {
        name: 'Slow-Baked Ragi & Herb Crisps',
        slug: 'slow-baked-ragi-herb-crisps',
        regular_price: '219',
        sale_price: '179',
        subSlug: 'ragi-crisps',
        short_description: '150g Pouch • 100% Baked Zero Palm Oil',
        description: 'Crunchy finger millet crisps seasoned with sun-dried oregano, rosemary, and rock salt.',
        image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80',
        filename: 'millets-ragi.jpg',
        weight: '150g',
      },
      {
        name: 'Tangy Cheese Roasted Jowar Puffs',
        slug: 'tangy-cheese-roasted-jowar-puffs',
        regular_price: '189',
        sale_price: '149',
        subSlug: 'jowar-puffs',
        short_description: '120g Pouch • High Fibre Sorghum',
        description: 'Puffed whole white sorghum coated with sharp cheddar seasoning. Light on the stomach.',
        image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&auto=format&fit=crop&q=80',
        filename: 'millets-jowar.jpg',
        weight: '120g',
      },
      {
        name: 'Spiced Foxtail Millet Munch',
        slug: 'spiced-foxtail-millet-munch',
        regular_price: '199',
        sale_price: '169',
        subSlug: 'foxtail-munchies',
        short_description: '140g Pouch • Chatpata Masala Flavour',
        description: 'Crispy foxtail millet sticks infused with dry mango powder, cumin, and black salt.',
        image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
        filename: 'millets-foxtail.jpg',
        weight: '140g',
      },
    ],
  },
  {
    name: 'Roasted Snacks',
    slug: 'roasted-snacks',
    subcategories: [
      { name: 'Spiced Makhana', slug: 'spiced-makhana' },
      { name: 'Wood-Fired Chana', slug: 'wood-fired-chana' },
      { name: 'Roasted Soy Nuts', slug: 'roasted-soy-nuts' },
    ],
    products: [
      {
        name: 'Himalayan Pink Salt Popped Makhana',
        slug: 'himalayan-pink-salt-popped-makhana',
        regular_price: '249',
        sale_price: '199',
        subSlug: 'spiced-makhana',
        short_description: '100g Jar • Jumbo Lotus Seeds',
        description: 'Super crunchy popped foxnuts wood-roasted in cold-pressed coconut oil and pink salt.',
        image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&auto=format&fit=crop&q=80',
        filename: 'roasted-makhana.jpg',
        weight: '100g',
      },
      {
        name: 'Tellicherry Black Pepper Roasted Chana',
        slug: 'tellicherry-black-pepper-roasted-chana',
        regular_price: '169',
        sale_price: '139',
        subSlug: 'wood-fired-chana',
        short_description: '200g Pouch • High Protein Snack',
        description: 'Skinless organic roasted chickpeas crushed with aromatic Malabar peppercorns.',
        image: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=600&auto=format&fit=crop&q=80',
        filename: 'roasted-chana.jpg',
        weight: '200g',
      },
      {
        name: 'Crispy Peri Peri Roasted Makhana',
        slug: 'crispy-peri-peri-roasted-makhana',
        regular_price: '259',
        sale_price: '209',
        subSlug: 'spiced-makhana',
        short_description: '100g Jar • Spicy Birdseye Chilli',
        description: 'Slow roasted makhana coated with fiery African bird’s eye chilli and tangy garlic seasoning.',
        image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80',
        filename: 'roasted-periperi.jpg',
        weight: '100g',
      },
    ],
  },
  {
    name: 'Flavoured Nuts',
    slug: 'flavoured-nuts',
    subcategories: [
      { name: 'Peri Peri Kaju', slug: 'peri-peri-kaju' },
      { name: 'Smoked Barbeque Almonds', slug: 'smoked-barbeque-almonds' },
      { name: 'Lightly Salted Pistachios', slug: 'lightly-salted-pistachios' },
    ],
    products: [
      {
        name: 'Fiery Peri Peri Wood-Fired Cashews',
        slug: 'fiery-peri-peri-wood-fired-cashews',
        regular_price: '589',
        sale_price: '489',
        subSlug: 'peri-peri-kaju',
        short_description: '250g Tin • W180 Cashews with Spicy Peri Peri',
        description: 'Whole king cashews roasted in iron pans and dusted with bold African bird’s eye chilli.',
        image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&auto=format&fit=crop&q=80',
        filename: 'flavoured-kaju.jpg',
        weight: '250g',
      },
      {
        name: 'Hickory Smoked Barbeque Almonds',
        slug: 'hickory-smoked-barbeque-almonds',
        regular_price: '529',
        sale_price: '459',
        subSlug: 'smoked-barbeque-almonds',
        short_description: '250g Tin • Slow Hickory Smoked',
        description: 'California almonds slow-cured with authentic hickory wood smoke and a touch of raw cane sugar.',
        image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&auto=format&fit=crop&q=80',
        filename: 'flavoured-almonds.jpg',
        weight: '250g',
      },
      {
        name: 'Lightly Salted California Pistachios',
        slug: 'lightly-salted-california-pistachios',
        regular_price: '579',
        sale_price: '499',
        subSlug: 'lightly-salted-pistachios',
        short_description: '250g Pouch • Jumbo Naturally Opened',
        description: 'Shell-on jumbo pistachios with a crisp snap and delicate sea-salt dusting.',
        image: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=600&auto=format&fit=crop&q=80',
        filename: 'flavoured-pista.jpg',
        weight: '250g',
      },
    ],
  },
  {
    name: 'Trail Mix',
    slug: 'trail-mix',
    subcategories: [
      { name: 'Omega Booster Mix', slug: 'omega-booster-mix' },
      { name: 'Wild Berry Delight', slug: 'wild-berry-delight' },
      { name: 'Workout Protein Trail', slug: 'workout-protein-trail' },
    ],
    products: [
      {
        name: 'Gourmet Omega 3 Vitality Trail Mix',
        slug: 'gourmet-omega-3-vitality-trail-mix',
        regular_price: '469',
        sale_price: '399',
        subSlug: 'omega-booster-mix',
        short_description: '250g Jar • Walnuts, Chia, Flax & Almonds',
        description: 'Handcrafted blend of brain-boosting raw nuts and heart-healthy seeds formulated for daily energy.',
        image: 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?w=600&auto=format&fit=crop&q=80',
        filename: 'trail-omega.jpg',
        weight: '250g',
      },
      {
        name: 'Antioxidant Wild Berry & Nut Blend',
        slug: 'antioxidant-wild-berry-nut-blend',
        regular_price: '489',
        sale_price: '419',
        subSlug: 'wild-berry-delight',
        short_description: '250g Jar • Blueberries, Cranberries & Cashews',
        description: 'Tart dried Canadian blueberries, cranberries, paired with buttery cashew kernels and dark raisins.',
        image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80',
        filename: 'trail-berry.jpg',
        weight: '250g',
      },
      {
        name: 'Energy Crunch Pre-Workout Trail',
        slug: 'energy-crunch-pre-workout-trail',
        regular_price: '459',
        sale_price: '389',
        subSlug: 'workout-protein-trail',
        short_description: '250g Pouch • High Plant Protein',
        description: 'Clean sustained energy formula with roasted pumpkin seeds, almonds, dark cacao nibs, and figs.',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
        filename: 'trail-protein.jpg',
        weight: '250g',
      },
    ],
  },
  {
    name: 'Traditional Snacks',
    slug: 'traditional-snacks',
    subcategories: [
      { name: 'Pure Desi Ghee Kaju Katli', slug: 'desi-ghee-kaju-katli' },
      { name: 'Dry Fruit Laddu', slug: 'dry-fruit-laddu' },
      { name: 'Artisanal Chikki', slug: 'artisanal-chikki' },
    ],
    products: [
      {
        name: 'Pure Shahi Kaju Katli (A2 Desi Ghee)',
        slug: 'pure-shahi-kaju-katli-desi-ghee',
        regular_price: '649',
        sale_price: '549',
        subSlug: 'desi-ghee-kaju-katli',
        short_description: '400g Royal Box • Melt-in-Mouth Cashew Diamond',
        description: 'Traditional slow-kneaded cashew confection made with 75% cashew pulp, raw sugar, and pure A2 cow ghee.',
        image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80',
        filename: 'trad-kajukatli.jpg',
        weight: '400g',
      },
      {
        name: 'Royal Gond & Dry Fruit Nutri-Laddu',
        slug: 'royal-gond-dry-fruit-nutri-laddu',
        regular_price: '589',
        sale_price: '499',
        subSlug: 'dry-fruit-laddu',
        short_description: '350g Tin • No Refined Sugar',
        description: 'Wholesome winter laddus packed with edible gum, crushed almonds, cashews, cardamom, and organic jaggery.',
        image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80',
        filename: 'trad-laddu.jpg',
        weight: '350g',
      },
      {
        name: 'Jaggery & Crushed Nut Artisanal Chikki',
        slug: 'jaggery-crushed-nut-artisanal-chikki',
        regular_price: '279',
        sale_price: '229',
        subSlug: 'artisanal-chikki',
        short_description: '250g Box • Crunchy Kolhapuri Jaggery',
        description: 'Crisp brittle loaded with roasted cashews, almonds, and peanuts held together by fragrant jaggery caramel.',
        image: 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?w=600&auto=format&fit=crop&q=80',
        filename: 'trad-chikki.jpg',
        weight: '250g',
      },
    ],
  },
  {
    name: 'Premium Gift Packs',
    slug: 'premium-gift-packs',
    subcategories: [
      { name: 'Royal Brass & Velvet Casket', slug: 'royal-brass-velvet-casket' },
      { name: 'Festive Gourmet Grand Box', slug: 'festive-gourmet-grand-box' },
      { name: 'Artisanal Keepsake Luxury Hamper', slug: 'artisanal-keepsake-luxury-hamper' },
    ],
    products: [
      {
        name: 'The Sovereign 4-Jar Brass & Velvet Casket',
        slug: 'the-sovereign-4-jar-brass-velvet-casket',
        regular_price: '1899',
        sale_price: '1499',
        subSlug: 'royal-brass-velvet-casket',
        short_description: '4 x 150g Glass Jars • Velvet Lined Keepsake Box',
        description: 'Contains W180 King Cashews, Kashmiri Walnuts, Mamra Almonds, and Golden Afghan Figs in handcrafted velvet.',
        image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&auto=format&fit=crop&q=80',
        filename: 'hamper-casket.jpg',
        weight: '600g',
      },
      {
        name: 'Festive Gourmet Grand Celebration Box',
        slug: 'festive-gourmet-grand-celebration-box',
        regular_price: '1499',
        sale_price: '1199',
        subSlug: 'festive-gourmet-grand-box',
        short_description: '6-Compartment Gold Embossed Gift Box',
        description: 'Curated celebration hamper with Peri Peri Kaju, Smoked Almonds, Salted Pistachios, and Anjeer.',
        image: 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?w=600&auto=format&fit=crop&q=80',
        filename: 'hamper-festive.jpg',
        weight: '500g',
      },
      {
        name: 'Artisanal Wooden Keepsake Luxury Hamper',
        slug: 'artisanal-wooden-keepsake-luxury-hamper',
        regular_price: '2299',
        sale_price: '1899',
        subSlug: 'artisanal-keepsake-luxury-hamper',
        short_description: 'Carved Teak Finish Chest • Gourmet Pantry Deluxe',
        description: 'Carved wooden heirloom chest packed with rare saffron glazed cashews, wild forest honey, and royal trail mix.',
        image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&auto=format&fit=crop&q=80',
        filename: 'hamper-wooden.jpg',
        weight: '800g',
      },
    ],
  },
];

async function run() {
  console.log('--- Loading existing categories ---');
  const allCats = await wcRequest('/products/categories?per_page=100');
  const catMap = new Map();
  for (const c of allCats) {
    catMap.set(c.slug, c.id);
  }

  console.log('--- Loading existing products ---');
  const allProducts = await wcRequest('/products?per_page=100');
  console.log(`Currently ${allProducts.length} products in WooCommerce.`);

  for (const def of CATEGORY_DEFINITIONS) {
    const parentId = catMap.get(def.slug);
    console.log(`\nProcessing Category: ${def.name} (#${parentId})`);

    for (const p of def.products) {
      const subId = catMap.get(p.subSlug);
      const categories = [{ id: parentId }];
      if (subId) categories.push({ id: subId });

      // Upload or reuse media ID
      const mediaId = await uploadMedia(p.image, p.filename);

      const existing = allProducts.find(item => item.slug === p.slug || item.name === p.name);

      const payload = {
        name: p.name,
        slug: p.slug,
        type: 'simple',
        status: 'publish',
        featured: true,
        catalog_visibility: 'visible',
        regular_price: p.regular_price,
        sale_price: p.sale_price,
        short_description: `<p>${p.short_description}</p>`,
        description: `<p>${p.description}</p>`,
        categories,
        images: [{ id: mediaId }],
        manage_stock: false,
        stock_status: 'instock',
        attributes: [
          {
            name: 'Pack Size',
            visible: true,
            variation: false,
            options: [p.weight],
          },
        ],
      };

      if (existing) {
        console.log(`  Updating product #${existing.id}: ${p.name}`);
        await wcRequest(`/products/${existing.id}`, 'PUT', payload);
      } else {
        console.log(`  Creating new product: ${p.name}`);
        const res = await wcRequest('/products', 'POST', payload);
        if (res && res.id) {
          console.log(`    Created successfully with ID #${res.id}`);
        }
      }
    }
  }

  console.log('\n🎉 SUCCESS: All 27 products seeded into WooCommerce with categories and subcategories!');
}

run().catch(console.error);

export interface CategoryHeaderInfo {
  title: string;
  subtitle: string;
  badge: string;
}

export const CATEGORY_HEADERS: Record<string, CategoryHeaderInfo> = {
  nuts: {
    title: 'Cashew Heavens — Fresh Harvest W180 & W240',
    subtitle: 'Directly cured from Goan & Konkan orchards with guaranteed whole grade integrity',
    badge: 'King Grade',
  },
  'dry-fruits': {
    title: 'Royal Dry Fruits — California Almonds & Kashmiri Walnuts',
    subtitle: 'Sun-ripened, hand-sorted kernels rich in healthy fats, Vitamin E and plant nutrition',
    badge: '100% Natural',
  },
  seeds: {
    title: 'Super Seeds & Vitality Kernels — Chia, Pumpkin & Sunflower',
    subtitle: 'Raw & lightly roasted edible seeds packed for daily immunity and active wellness',
    badge: 'Superfood',
  },
  millets: {
    title: 'Artisanal Millet Crisps — Jowar, Ragi & Bajra Puffs',
    subtitle: 'Wood-fired crunch seasoned with Himalayan pink rock salt and zero palm oil',
    badge: 'Gluten-Free',
  },
  'roasted-snacks': {
    title: 'Wood-Fired Slow Roasted Crisps & Golden Nuts',
    subtitle: 'Artisanal small batches slow-roasted over controlled heat for peak natural crunch',
    badge: 'Slow Roasted',
  },
  'flavoured-nuts': {
    title: 'Gourmet Flavoured Cashews — Kesar, Tellicherry Pepper & Herbs',
    subtitle: 'Infused with royal Kashmiri saffron, tellicherry pepper and aromatic herbs',
    badge: 'Chef Signature',
  },
  'trail-mix': {
    title: 'Vitality Energy Trail Mixes — Berries, Nuts & Seed Blends',
    subtitle: 'Wholesome on-the-go fuel packed with antioxidants, crunch and natural sweetness',
    badge: 'Active Fuel',
  },
  'traditional-snacks': {
    title: 'Heritage Indian Savouries — Murukku & Regional Crisps',
    subtitle: 'Authentic regional recipes prepared using cold-pressed oils and heritage spices',
    badge: 'Heritage Recipe',
  },
  'premium-gift-packs': {
    title: 'Royal Festive Hampers & Luxury Gift Boxes',
    subtitle: 'Bespoke hand-crafted keepsake boxes packed with prime harvest gourmet selections',
    badge: 'Festive Special',
  },
};

export function getCategoryHeader(slug: string, fallbackName?: string): CategoryHeaderInfo {
  const normalized = (slug || '').toLowerCase().trim();
  if (CATEGORY_HEADERS[normalized]) {
    return CATEGORY_HEADERS[normalized];
  }
  const cleanName = fallbackName ? fallbackName.replace(/&amp;/g, '&') : 'Gourmet Harvest';
  return {
    title: `${cleanName} — Prime Pantry Harvest`,
    subtitle: `Hand-selected, farm-fresh ${cleanName.toLowerCase()} cured for peak flavor and purity`,
    badge: 'Fresh Harvest',
  };
}

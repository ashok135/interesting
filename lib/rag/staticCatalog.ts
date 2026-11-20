export interface StaticProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  regular_price: string;
  category: string;
  categories: string[];
  image: string;
  description: string;
  stock_status: string;
  featured: boolean;
  rating: string;
  total_sales: number;
}

export const STATIC_PRODUCTS: StaticProduct[] = [
  {
    "id": 59,
    "name": "Artisanal Wooden Keepsake Luxury Hamper",
    "slug": "artisanal-wooden-keepsake-luxury-hamper",
    "price": "1800",
    "regular_price": "2299",
    "category": "Artisanal Keepsake Luxury Hamper",
    "categories": [
      "Artisanal Keepsake Luxury Hamper",
      "Best Sellers",
      "Premium Gift Packs"
    ],
    "image": "https://intersting.duckdns.org/wp-content/uploads/2026/11/hamper-casket-1.jpg",
    "description": "Carved Teak Finish Chest • Gourmet Pantry Deluxe",
    "stock_status": "instock",
    "featured": true,
    "rating": "0.00",
    "total_sales": 0
  },
  {
    "id": 58,
    "name": "Festive Gourmet Grand Celebration Box",
    "slug": "festive-gourmet-grand-celebration-box",
    "price": "1199",
    "regular_price": "1499",
    "category": "Festive Gourmet Grand Box",
    "categories": [
      "Festive Gourmet Grand Box",
      "Premium Gift Packs"
    ],
    "image": "https://intersting.duckdns.org/wp-content/uploads/2026/11/hamper-gold.jpg",
    "description": "6-Compartment Gold Embossed Gift Box",
    "stock_status": "instock",
    "featured": true,
    "rating": "0.00",
    "total_sales": 0
  },
  {
    "id": 57,
    "name": "The Sovereign 4-Jar Brass & Velvet Casket",
    "slug": "the-sovereign-4-jar-brass-velvet-casket",
    "price": "1499",
    "regular_price": "1899",
    "category": "Premium Gift Packs",
    "categories": [
      "Premium Gift Packs",
      "Royal Brass & Velvet Casket"
    ],
    "image": "https://intersting.duckdns.org/wp-content/uploads/2026/11/hamper-casket-1.jpg",
    "description": "4 x 150g Glass Jars • Velvet Lined Keepsake Box",
    "stock_status": "instock",
    "featured": true,
    "rating": "0.00",
    "total_sales": 0
  },
  {
    "id": 55,
    "name": "Jaggery & Crushed Nut Artisanal Chikki",
    "slug": "jaggery-crushed-nut-artisanal-chikki",
    "price": "229",
    "regular_price": "279",
    "category": "Artisanal Chikki",
    "categories": [
      "Artisanal Chikki",
      "Traditional Snacks"
    ],
    "image": "https://intersting.duckdns.org/wp-content/uploads/2026/09/artisanal-nut-chikki.webp",
    "description": "250g Box • Crunchy Kolhapuri Jaggery",
    "stock_status": "instock",
    "featured": true,
    "rating": "0.00",
    "total_sales": 0
  },
  {
    "id": 54,
    "name": "Royal Gond & Dry Fruit Nutri-Laddu",
    "slug": "royal-gond-dry-fruit-nutri-laddu",
    "price": "499",
    "regular_price": "589",
    "category": "Best Sellers",
    "categories": [
      "Best Sellers",
      "Dry Fruit Laddu",
      "Traditional Snacks"
    ],
    "image": "https://intersting.duckdns.org/wp-content/uploads/2026/09/royal-gond-laddu.webp",
    "description": "350g Tin • No Refined Sugar",
    "stock_status": "instock",
    "featured": true,
    "rating": "0.00",
    "total_sales": 0
  },
  {
    "id": 53,
    "name": "Pure Shahi Kaju Katli (A2 Desi Ghee)",
    "slug": "pure-shahi-kaju-katli-desi-ghee",
    "price": "549",
    "regular_price": "649",
    "category": "Best Sellers",
    "categories": [
      "Best Sellers",
      "Pure Desi Ghee Kaju Katli",
      "Traditional Snacks"
    ],
    "image": "https://intersting.duckdns.org/wp-content/uploads/2026/11/trad-kajukatli-1.jpg",
    "description": "400g Royal Box • Melt-in-Mouth Cashew Diamond",
    "stock_status": "instock",
    "featured": true,
    "rating": "0.00",
    "total_sales": 0
  },
  {
    "id": 51,
    "name": "Energy Crunch Pre-Workout Trail",
    "slug": "energy-crunch-pre-workout-trail",
    "price": "389",
    "regular_price": "459",
    "category": "Trail Mix",
    "categories": [
      "Trail Mix",
      "Workout Protein Trail"
    ],
    "image": "https://intersting.duckdns.org/wp-content/uploads/2026/09/energy-crunch-trail.webp",
    "description": "250g Pouch • High Plant Protein",
    "stock_status": "instock",
    "featured": true,
    "rating": "0.00",
    "total_sales": 0
  },
  {
    "id": 50,
    "name": "Antioxidant Wild Berry & Nut Blend",
    "slug": "antioxidant-wild-berry-nut-blend",
    "price": "419",
    "regular_price": "489",
    "category": "Trail Mix",
    "categories": [
      "Trail Mix",
      "Wild Berry Delight"
    ],
    "image": "https://intersting.duckdns.org/wp-content/uploads/2026/11/dryfruit-berries.jpg",
    "description": "250g Jar • Blueberries, Cranberries &amp; Cashews",
    "stock_status": "instock",
    "featured": true,
    "rating": "0.00",
    "total_sales": 0
  },
  {
    "id": 49,
    "name": "Gourmet Omega 3 Vitality Trail Mix",
    "slug": "gourmet-omega-3-vitality-trail-mix",
    "price": "399",
    "regular_price": "469",
    "category": "Omega Booster Mix",
    "categories": [
      "Omega Booster Mix",
      "Trail Mix"
    ],
    "image": "https://intersting.duckdns.org/wp-content/uploads/2026/09/omega3-vitality-trail.webp",
    "description": "250g Jar • Walnuts, Chia, Flax &amp; Almonds",
    "stock_status": "instock",
    "featured": true,
    "rating": "0.00",
    "total_sales": 0
  },
  {
    "id": 48,
    "name": "Lightly Salted California Pistachios",
    "slug": "lightly-salted-california-pistachios",
    "price": "499",
    "regular_price": "579",
    "category": "Flavoured Nuts",
    "categories": [
      "Flavoured Nuts",
      "Lightly Salted Pistachios"
    ],
    "image": "https://intersting.duckdns.org/wp-content/uploads/2026/09/california-pistachios.webp",
    "description": "250g Pouch • Jumbo Naturally Opened",
    "stock_status": "instock",
    "featured": true,
    "rating": "0.00",
    "total_sales": 0
  },
  {
    "id": 47,
    "name": "Hickory Smoked Barbeque Almonds",
    "slug": "hickory-smoked-barbeque-almonds",
    "price": "459",
    "regular_price": "529",
    "category": "Flavoured Nuts",
    "categories": [
      "Flavoured Nuts",
      "Smoked Barbeque Almonds"
    ],
    "image": "https://intersting.duckdns.org/wp-content/uploads/2026/11/nuts-almonds.jpg",
    "description": "250g Tin • Slow Hickory Smoked",
    "stock_status": "instock",
    "featured": true,
    "rating": "0.00",
    "total_sales": 0
  },
  {
    "id": 46,
    "name": "Fiery Peri Peri Wood-Fired Cashews",
    "slug": "fiery-peri-peri-wood-fired-cashews",
    "price": "489",
    "regular_price": "589",
    "category": "Flavoured Nuts",
    "categories": [
      "Flavoured Nuts",
      "Peri Peri Kaju"
    ],
    "image": "https://intersting.duckdns.org/wp-content/uploads/2026/11/nuts-cashews-1.jpg",
    "description": "250g Tin • W180 Cashews with Spicy Peri Peri",
    "stock_status": "instock",
    "featured": true,
    "rating": "0.00",
    "total_sales": 0
  },
  {
    "id": 45,
    "name": "Crispy Peri Peri Roasted Makhana",
    "slug": "crispy-peri-peri-roasted-makhana",
    "price": "209",
    "regular_price": "259",
    "category": "Roasted Snacks",
    "categories": [
      "Roasted Snacks",
      "Spiced Makhana"
    ],
    "image": "https://intersting.duckdns.org/wp-content/uploads/2026/11/makhana-roasted.jpg",
    "description": "100g Jar • Spicy Birdseye Chilli",
    "stock_status": "instock",
    "featured": true,
    "rating": "0.00",
    "total_sales": 0
  },
  {
    "id": 44,
    "name": "Tellicherry Black Pepper Roasted Chana",
    "slug": "tellicherry-black-pepper-roasted-chana",
    "price": "139",
    "regular_price": "169",
    "category": "Roasted Snacks",
    "categories": [
      "Roasted Snacks",
      "Wood-Fired Chana"
    ],
    "image": "https://intersting.duckdns.org/wp-content/uploads/2026/11/roasted-chana-1.jpg",
    "description": "200g Pouch • High Protein Snack",
    "stock_status": "instock",
    "featured": true,
    "rating": "0.00",
    "total_sales": 0
  },
  {
    "id": 42,
    "name": "Himalayan Pink Salt Popped Makhana",
    "slug": "himalayan-pink-salt-popped-makhana",
    "price": "199",
    "regular_price": "249",
    "category": "Roasted Snacks",
    "categories": [
      "Roasted Snacks",
      "Spiced Makhana"
    ],
    "image": "https://intersting.duckdns.org/wp-content/uploads/2026/09/pink-salt-makhana.webp",
    "description": "100g Jar • Jumbo Lotus Seeds",
    "stock_status": "instock",
    "featured": true,
    "rating": "0.00",
    "total_sales": 0
  },
  {
    "id": 41,
    "name": "Spiced Foxtail Millet Munch",
    "slug": "spiced-foxtail-millet-munch",
    "price": "169",
    "regular_price": "199",
    "category": "Foxtail Munchies",
    "categories": [
      "Foxtail Munchies",
      "Millets"
    ],
    "image": "https://intersting.duckdns.org/wp-content/uploads/2026/11/roasted-chana-1.jpg",
    "description": "140g Pouch • Chatpata Masala Flavour",
    "stock_status": "instock",
    "featured": true,
    "rating": "0.00",
    "total_sales": 0
  },
  {
    "id": 39,
    "name": "Tangy Cheese Roasted Jowar Puffs",
    "slug": "tangy-cheese-roasted-jowar-puffs",
    "price": "149",
    "regular_price": "189",
    "category": "Jowar Puffs",
    "categories": [
      "Jowar Puffs",
      "Millets"
    ],
    "image": "https://intersting.duckdns.org/wp-content/uploads/2026/11/roasted-chana-1.jpg",
    "description": "120g Pouch • High Fibre Sorghum",
    "stock_status": "instock",
    "featured": true,
    "rating": "0.00",
    "total_sales": 0
  },
  {
    "id": 37,
    "name": "Slow-Baked Ragi & Herb Crisps",
    "slug": "slow-baked-ragi-herb-crisps",
    "price": "179",
    "regular_price": "219",
    "category": "Millets",
    "categories": [
      "Millets",
      "Ragi Crisps"
    ],
    "image": "https://intersting.duckdns.org/wp-content/uploads/2026/11/roasted-chana-1.jpg",
    "description": "150g Pouch • 100% Baked Zero Palm Oil",
    "stock_status": "instock",
    "featured": true,
    "rating": "0.00",
    "total_sales": 0
  },
  {
    "id": 35,
    "name": "Long Green Seedless Afghan Raisins",
    "slug": "long-green-seedless-afghan-raisins",
    "price": "219",
    "regular_price": "269",
    "category": "Best Sellers",
    "categories": [
      "Best Sellers",
      "Dry Fruits",
      "Green Raisins (Kishmish)"
    ],
    "image": "https://intersting.duckdns.org/wp-content/uploads/2026/11/dryfruit-raisins-1.jpg",
    "description": "250g Pouch • Naturally Sweet",
    "stock_status": "instock",
    "featured": true,
    "rating": "0.00",
    "total_sales": 0
  },
  {
    "id": 33,
    "name": "Premium Arabian Medjool King Dates",
    "slug": "premium-arabian-medjool-king-dates",
    "price": "449",
    "regular_price": "529",
    "category": "Dry Fruits",
    "categories": [
      "Dry Fruits",
      "Medjool Dates"
    ],
    "image": "https://intersting.duckdns.org/wp-content/uploads/2026/11/dryfruit-dates-1.jpg",
    "description": "300g Luxury Box • Soft &amp; Juicy",
    "stock_status": "instock",
    "featured": true,
    "rating": "0.00",
    "total_sales": 0
  },
  {
    "id": 31,
    "name": "Jumbo Royal Afghan Anjeer (Figs)",
    "slug": "jumbo-royal-afghan-anjeer-figs",
    "price": "599",
    "regular_price": "699",
    "category": "Afghan Figs (Anjeer)",
    "categories": [
      "Afghan Figs (Anjeer)",
      "Dry Fruits"
    ],
    "image": "https://intersting.duckdns.org/wp-content/uploads/2026/11/dryfruit-anjeer.jpg",
    "description": "250g Ring Pack • Naturally Sun-Dried",
    "stock_status": "instock",
    "featured": true,
    "rating": "0.00",
    "total_sales": 0
  },
  {
    "id": 30,
    "name": "5-in-1 Roasted Super Omega Seed Mix",
    "slug": "5-in-1-roasted-super-omega-seed-mix",
    "price": "329",
    "regular_price": "389",
    "category": "Roasted Seed Mix",
    "categories": [
      "Roasted Seed Mix",
      "Seeds"
    ],
    "image": "https://intersting.duckdns.org/wp-content/uploads/2026/11/seeds-mix-1.jpg",
    "description": "250g Jar • Chia, Flax, Pumpkin, Sesame, Sunflower",
    "stock_status": "instock",
    "featured": true,
    "rating": "0.00",
    "total_sales": 0
  },
  {
    "id": 28,
    "name": "AAA Grade Himalayan Pumpkin Seeds",
    "slug": "aaa-grade-himalayan-pumpkin-seeds",
    "price": "299",
    "regular_price": "349",
    "category": "Pumpkin Seeds",
    "categories": [
      "Pumpkin Seeds",
      "Seeds"
    ],
    "image": "https://intersting.duckdns.org/wp-content/uploads/2026/11/seeds-pumpkin-1.jpg",
    "description": "200g Pouch • Lightly Salted Green Kernels",
    "stock_status": "instock",
    "featured": true,
    "rating": "0.00",
    "total_sales": 0
  },
  {
    "id": 26,
    "name": "Organic Raw Black Chia Seeds",
    "slug": "organic-raw-black-chia-seeds",
    "price": "249",
    "regular_price": "299",
    "category": "Chia Seeds",
    "categories": [
      "Chia Seeds",
      "Seeds"
    ],
    "image": "https://intersting.duckdns.org/wp-content/uploads/2026/11/seeds-chia-1.jpg",
    "description": "250g Pouch • High Fibre &amp; Omega-3",
    "stock_status": "instock",
    "featured": true,
    "rating": "0.00",
    "total_sales": 0
  },
  {
    "id": 24,
    "name": "Kashmiri Snow-White Walnut Kernels",
    "slug": "kashmiri-snow-white-walnut-kernels",
    "price": "549",
    "regular_price": "649",
    "category": "Nuts",
    "categories": [
      "Nuts",
      "Walnuts (Akhrot)"
    ],
    "image": "https://intersting.duckdns.org/wp-content/uploads/2026/11/nuts-walnuts-1.jpg",
    "description": "200g Tin • Extra Light Halves",
    "stock_status": "instock",
    "featured": true,
    "rating": "0.00",
    "total_sales": 0
  },
  {
    "id": 22,
    "name": "California Nonpareil Supreme Almonds",
    "slug": "california-nonpareil-supreme-almonds",
    "price": "429",
    "regular_price": "499",
    "category": "Almonds (Badam)",
    "categories": [
      "Almonds (Badam)",
      "Nuts"
    ],
    "image": "https://intersting.duckdns.org/wp-content/uploads/2026/11/nuts-almonds.jpg",
    "description": "250g Jar • 100% Raw Supreme Grade",
    "stock_status": "instock",
    "featured": true,
    "rating": "5.00",
    "total_sales": 0
  },
  {
    "id": 17,
    "name": "The Sovereign Cashew Reserve",
    "slug": "the-sovereign-cashew-reserve",
    "price": "1499",
    "regular_price": "1499",
    "category": "Premium Gift Packs",
    "categories": [
      "Premium Gift Packs"
    ],
    "image": "https://intersting.duckdns.org/wp-content/uploads/2026/11/nuts-cashews-1.jpg",
    "description": "Direct Harvest W180 King Grade . Slow Wood-Fired",
    "stock_status": "instock",
    "featured": true,
    "rating": "5.00",
    "total_sales": 0
  },
  {
    "id": 16,
    "name": "Tellicherry Pepper Roasted Kaju",
    "slug": "tellicherry-pepper-roasted-kaju",
    "price": "560",
    "regular_price": "560",
    "category": "Flavoured Nuts",
    "categories": [
      "Flavoured Nuts"
    ],
    "image": "https://intersting.duckdns.org/wp-content/uploads/2026/11/nuts-cashews-1.jpg",
    "description": "Tellicherry Black Pepper . 250g Jar",
    "stock_status": "instock",
    "featured": false,
    "rating": "0.00",
    "total_sales": 0
  },
  {
    "id": 15,
    "name": "W240 Lightly Salted Crispy Cashews",
    "slug": "w240-lightly-salted-crispy-cashews",
    "price": "480",
    "regular_price": "480",
    "category": "Roasted Snacks",
    "categories": [
      "Roasted Snacks"
    ],
    "image": "https://intersting.duckdns.org/wp-content/uploads/2026/11/nuts-cashews-1.jpg",
    "description": "Himalayan Rock Salt . 500g Value Pack",
    "stock_status": "instock",
    "featured": false,
    "rating": "0.00",
    "total_sales": 0
  },
  {
    "id": 14,
    "name": "Kashmiri Kesar & Honey Glazed Kaju",
    "slug": "kashmiri-kesar-honey-glazed-kaju",
    "price": "620",
    "regular_price": "620",
    "category": "Flavoured Nuts",
    "categories": [
      "Flavoured Nuts"
    ],
    "image": "https://intersting.duckdns.org/wp-content/uploads/2026/11/nuts-cashews-1.jpg",
    "description": "Pampore Valley Saffron . 200g Jar . Mongra Grade A1",
    "stock_status": "instock",
    "featured": true,
    "rating": "0.00",
    "total_sales": 0
  },
  {
    "id": 13,
    "name": "Royal Jumbo W180 King Cashews",
    "slug": "royal-jumbo-w180-king-cashews",
    "price": "449",
    "regular_price": "549",
    "category": "Cashews (Kaju)",
    "categories": [
      "Cashews (Kaju)",
      "Nuts"
    ],
    "image": "https://intersting.duckdns.org/wp-content/uploads/2026/11/nuts-cashews-1.jpg",
    "description": "250g Vacuum Tin • W180 Giant Grade",
    "stock_status": "instock",
    "featured": true,
    "rating": "5.00",
    "total_sales": 0
  }
];

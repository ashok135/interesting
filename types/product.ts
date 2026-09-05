export interface WooImage {
  id: number;
  src: string;
  alt: string;
  name: string;
}

export interface WooCategory {
  id: number;
  name: string;
  slug: string;
}

export interface WooAttribute {
  id: number;
  name: string;
  options: string[];
}

export interface WooDimensions {
  length: string;
  width: string;
  height: string;
}

export interface WooProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  purchasable: boolean;
  total_sales: number;
  virtual: boolean;
  downloadable: boolean;
  stock_quantity: number | null;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  manage_stock: boolean;
  weight: string;
  dimensions: WooDimensions;
  categories: WooCategory[];
  images: WooImage[];
  attributes: WooAttribute[];
  average_rating: string;
  rating_count: number;
  featured: boolean;
  date_created: string;
}

export interface WooProductCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
  image: WooImage | null;
  parent?: number;
  menu_order?: number;
}

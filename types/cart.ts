export interface CartItem {
  id: number;
  productId: number;
  name: string;
  slug: string;
  price: string;
  image: string;
  quantity: number;
  stockStatus: 'instock' | 'outofstock' | 'onbackorder';
}

export interface CartState {
  items: CartItem[];
  total: string;
  itemCount: number;
}

export interface OrderLineItem {
  product_id: number;
  quantity: number;
}

export interface OrderBilling {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

export interface OrderPayload {
  customer_id?: number;
  payment_method: string;
  payment_method_title: string;
  set_paid: boolean;
  billing: OrderBilling;
  shipping: OrderBilling;
  line_items: OrderLineItem[];
  coupon_code?: string;
  discount_amount?: number;
  customer_note?: string;
  shipping_lines?: Array<{
    method_id: string;
    method_title: string;
    total: string;
  }>;
  fee_lines?: Array<{
    name: string;
    total: string;
  }>;
}

export interface WooOrder {
  id: number;
  status: string;
  total: string;
  customer_id?: number;
  customer_note?: string;
  payment_method?: string;
  payment_method_title?: string;
  billing: OrderBilling;
  shipping?: Partial<OrderBilling>;
  line_items: Array<{
    id: number;
    name: string;
    product_id?: number;
    quantity: number;
    total: string;
    subtotal?: string;
    price?: number;
    image?: {
      id?: string | number;
      src: string;
    };
  }>;
  date_created: string;
}

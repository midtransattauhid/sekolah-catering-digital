
export interface Child {
  id: string;
  name: string;
  class_name: string;
}

export interface OrderLineItemData {
  order_id: string;
  child_id: string | null;
  child_name: string;
  child_class: string | null;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  delivery_date: string;
  order_date: string;
  notes: string | null;
}

export interface MidtransPaymentData {
  orderId: string;
  amount: number;
  customerDetails: {
    first_name: string;
    email: string;
    phone: string;
  };
  itemDetails: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
  }>;
}

declare global {
  interface Window {
    snap: any;
  }
}

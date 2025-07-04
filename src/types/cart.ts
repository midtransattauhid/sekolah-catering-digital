
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
  food_item_id: string; // Add this field to store the actual food_item_id
  date?: string; // Add optional date field
  child_id?: string; // Add optional child_id field
}


import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CartItem } from '@/types/cart';
import { Child, OrderLineItemData } from '@/types/checkout';

export const useOrderCreation = () => {
  const { user } = useAuth();

  const createOrder = async (
    cartItems: CartItem[],
    selectedChild: Child,
    notes: string
  ) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const orderNumber = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log('Creating main order...');

    // Create main order first
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        total_amount: totalAmount,
        status: 'pending',
        payment_status: 'pending',
        parent_notes: notes || null,
        child_name: selectedChild.name,
        child_class: selectedChild.class_name
      })
      .select()
      .single();

    if (orderError || !orderData) {
      console.error('Error creating order:', orderError);
      throw new Error('Gagal membuat pesanan utama');
    }

    console.log('Main order created:', orderData);

    // Create order line items
    const orderLineItems: OrderLineItemData[] = cartItems.map(item => {
      const deliveryDate = item.delivery_date || item.date || new Date().toISOString().split('T')[0];
      const orderDate = new Date().toISOString().split('T')[0];
      
      return {
        order_id: orderData.id,
        child_id: selectedChild.id || null,
        child_name: selectedChild.name,
        child_class: selectedChild.class_name || null,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        delivery_date: deliveryDate,
        order_date: orderDate,
        notes: null
      };
    });

    console.log('Order line items to insert:', orderLineItems);

    // Insert order line items
    const { error: lineItemsError } = await supabase
      .from('order_line_items')
      .insert(orderLineItems);

    if (lineItemsError) {
      console.error('Error creating order line items:', lineItemsError);
      
      // Clean up the main order if line items failed
      await supabase
        .from('orders')
        .delete()
        .eq('id', orderData.id);
        
      throw new Error('Gagal menyimpan detail pesanan');
    }

    console.log('Order line items created successfully');

    return orderData;
  };

  return { createOrder };
};

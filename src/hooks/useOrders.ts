
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { Order } from '@/types/order';

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            price,
            food_items (
              name,
              image_url
            )
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data pesanan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const retryPayment = async (order: Order) => {
    try {
      const customerDetails = {
        first_name: order.child_name,
        email: 'parent@example.com',
        phone: '08123456789',
      };

      const itemDetails = order.order_items.map(item => ({
        id: item.id,
        price: item.price,
        quantity: item.quantity,
        name: item.food_items.name,
      }));

      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        'create-payment',
        {
          body: {
            orderId: order.midtrans_order_id,
            amount: order.total_amount,
            customerDetails,
            itemDetails,
          },
        }
      );

      if (paymentError) throw paymentError;

      if (window.snap && paymentData.snap_token) {
        window.snap.pay(paymentData.snap_token, {
          onSuccess: () => {
            toast({
              title: "Pembayaran Berhasil!",
              description: "Pembayaran berhasil diproses.",
            });
            fetchOrders();
          },
          onPending: () => {
            toast({
              title: "Menunggu Pembayaran",
              description: "Pembayaran sedang diproses.",
            });
          },
          onError: () => {
            toast({
              title: "Pembayaran Gagal",
              description: "Terjadi kesalahan dalam pembayaran.",
              variant: "destructive",
            });
          }
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal memproses pembayaran",
        variant: "destructive",
      });
    }
  };

  return {
    orders,
    loading,
    retryPayment,
    fetchOrders
  };
};

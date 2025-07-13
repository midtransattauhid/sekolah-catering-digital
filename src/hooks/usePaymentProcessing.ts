
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { CartItem } from '@/types/cart';
import { Child, MidtransPaymentData } from '@/types/checkout';

export const usePaymentProcessing = () => {
  const { user } = useAuth();

  const processPayment = async (
    orderId: string,
    cartItems: CartItem[],
    selectedChild: Child,
    totalAmount: number,
    onSuccess?: () => void
  ) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Generate Midtrans order ID
    const midtransOrderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Update order with Midtrans order ID
    const { error: updateError } = await supabase
      .from('orders')
      .update({ midtrans_order_id: midtransOrderId })
      .eq('id', orderId);
      
    if (updateError) {
      console.error('Error updating order with midtrans_order_id:', updateError);
    }

    // Prepare payment data
    const paymentData: MidtransPaymentData = {
      orderId: midtransOrderId,
      amount: totalAmount,
      customerDetails: {
        first_name: user.user_metadata?.full_name || 'Customer',
        email: user.email || 'parent@example.com',
        phone: user.user_metadata?.phone || '08123456789',
      },
      itemDetails: cartItems.map(item => ({
        id: item.menu_item_id,
        price: item.price,
        quantity: item.quantity,
        name: `${item.name} - ${selectedChild.name}`,
      }))
    };

    console.log('Calling create-payment with:', paymentData);

    // Create payment via Supabase function
    const { data: paymentResponse, error: paymentError } = await supabase.functions.invoke(
      'create-payment',
      { body: paymentData }
    );

    if (paymentError) {
      console.error('Payment error:', paymentError);
      toast({
        title: "Error Pembayaran",
        description: paymentError.message || "Gagal membuat pembayaran",
        variant: "destructive",
      });
      return;
    }

    if (paymentResponse?.snap_token) {
      // Save snap_token to database
      await supabase
        .from('orders')
        .update({ snap_token: paymentResponse.snap_token })
        .eq('id', orderId);

      // Open Midtrans payment popup
      if (window.snap) {
        window.snap.pay(paymentResponse.snap_token, {
          onSuccess: () => {
            console.log('Payment successful');
            toast({
              title: "Pembayaran Berhasil!",
              description: "Pesanan Anda telah berhasil dibuat dan dibayar.",
            });
            onSuccess?.();
          },
          onPending: () => {
            console.log('Payment pending');
            toast({
              title: "Pembayaran Tertunda",
              description: "Pembayaran Anda sedang diproses.",
            });
            onSuccess?.();
          },
          onError: () => {
            console.log('Payment error');
            toast({
              title: "Pembayaran Gagal",
              description: "Terjadi kesalahan dalam pembayaran.",
              variant: "destructive",
            });
          },
          onClose: () => {
            console.log('Payment popup closed');
          }
        });
      } else {
        console.error('Midtrans Snap not loaded');
        toast({
          title: "Error",
          description: "Sistem pembayaran belum siap. Silakan refresh halaman.",
          variant: "destructive",
        });
      }
    } else {
      throw new Error('Token pembayaran tidak diterima');
    }
  };

  return { processPayment };
};

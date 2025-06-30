
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHash } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const notification = await req.json();
    console.log('Received Midtrans notification:', notification);

    const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY');
    if (!serverKey) {
      throw new Error('Midtrans server key not configured');
    }

    // Verify signature
    const signatureKey = notification.signature_key;
    const orderId = notification.order_id;
    const statusCode = notification.status_code;
    const grossAmount = notification.gross_amount;
    
    const mySignatureKey = createHash("sha512")
      .update(orderId + statusCode + grossAmount + serverKey)
      .toString();

    if (signatureKey !== mySignatureKey) {
      console.error('Invalid signature');
      return new Response('Invalid signature', { status: 400 });
    }

    // Map Midtrans status to our payment status
    let paymentStatus = 'pending';
    let orderStatus = 'pending';

    switch (notification.transaction_status) {
      case 'capture':
      case 'settlement':
        paymentStatus = 'paid';
        orderStatus = 'confirmed';
        break;
      case 'pending':
        paymentStatus = 'pending';
        orderStatus = 'pending';
        break;
      case 'cancel':
      case 'expire':
      case 'failure':
        paymentStatus = 'failed';
        orderStatus = 'cancelled';
        break;
    }

    // Update order in database
    const { error } = await supabase
      .from('orders')
      .update({
        payment_status: paymentStatus,
        status: orderStatus,
        midtrans_transaction_id: notification.transaction_id,
        updated_at: new Date().toISOString(),
      })
      .eq('midtrans_order_id', orderId);

    if (error) {
      console.error('Error updating order:', error);
      throw error;
    }

    console.log(`Order ${orderId} updated: payment_status=${paymentStatus}, status=${orderStatus}`);

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Internal server error', { status: 500 });
  }
});

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { CartItem } from '@/types/cart';

declare global {
  interface Window {
    snap: {
      pay: (token: string, options?: {
        onSuccess?: (result: any) => void;
        onPending?: (result: any) => void;
        onError?: (result: any) => void;
        onClose?: () => void;
      }) => void;
    };
  }
}

interface Child {
  id: string;
  name: string;
  class_name: string;
}

interface CartProps {
  items: CartItem[];
  onUpdateCart: (items: CartItem[]) => void;
}

const Cart = ({ items, onUpdateCart }: CartProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user && isOpen) {
      fetchChildren();
    }
  }, [user, isOpen]);

  useEffect(() => {
    // Load Midtrans Snap script
    const script = document.createElement('script');
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', 'SB-Mid-client-your-client-key-here');
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const fetchChildren = async () => {
    try {
      const { data, error } = await supabase
        .from('children')
        .select('id, name, class_name')
        .eq('parent_id', user?.id)
        .eq('is_active', true);

      if (error) throw error;
      setChildren(data || []);
    } catch (error) {
      console.error('Error fetching children:', error);
    }
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      onUpdateCart(items.filter(item => item.id !== itemId));
    } else {
      onUpdateCart(items.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const removeItem = (itemId: string) => {
    onUpdateCart(items.filter(item => item.id !== itemId));
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleCheckout = async () => {
    if (!selectedChildId) {
      toast({
        title: "Error",
        description: "Pilih anak untuk pesanan ini",
        variant: "destructive",
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Keranjang kosong",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const selectedChild = children.find(child => child.id === selectedChildId);
      const totalAmount = getTotalPrice();
      const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create order first
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id,
          child_id: selectedChildId,
          child_name: selectedChild?.name,
          child_class: selectedChild?.class_name,
          total_amount: totalAmount,
          midtrans_order_id: orderId,
          notes: notes || null,
          status: 'pending',
          payment_status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items using the correct food_item_id from the cart items
      const orderItems = items.map(item => ({
        order_id: order.id,
        food_item_id: item.food_item_id, // Use the food_item_id from cart item
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Prepare payment data
      const customerDetails = {
        first_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Customer',
        email: user?.email,
        phone: user?.user_metadata?.phone || '08123456789',
      };

      const itemDetails = items.map(item => ({
        id: item.id,
        price: item.price,
        quantity: item.quantity,
        name: item.name,
      }));

      // Create payment transaction
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        'create-payment',
        {
          body: {
            orderId,
            amount: totalAmount,
            customerDetails,
            itemDetails,
          },
        }
      );

      if (paymentError) throw paymentError;

      // Open Midtrans Snap
      if (window.snap && paymentData.snap_token) {
        window.snap.pay(paymentData.snap_token, {
          onSuccess: (result) => {
            console.log('Payment success:', result);
            toast({
              title: "Pembayaran Berhasil!",
              description: "Pesanan Anda telah dikonfirmasi dan sedang diproses.",
            });
            
            // Clear cart and close dialog
            onUpdateCart([]);
            setIsOpen(false);
            setSelectedChildId('');
            setNotes('');
          },
          onPending: (result) => {
            console.log('Payment pending:', result);
            toast({
              title: "Menunggu Pembayaran",
              description: "Pembayaran Anda sedang diproses. Mohon tunggu konfirmasi.",
            });
            
            // Clear cart and close dialog
            onUpdateCart([]);
            setIsOpen(false);
            setSelectedChildId('');
            setNotes('');
          },
          onError: (result) => {
            console.error('Payment error:', result);
            toast({
              title: "Pembayaran Gagal",
              description: "Terjadi kesalahan dalam proses pembayaran. Silakan coba lagi.",
              variant: "destructive",
            });
          },
          onClose: () => {
            console.log('Payment popup closed');
            toast({
              title: "Pembayaran Dibatalkan",
              description: "Anda membatalkan proses pembayaran.",
            });
          }
        });
      } else {
        throw new Error('Midtrans Snap not loaded or token not received');
      }
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal membuat pesanan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-4 right-4 rounded-full shadow-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 z-50"
        >
          <ShoppingCart className="h-5 w-5 mr-2" />
          {getTotalItems()} item • {formatPrice(getTotalPrice())}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keranjang Belanja</DialogTitle>
          <DialogDescription>
            Review pesanan Anda dan pilih anak untuk pengiriman
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cart Items */}
          <div className="space-y-3">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold">{item.name}</h4>
                      <p className="text-sm text-gray-600">{formatPrice(item.price)}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="mx-2 font-semibold w-8 text-center">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeItem(item.id)}
                        className="h-8 w-8 p-0 ml-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Child Selection */}
          <div className="space-y-2">
            <Label htmlFor="child">Pilih Anak</Label>
            <Select value={selectedChildId} onValueChange={setSelectedChildId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih anak untuk pesanan ini" />
              </SelectTrigger>
              <SelectContent>
                {children.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.name} - Kelas {child.class_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {children.length === 0 && (
              <p className="text-sm text-red-600">
                Tambahkan data anak terlebih dahulu di menu "Anak"
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan (Opsional)</Label>
            <Textarea
              id="notes"
              placeholder="Catatan khusus untuk pesanan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Total */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total Pembayaran:</span>
                <span className="text-orange-600">{formatPrice(getTotalPrice())}</span>
              </div>
            </CardContent>
          </Card>

          {/* Checkout Button */}
          <Button
            onClick={handleCheckout}
            disabled={loading || !selectedChildId || children.length === 0}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            size="lg"
          >
            {loading ? 'Memproses...' : 'Buat Pesanan'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Cart;


import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { CartItem } from '@/types/cart';
import { useChildren } from '@/hooks/useChildren';
import { useOrderCreation } from '@/hooks/useOrderCreation';
import { usePaymentProcessing } from '@/hooks/usePaymentProcessing';

export const useCartOperations = () => {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [notes, setNotes] = useState('');

  const { children, loading, fetchChildren } = useChildren();
  const { createOrder } = useOrderCreation();
  const { processPayment } = usePaymentProcessing();

  const handleCheckout = async (
    cartItems: CartItem[],
    onSuccess?: () => void
  ) => {
    if (!selectedChildId) {
      toast({
        title: "Error",
        description: "Silakan pilih anak terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "Error",
        description: "Keranjang belanja kosong",
        variant: "destructive",
      });
      return;
    }

    setIsCheckingOut(true);

    try {
      console.log('Starting checkout process...');
      console.log('Cart items:', cartItems);
      console.log('Selected child ID:', selectedChildId);
      
      const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Get selected child info
      const selectedChild = children.find(child => child.id === selectedChildId);
      console.log('Selected child:', selectedChild);
      
      if (!selectedChild) {
        throw new Error('Data anak yang dipilih tidak ditemukan');
      }

      // Create order
      const orderData = await createOrder(cartItems, selectedChild, notes);

      // Process payment
      await processPayment(
        orderData.id,
        cartItems,
        selectedChild,
        totalAmount,
        onSuccess
      );

      return orderData;
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal memproses checkout",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsCheckingOut(false);
    }
  };

  return {
    handleCheckout,
    isCheckingOut,
    children,
    selectedChildId,
    setSelectedChildId,
    notes,
    setNotes,
    loading,
    fetchChildren
  };
};

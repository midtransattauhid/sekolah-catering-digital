
import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { CartItem } from '@/types/cart';
import { useCartOperations } from '@/hooks/useCartOperations';
import CartItemList from '@/components/cart/CartItemList';
import CheckoutForm from '@/components/cart/CheckoutForm';
import OrderSummary from '@/components/cart/OrderSummary';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onRemoveItem: (itemId: string) => void;
  onCheckout: () => void;
  cartOperations: ReturnType<typeof useCartOperations>;
}

const Cart = ({ isOpen, onClose, cartItems, onRemoveItem, onCheckout, cartOperations }: CartProps) => {
  const {
    children,
    selectedChildId,
    setSelectedChildId,
    notes,
    setNotes,
    loading: childrenLoading,
    fetchChildren,
    handleCheckout,
    isCheckingOut
  } = cartOperations;

  useEffect(() => {
    if (isOpen) {
      fetchChildren();
    }
  }, [isOpen, fetchChildren]);

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      onRemoveItem(itemId);
    } else {
      console.log('Update quantity not implemented in this interface');
    }
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleCheckoutClick = async () => {
    console.log('Checkout clicked:', { 
      selectedChildId, 
      childrenLength: children.length, 
      cartItemsLength: cartItems.length,
      isCheckingOut
    });
    
    if (!selectedChildId || selectedChildId.trim() === '') {
      console.log('No child selected');
      return;
    }
    
    if (cartItems.length === 0) {
      console.log('Cart is empty');
      return;
    }

    try {
      await handleCheckout(cartItems, () => {
        onCheckout();
        onClose();
        setSelectedChildId('');
        setNotes('');
      });
    } catch (error) {
      console.error('Checkout error in Cart component:', error);
    }
  };

  if (cartItems.length === 0) {
    return null;
  }

  const canCheckout = Boolean(
    selectedChildId && 
    selectedChildId.trim() !== '' && 
    children.length > 0 && 
    cartItems.length > 0 &&
    !isCheckingOut &&
    !childrenLoading
  );

  console.log('Cart render state:', { 
    selectedChildId, 
    childrenLength: children.length, 
    canCheckout, 
    isCheckingOut,
    childrenLoading,
    cartItemsLength: cartItems.length
  });

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Keranjang Belanja</SheetTitle>
          <SheetDescription>
            Review pesanan Anda dan pilih anak untuk pengiriman
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          <CartItemList
            items={cartItems}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={onRemoveItem}
            formatPrice={formatPrice}
          />

          <CheckoutForm
            children={children}
            selectedChildId={selectedChildId}
            onChildSelect={setSelectedChildId}
            notes={notes}
            onNotesChange={setNotes}
          />

          <OrderSummary
            totalPrice={getTotalPrice()}
            formatPrice={formatPrice}
            onCheckout={handleCheckoutClick}
            loading={isCheckingOut}
            canCheckout={canCheckout}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default Cart;

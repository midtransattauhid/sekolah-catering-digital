
import { useState } from 'react';
import Menu from './Menu';
import Cart from '@/components/Cart';
import { CartItem } from '@/types/cart';

const Index = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const handleAddToCart = (item: CartItem) => {
    setCartItems(prev => {
      const existingItem = prev.find(cartItem => cartItem.id === item.id);
      
      if (existingItem) {
        return prev.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
            : cartItem
        );
      } else {
        return [...prev, item];
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Menu />
      <Cart items={cartItems} onUpdateCart={setCartItems} />
    </div>
  );
};

export default Index;

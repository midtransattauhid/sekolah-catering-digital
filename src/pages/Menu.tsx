
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'makanan' | 'minuman';
  image_url: string;
  is_available: boolean;
}

interface CartItem extends FoodItem {
  quantity: number;
}

const Menu = ({ onAddToCart }: { onAddToCart: (item: CartItem) => void }) => {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFoodItems();
  }, []);

  const fetchFoodItems = async () => {
    try {
      const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .eq('is_available', true)
        .order('category', { ascending: true });

      if (error) throw error;
      setFoodItems(data || []);
    } catch (error) {
      console.error('Error fetching food items:', error);
      toast({
        title: "Error",
        description: "Gagal memuat menu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: FoodItem) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
      const updatedCart = cart.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      );
      setCart(updatedCart);
    } else {
      const newCartItem = { ...item, quantity: 1 };
      setCart([...cart, newCartItem]);
    }

    onAddToCart({ ...item, quantity: 1 });
    toast({
      title: "Ditambahkan ke keranjang",
      description: `${item.name} berhasil ditambahkan`,
    });
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCart(cart.filter(item => item.id !== itemId));
    } else {
      setCart(cart.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const getQuantity = (itemId: string) => {
    const item = cart.find(cartItem => cartItem.id === itemId);
    return item ? item.quantity : 0;
  };

  const makananItems = foodItems.filter(item => item.category === 'makanan');
  const minumanItems = foodItems.filter(item => item.category === 'minuman');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const FoodCard = ({ item }: { item: FoodItem }) => {
    const quantity = getQuantity(item.id);
    
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="aspect-square overflow-hidden">
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{item.name}</CardTitle>
            <Badge variant="secondary" className="bg-gradient-to-r from-orange-100 to-red-100 text-orange-700">
              {formatPrice(item.price)}
            </Badge>
          </div>
          <CardDescription className="text-sm text-gray-600">
            {item.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {quantity > 0 ? (
            <div className="flex items-center justify-between">
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateQuantity(item.id, quantity - 1)}
                className="h-8 w-8 p-0"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="mx-3 font-semibold">{quantity}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateQuantity(item.id, quantity + 1)}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => addToCart(item)}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
          Menu Makanan & Minuman
        </h1>
        <p className="text-gray-600">Pilih makanan dan minuman favorit untuk anak Anda</p>
      </div>

      <Tabs defaultValue="semua" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="semua">Semua Menu</TabsTrigger>
          <TabsTrigger value="makanan">Makanan</TabsTrigger>
          <TabsTrigger value="minuman">Minuman</TabsTrigger>
        </TabsList>

        <TabsContent value="semua">
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-orange-600">Makanan</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {makananItems.map((item) => (
                  <FoodCard key={item.id} item={item} />
                ))}
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-blue-600">Minuman</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {minumanItems.map((item) => (
                  <FoodCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="makanan">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {makananItems.map((item) => (
              <FoodCard key={item.id} item={item} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="minuman">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {minumanItems.map((item) => (
              <FoodCard key={item.id} item={item} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {cart.length > 0 && (
        <div className="fixed bottom-4 right-4">
          <Button
            size="lg"
            className="rounded-full shadow-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            {cart.reduce((total, item) => total + item.quantity, 0)} item
          </Button>
        </div>
      )}
    </div>
  );
};

export default Menu;

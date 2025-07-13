
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Calendar as CalendarIcon, 
  User, 
  ShoppingCart, 
  Plus, 
  Minus,
  ArrowLeft,
  Clock
} from 'lucide-react';
import { format, isWeekend, addDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface Child {
  id: string;
  name: string;
  class_name: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_id: string;
  categories: {
    name: string;
  };
}

interface CartItem {
  id: string;
  child_id: string;
  child_name: string;
  child_class: string;
  date: string;
  menu_item: MenuItem;
  quantity: number;
}

const OrderFood = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    if (user) {
      fetchChildren();
      fetchMenuItems();
    } else {
      navigate('/auth');
    }
  }, [user, navigate]);

  const fetchChildren = async () => {
    try {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('user_id', user?.id)
        .order('name');

      if (error) throw error;
      setChildren(data || []);
    } catch (error) {
      console.error('Error fetching children:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data anak",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq('is_available', true)
        .order('name');

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast({
        title: "Error",
        description: "Gagal memuat menu",
        variant: "destructive",
      });
    }
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Disable past dates and weekends
    return date < today || isWeekend(date);
  };

  const addToCart = (menuItem: MenuItem) => {
    if (!selectedChild || !selectedDate) {
      toast({
        title: "Pilih anak dan tanggal",
        description: "Silakan pilih anak dan tanggal terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    const child = children.find(c => c.id === selectedChild);
    if (!child) return;

    const cartItemId = `${selectedChild}-${menuItem.id}-${format(selectedDate, 'yyyy-MM-dd')}`;
    const existingItem = cartItems.find(item => item.id === cartItemId);

    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.id === cartItemId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      const newCartItem: CartItem = {
        id: cartItemId,
        child_id: child.id,
        child_name: child.name,
        child_class: child.class_name,
        date: format(selectedDate, 'yyyy-MM-dd'),
        menu_item: menuItem,
        quantity: 1
      };
      setCartItems([...cartItems, newCartItem]);
    }

    toast({
      title: "Ditambahkan ke keranjang",
      description: `${menuItem.name} untuk ${child.name}`,
    });
  };

  const updateQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCartItems(cartItems.filter(item => item.id !== cartItemId));
    } else {
      setCartItems(cartItems.map(item =>
        item.id === cartItemId
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const removeFromCart = (cartItemId: string) => {
    setCartItems(cartItems.filter(item => item.id !== cartItemId));
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.menu_item.price * item.quantity), 0);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast({
        title: "Keranjang kosong",
        description: "Tambahkan menu terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    setIsCheckingOut(true);

    try {
      // Generate order number
      const orderNumber = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create main order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id,
          order_number: orderNumber,
          total_amount: getTotalPrice(),
          status: 'pending',
          payment_status: 'pending',
          parent_notes: notes || null,
        })
        .select()
        .single();

      if (orderError || !orderData) {
        throw new Error('Gagal membuat pesanan');
      }

      // Create order line items
      const orderLineItems = cartItems.map(item => ({
        order_id: orderData.id,
        child_id: item.child_id,
        child_name: item.child_name,
        child_class: item.child_class,
        menu_item_id: item.menu_item.id,
        quantity: item.quantity,
        unit_price: item.menu_item.price,
        delivery_date: item.date,
        order_date: format(new Date(), 'yyyy-MM-dd'),
      }));

      const { error: lineItemsError } = await supabase
        .from('order_line_items')
        .insert(orderLineItems);

      if (lineItemsError) {
        throw new Error('Gagal menyimpan detail pesanan');
      }

      toast({
        title: "Pesanan berhasil dibuat!",
        description: `Nomor pesanan: ${orderNumber}`,
      });

      // Clear cart and navigate to orders
      setCartItems([]);
      setNotes('');
      navigate('/orders');

    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal memproses pesanan",
        variant: "destructive",
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="py-12">
              <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Belum Ada Data Anak
              </h3>
              <p className="text-gray-600 mb-6">
                Tambahkan data anak terlebih dahulu untuk mulai memesan katering
              </p>
              <Button 
                onClick={() => navigate('/children')}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                Tambah Data Anak
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Pesan Katering</h1>
                <p className="text-sm text-gray-600">Pilih menu untuk anak-anak Anda</p>
              </div>
            </div>
            {cartItems.length > 0 && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                {cartItems.length} item
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Child Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2 text-orange-600" />
                  Pilih Anak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedChild} onValueChange={setSelectedChild}>
                  <SelectTrigger className="border-orange-200 focus:border-orange-500">
                    <SelectValue placeholder="Pilih anak untuk menu ini..." />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((child) => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.name} - Kelas {child.class_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Date Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2 text-orange-600" />
                  Pilih Tanggal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={isDateDisabled}
                  locale={idLocale}
                  className="rounded-md border w-full"
                />
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-400 rounded mr-2"></div>
                    <span>Sabtu & Minggu (Tutup)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-200 rounded mr-2"></div>
                    <span>Tersedia untuk dipesan</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Menu Items */}
            {selectedChild && selectedDate && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-orange-600" />
                    Menu {format(selectedDate, 'dd MMMM yyyy', { locale: idLocale })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {menuItems.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <img
                          src={item.image_url || '/placeholder.svg'}
                          alt={item.name}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">{item.name}</h3>
                              <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                              <Badge variant="outline" className="text-xs mt-1">
                                {item.categories?.name}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-orange-600">{formatPrice(item.price)}</p>
                            <Button
                              size="sm"
                              onClick={() => addToCart(item)}
                              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Tambah
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Cart */}
          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2 text-orange-600" />
                  Keranjang Belanja
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">Keranjang masih kosong</p>
                  </div>
                ) : (
                  <>
                    {/* Cart Items */}
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {cartItems.map((item) => (
                        <div key={item.id} className="border rounded-lg p-3 bg-gray-50">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{item.menu_item.name}</h4>
                              <p className="text-xs text-gray-600">
                                {item.child_name} - {format(new Date(item.date), 'dd MMM yyyy', { locale: idLocale })}
                              </p>
                              <p className="text-sm font-semibold text-orange-600">
                                {formatPrice(item.menu_item.price)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="h-7 w-7 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="font-semibold w-8 text-center text-sm">{item.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="h-7 w-7 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-600 hover:text-red-700 h-7 px-2"
                            >
                              Hapus
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <Label htmlFor="notes">Catatan (Opsional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Catatan khusus untuk pesanan..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="min-h-[60px]"
                      />
                    </div>

                    {/* Total */}
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center text-lg font-semibold mb-4">
                        <span>Total:</span>
                        <span className="text-orange-600">{formatPrice(getTotalPrice())}</span>
                      </div>
                      <Button
                        onClick={handleCheckout}
                        disabled={isCheckingOut}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                        size="lg"
                      >
                        {isCheckingOut ? 'Memproses...' : 'Buat Pesanan'}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderFood;

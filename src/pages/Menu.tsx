
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Minus, ShoppingCart, CalendarIcon, AlertTriangle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { format, isBefore, isToday } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CartItem } from '@/types/cart';

interface DailyMenu {
  id: string;
  date: string;
  food_item_id: string;
  price: number;
  is_available: boolean;
  max_quantity: number | null;
  current_quantity: number;
  food_items: {
    name: string;
    description: string;
    image_url: string;
    category: 'makanan' | 'minuman';
  };
}

interface OrderSchedule {
  date: string;
  is_blocked: boolean;
  cutoff_time: string;
  cutoff_date: string | null;
  max_orders: number | null;
  current_orders: number;
  notes: string | null;
}

const Menu = ({ onAddToCart }: { onAddToCart: (item: CartItem) => void }) => {
  const [dailyMenus, setDailyMenus] = useState<DailyMenu[]>([]);
  const [orderSchedules, setOrderSchedules] = useState<OrderSchedule[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    fetchOrderSchedules();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchDailyMenus();
    }
  }, [selectedDate]);

  const fetchOrderSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('order_schedules')
        .select('*')
        .gte('date', new Date().toISOString().split('T')[0]);

      if (error) throw error;
      setOrderSchedules(data || []);
    } catch (error) {
      console.error('Error fetching order schedules:', error);
    }
  };

  const fetchDailyMenus = async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('daily_menus')
        .select(`
          *,
          food_items (
            name,
            description,
            image_url,
            category
          )
        `)
        .eq('date', dateStr)
        .eq('is_available', true)
        .order('food_items(category)', { ascending: true });

      if (error) throw error;
      setDailyMenus(data || []);
    } catch (error) {
      console.error('Error fetching daily menus:', error);
      toast({
        title: "Error",
        description: "Gagal memuat menu harian",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isDateDisabled = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const schedule = orderSchedules.find(s => s.date === dateStr);
    
    // Disable if date is blocked
    if (schedule?.is_blocked) return true;
    
    // Disable if max orders reached
    if (schedule?.max_orders && schedule.current_orders >= schedule.max_orders) return true;
    
    // Check cutoff time
    if (schedule) {
      const cutoffDate = schedule.cutoff_date ? new Date(schedule.cutoff_date) : new Date(date);
      cutoffDate.setDate(cutoffDate.getDate() - 1); // H-1
      
      const [hours, minutes] = schedule.cutoff_time.split(':');
      cutoffDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      if (new Date() > cutoffDate) return true;
    } else {
      // Default: disable if it's past 15:00 on H-1
      const cutoffDate = new Date(date);
      cutoffDate.setDate(cutoffDate.getDate() - 1);
      cutoffDate.setHours(15, 0, 0, 0);
      
      if (new Date() > cutoffDate) return true;
    }
    
    // Disable past dates
    if (isBefore(date, new Date()) && !isToday(date)) return true;
    
    return false;
  };

  const getDateStatus = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const schedule = orderSchedules.find(s => s.date === dateStr);
    
    if (schedule?.is_blocked) {
      return { status: 'blocked', message: schedule.notes || 'Tanggal diblokir' };
    }
    
    if (schedule?.max_orders && schedule.current_orders >= schedule.max_orders) {
      return { status: 'full', message: 'Kuota penuh' };
    }
    
    return { status: 'available', message: 'Tersedia' };
  };

  const addToCart = (item: DailyMenu) => {
    // Check if date is still available
    if (isDateDisabled(selectedDate)) {
      toast({
        title: "Tanggal tidak tersedia",
        description: "Tanggal yang dipilih sudah tidak bisa dipesan",
        variant: "destructive",
      });
      return;
    }

    // Transform DailyMenu to CartItem
    const cartItem: CartItem = {
      id: item.id,
      name: item.food_items.name,
      price: item.price,
      quantity: 1,
      image_url: item.food_items.image_url
    };

    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
      const updatedCart = cart.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      );
      setCart(updatedCart);
    } else {
      setCart([...cart, cartItem]);
    }

    onAddToCart(cartItem);
    toast({
      title: "Ditambahkan ke keranjang",
      description: `${item.food_items.name} berhasil ditambahkan`,
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

  const makananItems = dailyMenus.filter(item => item.food_items.category === 'makanan');
  const minumanItems = dailyMenus.filter(item => item.food_items.category === 'minuman');

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

  const FoodCard = ({ item }: { item: DailyMenu }) => {
    const quantity = getQuantity(item.id);
    const dateDisabled = isDateDisabled(selectedDate);
    
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="aspect-square overflow-hidden">
          <img
            src={item.food_items.image_url}
            alt={item.food_items.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{item.food_items.name}</CardTitle>
            <Badge variant="secondary" className="bg-gradient-to-r from-orange-100 to-red-100 text-orange-700">
              {formatPrice(item.price)}
            </Badge>
          </div>
          <CardDescription className="text-sm text-gray-600">
            {item.food_items.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {dateDisabled ? (
            <div className="text-center py-2">
              <Badge variant="destructive" className="text-xs">
                Tidak tersedia
              </Badge>
            </div>
          ) : quantity > 0 ? (
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

  const selectedDateStatus = getDateStatus(selectedDate);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
          Menu Makanan & Minuman
        </h1>
        <p className="text-gray-600">Pilih tanggal dan makanan favorit untuk anak Anda</p>
      </div>

      {/* Date Picker */}
      <div className="flex justify-center mb-6">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[280px] justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, 'PPP', { locale: idLocale }) : <span>Pilih tanggal</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              disabled={isDateDisabled}
              initialFocus
              locale={idLocale}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Date Status */}
      <div className="flex justify-center mb-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Status untuk {format(selectedDate, 'dd MMMM yyyy', { locale: idLocale })}
              </p>
              <Badge 
                variant={selectedDateStatus.status === 'available' ? 'default' : 'destructive'}
                className={selectedDateStatus.status === 'available' ? 'bg-green-100 text-green-800' : ''}
              >
                {selectedDateStatus.message}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {dailyMenus.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <AlertTriangle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Belum Ada Menu</h3>
            <p className="text-gray-600 mb-4">
              Belum ada menu untuk tanggal {format(selectedDate, 'dd MMMM yyyy', { locale: idLocale })}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="semua" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="semua">Semua Menu</TabsTrigger>
            <TabsTrigger value="makanan">Makanan</TabsTrigger>
            <TabsTrigger value="minuman">Minuman</TabsTrigger>
          </TabsList>

          <TabsContent value="semua">
            <div className="space-y-8">
              {makananItems.length > 0 && (
                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-orange-600">Makanan</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {makananItems.map((item) => (
                      <FoodCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              )}
              
              {minumanItems.length > 0 && (
                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-blue-600">Minuman</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {minumanItems.map((item) => (
                      <FoodCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              )}
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
      )}

      {cart.length > 0 && !isDateDisabled(selectedDate) && (
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

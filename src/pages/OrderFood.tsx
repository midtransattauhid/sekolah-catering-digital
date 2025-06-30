
import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, User, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { format, isBefore, isToday, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface Child {
  id: string;
  name: string;
  class_name: string;
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
    category: string;
  };
}

const OrderFood = () => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [children, setChildren] = useState<Child[]>([]);
  const [orderSchedules, setOrderSchedules] = useState<OrderSchedule[]>([]);
  const [dailyMenus, setDailyMenus] = useState<DailyMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchChildren();
      fetchOrderSchedules();
    }
  }, [user]);

  useEffect(() => {
    if (selectedDate) {
      fetchDailyMenus(selectedDate);
    }
  }, [selectedDate]);

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
      toast({
        title: "Error",
        description: "Gagal memuat data anak",
        variant: "destructive",
      });
    }
  };

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
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyMenus = async (date: Date) => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
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
        .eq('is_available', true);

      if (error) throw error;
      setDailyMenus(data || []);
    } catch (error) {
      console.error('Error fetching daily menus:', error);
      toast({
        title: "Error",
        description: "Gagal memuat menu harian",
        variant: "destructive",
      });
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const selectedChild_data = children.find(c => c.id === selectedChild);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
          Pemesanan Katering
        </h1>
        <p className="text-gray-600">Pilih anak dan tanggal untuk memesan makanan</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Panel - Child Selection & Calendar */}
        <div className="space-y-6">
          {/* Child Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2 text-orange-600" />
                Pilih Anak
              </CardTitle>
            </CardHeader>
            <CardContent>
              {children.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-4">Belum ada data anak</p>
                  <Button 
                    onClick={() => window.location.href = '/children'}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  >
                    Tambah Data Anak
                  </Button>
                </div>
              ) : (
                <Select value={selectedChild} onValueChange={setSelectedChild}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih anak..." />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((child) => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.name} - Kelas {child.class_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          {/* Calendar */}
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
                className="rounded-md border"
              />
              
              {/* Legend */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm">
                  <div className="w-3 h-3 bg-red-200 rounded mr-2"></div>
                  <span>Tanggal diblokir/penuh</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-3 h-3 bg-orange-200 rounded mr-2"></div>
                  <span>Batas waktu terlewat</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-3 h-3 bg-green-200 rounded mr-2"></div>
                  <span>Tersedia untuk dipesan</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Info */}
          {selectedChild && selectedDate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informasi Pesanan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Anak:</strong> {selectedChild_data?.name} - Kelas {selectedChild_data?.class_name}</p>
                  <p><strong>Tanggal:</strong> {format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: idLocale })}</p>
                  <Badge className={getDateStatus(selectedDate).status === 'available' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                    {getDateStatus(selectedDate).message}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel - Menu Selection */}
        <div>
          {selectedDate && selectedChild ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-orange-600" />
                  Menu {format(selectedDate, 'dd MMMM yyyy', { locale: idLocale })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dailyMenus.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">Belum ada menu untuk tanggal ini</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dailyMenus.map((menu) => (
                      <div key={menu.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50">
                        <img
                          src={menu.food_items.image_url}
                          alt={menu.food_items.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium">{menu.food_items.name}</h3>
                          <p className="text-sm text-gray-600">{menu.food_items.description}</p>
                          <p className="font-semibold text-orange-600">{formatPrice(menu.price)}</p>
                          <Badge variant="outline" className="text-xs">
                            {menu.food_items.category}
                          </Badge>
                        </div>
                        <Button 
                          size="sm"
                          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                        >
                          Tambah
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <CalendarIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Pilih anak dan tanggal untuk melihat menu</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderFood;

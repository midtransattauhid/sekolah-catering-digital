
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  Users, 
  Calendar, 
  ChefHat, 
  Clock,
  CheckCircle,
  XCircle,
  Plus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface RecentOrder {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  child_count: number;
}

const Index = () => {
  const { user } = useAuth();
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [childrenCount, setChildrenCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch children count
      const { data: children } = await supabase
        .from('children')
        .select('id')
        .eq('user_id', user?.id);
      
      setChildrenCount(children?.length || 0);

      // Fetch recent orders
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total_amount,
          status,
          payment_status,
          created_at,
          order_line_items(child_id)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (orders) {
        const processedOrders = orders.map(order => ({
          ...order,
          child_count: new Set(order.order_line_items?.map(item => item.child_id) || []).size
        }));
        setRecentOrders(processedOrders);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 rounded-full">
                <ChefHat className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
              Katering Sekolah
              <span className="text-gradient bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent block">
                untuk Anak Anda
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Pesan makanan sehat dan bergizi untuk anak-anak Anda dengan mudah. 
              Pilih menu favorit, atur jadwal, dan nikmati kemudahan pembayaran online.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-3">
                  Mulai Pesan Sekarang
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="border-orange-200 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="bg-orange-100 p-3 rounded-full w-fit mx-auto mb-4">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle className="text-orange-700">Multi Anak</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Daftarkan beberapa anak dan pesan katering untuk semuanya dalam satu pesanan
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="bg-orange-100 p-3 rounded-full w-fit mx-auto mb-4">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle className="text-orange-700">Pilih Tanggal</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Pilih tanggal katering dengan mudah. Sistem otomatis melewatkan akhir pekan
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="bg-orange-100 p-3 rounded-full w-fit mx-auto mb-4">
                  <ShoppingCart className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle className="text-orange-700">Menu Beragam</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Pilih dari berbagai menu makanan dan minuman sehat untuk anak-anak
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Katering</h1>
              <p className="text-gray-600">Selamat datang kembali!</p>
            </div>
            <Link to="/auth">
              <Button 
                variant="outline" 
                onClick={() => supabase.auth.signOut()}
                className="text-gray-600 hover:text-gray-800"
              >
                Keluar
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Anak</p>
                  <p className="text-2xl font-bold text-gray-900">{childrenCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <ShoppingCart className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Pesanan</p>
                  <p className="text-2xl font-bold text-gray-900">{recentOrders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-orange-100 p-3 rounded-full">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Menunggu Bayar</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {recentOrders.filter(order => order.payment_status === 'pending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-full">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Sudah Dibayar</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {recentOrders.filter(order => order.payment_status === 'paid').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Link to={childrenCount > 0 ? "/" : "/children"}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {childrenCount > 0 ? 'Pesan Katering' : 'Tambah Data Anak'}
                    </h3>
                    <p className="text-gray-600">
                      {childrenCount > 0 
                        ? 'Mulai pesan katering untuk anak-anak Anda'
                        : 'Daftarkan anak-anak Anda terlebih dahulu'
                      }
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-full">
                    {childrenCount > 0 ? (
                      <ShoppingCart className="h-6 w-6 text-white" />
                    ) : (
                      <Plus className="h-6 w-6 text-white" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/orders">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Riwayat Pesanan</h3>
                    <p className="text-gray-600">Lihat semua pesanan dan status pembayaran</p>
                  </div>
                  <div className="bg-blue-500 p-3 rounded-full">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Orders */}
        {recentOrders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-orange-600" />
                Pesanan Terbaru
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <p className="font-medium text-gray-900">{order.order_number}</p>
                        <Badge variant="outline" className="text-xs">
                          {order.child_count} anak
                        </Badge>
                        <Badge 
                          variant={order.payment_status === 'paid' ? 'default' : 'secondary'}
                          className={order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}
                        >
                          {order.payment_status === 'paid' ? 'Sudah Dibayar' : 'Belum Dibayar'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatPrice(order.total_amount)}</p>
                      <Link to={`/orders/${order.id}`}>
                        <Button variant="outline" size="sm" className="mt-2">
                          Detail
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {childrenCount === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="bg-orange-100 p-4 rounded-full w-fit mx-auto mb-4">
                <Users className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Belum Ada Data Anak
              </h3>
              <p className="text-gray-600 mb-6">
                Tambahkan data anak terlebih dahulu untuk mulai memesan katering
              </p>
              <Link to="/children">
                <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Data Anak
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;


import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingBag, Clock, CheckCircle, XCircle, User } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface Order {
  id: string;
  child_name: string;
  child_class: string;
  total_amount: number;
  status: string;
  payment_status: string;
  notes: string | null;
  created_at: string;
  midtrans_order_id: string | null;
  order_items: {
    id: string;
    quantity: number;
    price: number;
    food_items: {
      name: string;
      image_url: string;
    };
  }[];
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            price,
            food_items (
              name,
              image_url
            )
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data pesanan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-orange-100 text-orange-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Menunggu';
      case 'confirmed':
        return 'Dikonfirmasi';
      case 'preparing':
        return 'Disiapkan';
      case 'ready':
        return 'Siap';
      case 'delivered':
        return 'Terkirim';
      case 'cancelled':
        return 'Dibatalkan';
      default:
        return status;
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Belum Bayar';
      case 'paid':
        return 'Lunas';
      case 'failed':
        return 'Gagal';
      case 'refunded':
        return 'Dikembalikan';
      default:
        return status;
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
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filterOrdersByStatus = (status: string) => {
    if (status === 'all') return orders;
    return orders.filter(order => order.status === status);
  };

  const retryPayment = async (order: Order) => {
    try {
      const customerDetails = {
        first_name: order.child_name,
        email: 'parent@example.com', // You might want to get this from user profile
        phone: '08123456789',
      };

      const itemDetails = order.order_items.map(item => ({
        id: item.id,
        price: item.price,
        quantity: item.quantity,
        name: item.food_items.name,
      }));

      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        'create-payment',
        {
          body: {
            orderId: order.midtrans_order_id,
            amount: order.total_amount,
            customerDetails,
            itemDetails,
          },
        }
      );

      if (paymentError) throw paymentError;

      if (window.snap && paymentData.snap_token) {
        window.snap.pay(paymentData.snap_token, {
          onSuccess: () => {
            toast({
              title: "Pembayaran Berhasil!",
              description: "Pembayaran berhasil diproses.",
            });
            fetchOrders(); // Refresh orders
          },
          onPending: () => {
            toast({
              title: "Menunggu Pembayaran",
              description: "Pembayaran sedang diproses.",
            });
          },
          onError: () => {
            toast({
              title: "Pembayaran Gagal",
              description: "Terjadi kesalahan dalam pembayaran.",
              variant: "destructive",
            });
          }
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal memproses pembayaran",
        variant: "destructive",
      });
    }
  };

  const OrderCard = ({ order }: { order: Order }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center">
              <User className="h-5 w-5 mr-2 text-orange-600" />
              {order.child_name}
            </CardTitle>
            <CardDescription>
              Kelas {order.child_class} • {formatDate(order.created_at)}
            </CardDescription>
          </div>
          <div className="text-right space-y-1">
            <Badge className={getStatusColor(order.status)}>
              {getStatusText(order.status)}
            </Badge>
            <Badge className={getPaymentStatusColor(order.payment_status)}>
              {getPaymentStatusText(order.payment_status)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Order Items */}
          <div className="space-y-2">
            {order.order_items.map((item) => (
              <div key={item.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                <img
                  src={item.food_items.image_url}
                  alt={item.food_items.name}
                  className="w-12 h-12 object-cover rounded"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.food_items.name}</p>
                  <p className="text-xs text-gray-600">
                    {item.quantity}x • {formatPrice(item.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="p-2 bg-blue-50 rounded">
              <p className="text-sm text-blue-800">
                <strong>Catatan:</strong> {order.notes}
              </p>
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="font-semibold">Total:</span>
            <span className="font-bold text-orange-600">
              {formatPrice(order.total_amount)}
            </span>
          </div>

          {/* Payment Button */}
          {order.payment_status === 'pending' && (
            <Button 
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              onClick={() => retryPayment(order)}
            >
              Bayar Sekarang
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

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
          Riwayat Pesanan
        </h1>
        <p className="text-gray-600">Pantau status pesanan makanan anak Anda</p>
      </div>

      {orders.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <ShoppingBag className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <CardTitle className="text-xl mb-2">Belum Ada Pesanan</CardTitle>
            <CardDescription className="mb-4">
              Mulai pesan makanan untuk anak Anda
            </CardDescription>
            <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
              Mulai Pesan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="all">Semua</TabsTrigger>
            <TabsTrigger value="pending">Menunggu</TabsTrigger>
            <TabsTrigger value="confirmed">Dikonfirmasi</TabsTrigger>
            <TabsTrigger value="preparing">Disiapkan</TabsTrigger>
            <TabsTrigger value="delivered">Selesai</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pending">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filterOrdersByStatus('pending').map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="confirmed">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filterOrdersByStatus('confirmed').map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="preparing">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filterOrdersByStatus('preparing').map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="delivered">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filterOrdersByStatus('delivered').map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Orders;


import { useOrders } from '@/hooks/useOrders';
import { OrderFilters } from '@/components/orders/OrderFilters';
import { EmptyOrdersState } from '@/components/orders/EmptyOrdersState';

const Orders = () => {
  const { orders, loading, retryPayment } = useOrders();

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
        <EmptyOrdersState />
      ) : (
        <OrderFilters orders={orders} onRetryPayment={retryPayment} />
      )}
    </div>
  );
};

export default Orders;

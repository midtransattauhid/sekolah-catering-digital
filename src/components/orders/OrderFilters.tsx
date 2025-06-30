
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Order } from '@/types/order';
import { OrderCard } from './OrderCard';
import { filterOrdersByStatus } from '@/utils/orderUtils';

interface OrderFiltersProps {
  orders: Order[];
  onRetryPayment: (order: Order) => void;
}

export const OrderFilters = ({ orders, onRetryPayment }: OrderFiltersProps) => {
  return (
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
            <OrderCard key={order.id} order={order} onRetryPayment={onRetryPayment} />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="pending">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filterOrdersByStatus(orders, 'pending').map((order) => (
            <OrderCard key={order.id} order={order} onRetryPayment={onRetryPayment} />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="confirmed">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filterOrdersByStatus(orders, 'confirmed').map((order) => (
            <OrderCard key={order.id} order={order} onRetryPayment={onRetryPayment} />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="preparing">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filterOrdersByStatus(orders, 'preparing').map((order) => (
            <OrderCard key={order.id} order={order} onRetryPayment={onRetryPayment} />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="delivered">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filterOrdersByStatus(orders, 'delivered').map((order) => (
            <OrderCard key={order.id} order={order} onRetryPayment={onRetryPayment} />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
};

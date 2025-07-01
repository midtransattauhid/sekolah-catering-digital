
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminStats } from '@/components/admin/AdminStats';
import { RecentOrders } from '@/components/admin/RecentOrders';
import { PopularItems } from '@/components/admin/PopularItems';

const AdminDashboard = () => {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
          Dashboard Admin
        </h1>
        <p className="text-gray-600">Panel kontrol untuk mengelola sistem catering</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Pesanan</TabsTrigger>
          <TabsTrigger value="analytics">Analitik</TabsTrigger>
          <TabsTrigger value="reports">Laporan</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AdminStats />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentOrders />
            <PopularItems />
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Manajemen Pesanan</CardTitle>
              <CardDescription>Kelola status dan detail pesanan</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Komponen manajemen pesanan akan ditampilkan di sini</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analitik Penjualan</CardTitle>
              <CardDescription>Grafik dan statistik penjualan</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Dashboard analitik akan ditampilkan di sini</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Laporan</CardTitle>
              <CardDescription>Export dan unduh laporan</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Fitur laporan akan ditampilkan di sini</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;

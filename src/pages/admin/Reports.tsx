
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Download, FileText, Calendar, TrendingUp, Users, DollarSign } from 'lucide-react';
import { formatPrice } from '@/utils/orderUtils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface SalesSummary {
  order_date: string;
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  completed_orders: number;
  cancelled_orders: number;
}

const Reports = () => {
  const [salesData, setSalesData] = useState<SalesSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    // Set default dates (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    setEndDate(format(today, 'yyyy-MM-dd'));
    setStartDate(format(thirtyDaysAgo, 'yyyy-MM-dd'));
    
    fetchSalesData();
  }, []);

  const fetchSalesData = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_summary')
        .select('*')
        .order('order_date', { ascending: false })
        .limit(30);

      if (error) throw error;
      setSalesData(data || []);
    } catch (error) {
      console.error('Error fetching sales data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data penjualan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (salesData.length === 0) return;

    const csvHeaders = [
      'Tanggal',
      'Total Pesanan',
      'Total Pendapatan',
      'Rata-rata Nilai Pesanan',
      'Pesanan Selesai',
      'Pesanan Dibatalkan'
    ];

    const csvData = salesData.map(row => [
      format(new Date(row.order_date), 'dd/MM/yyyy'),
      row.total_orders,
      row.total_revenue,
      row.avg_order_value,
      row.completed_orders,
      row.cancelled_orders
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `laporan-penjualan-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    toast({
      title: "Berhasil",
      description: "Laporan berhasil diunduh",
    });
  };

  const getTotalSummary = () => {
    return salesData.reduce(
      (acc, curr) => ({
        totalOrders: acc.totalOrders + curr.total_orders,
        totalRevenue: acc.totalRevenue + curr.total_revenue,
        completedOrders: acc.completedOrders + curr.completed_orders,
        cancelledOrders: acc.cancelledOrders + curr.cancelled_orders,
      }),
      { totalOrders: 0, totalRevenue: 0, completedOrders: 0, cancelledOrders: 0 }
    );
  };

  const summary = getTotalSummary();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
            Laporan Penjualan
          </h1>
          <p className="text-gray-600">Analisis dan laporan data penjualan</p>
        </div>
        
        <div className="flex space-x-4">
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Laporan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="report-type">Jenis Laporan</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Harian</SelectItem>
                  <SelectItem value="weekly">Mingguan</SelectItem>
                  <SelectItem value="monthly">Bulanan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="start-date">Tanggal Mulai</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="end-date">Tanggal Akhir</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            
            <div className="flex items-end">
              <Button onClick={fetchSalesData} className="w-full">
                Terapkan Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Semua pesanan dalam periode
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(summary.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Pendapatan kotor
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pesanan Selesai</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.completedOrders}</div>
            <p className="text-xs text-muted-foreground">
              {summary.totalOrders > 0 ? Math.round((summary.completedOrders / summary.totalOrders) * 100) : 0}% dari total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pesanan Dibatalkan</CardTitle>
            <Users className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.cancelledOrders}</div>
            <p className="text-xs text-muted-foreground">
              {summary.totalOrders > 0 ? Math.round((summary.cancelledOrders / summary.totalOrders) * 100) : 0}% dari total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Penjualan Harian</CardTitle>
          <CardDescription>Data penjualan per hari dalam periode yang dipilih</CardDescription>
        </CardHeader>
        <CardContent>
          {salesData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Tanggal</th>
                    <th className="text-left p-2">Total Pesanan</th>
                    <th className="text-left p-2">Pendapatan</th>
                    <th className="text-left p-2">Rata-rata Nilai</th>
                    <th className="text-left p-2">Selesai</th>
                    <th className="text-left p-2">Dibatalkan</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.map((row) => (
                    <tr key={row.order_date} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        {format(new Date(row.order_date), 'dd MMM yyyy', { locale: id })}
                      </td>
                      <td className="p-2 font-medium">{row.total_orders}</td>
                      <td className="p-2 text-green-600 font-medium">
                        {formatPrice(row.total_revenue)}
                      </td>
                      <td className="p-2">{formatPrice(row.avg_order_value)}</td>
                      <td className="p-2">
                        <Badge variant="default">{row.completed_orders}</Badge>
                      </td>
                      <td className="p-2">
                        <Badge variant="destructive">{row.cancelled_orders}</Badge>
                      </td>
                      <td className="p-2">
                        <Badge variant={row.completed_orders > row.cancelled_orders ? 'default' : 'secondary'}>
                          {row.completed_orders > row.cancelled_orders ? 'Baik' : 'Perlu Perhatian'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Tidak Ada Data</h3>
              <p className="text-gray-600">Belum ada data penjualan untuk periode yang dipilih</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;

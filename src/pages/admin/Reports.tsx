import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Download, FileText, Calendar, TrendingUp, Users, ShoppingBag, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface ReportData {
  totalRevenue: number;
  totalOrders: number;
  totalItems: number;
  averageOrderValue: number;
  orders: any[];
  popularItems: any[];
  dailySales: any[];
}

interface PopularItem {
  name: string;
  total_sold: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Reports = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    
    setStartDate(todayStr);
    setEndDate(todayStr);
    
    fetchReportData(reportType, todayStr, todayStr);
  }, [reportType]);

  const fetchReportData = async (type: string, start?: string, end?: string) => {
    try {
      setLoading(true);

      const startDateFilter = start || startDate;
      const endDateFilter = end || endDate;

      let fromDate: string, toDate: string;

      switch (type) {
        case 'daily':
          fromDate = startDateFilter;
          toDate = endDateFilter;
          break;
        case 'weekly':
          const startOfWeek = format(new Date(startDateFilter), 'yyyy-MM-dd', { weekStartsOn: 1 });
          const endOfWeek = format(new Date(startDateFilter), 'yyyy-MM-dd', { weekStartsOn: 1 });
          fromDate = startOfWeek;
          toDate = endOfWeek;
          break;
        case 'monthly':
          const startOfMonth = format(new Date(startDateFilter), 'yyyy-MM-01');
          const endOfMonth = format(new Date(startDateFilter), 'yyyy-MM-dd');
          fromDate = startOfMonth;
          toDate = endOfMonth;
          break;
        default:
          fromDate = startDateFilter;
          toDate = endDateFilter;
      }

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('order_date', fromDate)
        .lte('order_date', toDate)
        .neq('status', 'cancelled');

      if (ordersError) throw ordersError;

      const { data: popularItems, error: popularItemsError } = await supabase.rpc('get_popular_food_items', {
        start_date: fromDate,
        end_date: toDate,
      });

      if (popularItemsError) throw popularItemsError;

      const { data: dailySales, error: dailySalesError } = await supabase.rpc('get_daily_sales', {
        start_date: fromDate,
        end_date: toDate,
      });

      if (dailySalesError) throw dailySalesError;

      const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const totalOrders = orders?.length || 0;
      const totalItems = popularItems?.reduce((sum, item) => sum + (item.total_sold || 0), 0) || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      setReportData({
        totalRevenue,
        totalOrders,
        totalItems,
        averageOrderValue,
        orders: orders || [],
        popularItems: popularItems || [],
        dailySales: dailySales || [],
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data laporan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    if (!startDate || !endDate) {
      toast({
        title: "Error",
        description: "Mohon pilih tanggal mulai dan akhir",
        variant: "destructive",
      });
      return;
    }
    fetchReportData(reportType);
  };

  const exportToCSV = () => {
    if (!reportData || reportData.orders.length === 0) {
      toast({
        title: "Error",
        description: "Tidak ada data untuk diekspor",
        variant: "destructive",
      });
      return;
    }

    const headers = ['Tanggal', 'Nama Anak', 'Kelas', 'Total', 'Status'];
    const csvData = reportData.orders.map(order => [
      format(new Date(order.order_date), 'dd/MM/yyyy'),
      order.child_name,
      order.child_class,
      order.total_amount,
      order.status
    ]);

    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
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

  const printReport = () => {
    if (!reportData || (reportData.orders.length === 0 && reportData.dailySales.length === 0)) {
      toast({
        title: "Error",
        description: "Tidak ada data untuk dicetak",
        variant: "destructive",
      });
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan ${reportType === 'daily' ? 'Harian' : reportType === 'weekly' ? 'Mingguan' : 'Bulanan'} - ${format(new Date(), 'dd MMMM yyyy', { locale: id })}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            color: #333;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #f97316;
            padding-bottom: 20px;
          }
          .header h1 { 
            color: #f97316; 
            margin: 0 0 10px 0;
            font-size: 24px;
          }
          .header p { 
            margin: 5px 0; 
            color: #666;
          }
          .summary { 
            display: flex; 
            justify-content: space-around; 
            margin-bottom: 30px;
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
          }
          .summary-item { 
            text-align: center; 
          }
          .summary-item h3 { 
            margin: 0 0 5px 0; 
            font-size: 18px;
            color: #f97316;
          }
          .summary-item p { 
            margin: 0; 
            color: #666;
            font-size: 14px;
          }
          .section { 
            margin-bottom: 40px; 
          }
          .section h2 { 
            color: #f97316; 
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 12px 8px; 
            text-align: left;
          }
          th { 
            background-color: #f97316; 
            color: white;
            font-weight: bold;
          }
          tr:nth-child(even) { 
            background-color: #f8f9fa; 
          }
          .text-center { 
            text-align: center; 
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Laporan ${reportType === 'daily' ? 'Harian' : reportType === 'weekly' ? 'Mingguan' : 'Bulanan'}</h1>
          <p>Periode: ${startDate === endDate ? format(new Date(startDate), 'dd MMMM yyyy', { locale: id }) : `${format(new Date(startDate), 'dd MMMM yyyy', { locale: id })} - ${format(new Date(endDate), 'dd MMMM yyyy', { locale: id })}`}</p>
          <p>Dicetak pada: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: id })}</p>
        </div>

        <div class="summary">
          <div class="summary-item">
            <h3>${reportData?.totalOrders || 0}</h3>
            <p>Total Pesanan</p>
          </div>
          <div class="summary-item">
            <h3>${reportData ? formatPrice(reportData.totalRevenue) : 'Rp 0'}</h3>
            <p>Total Pendapatan</p>
          </div>
          <div class="summary-item">
            <h3>${reportData?.totalItems || 0}</h3>
            <p>Total Item</p>
          </div>
          <div class="summary-item">
            <h3>${reportData ? formatPrice(reportData.averageOrderValue) : 'Rp 0'}</h3>
            <p>Rata-rata Nilai Pesanan</p>
          </div>
        </div>

        ${reportData && reportData.orders.length > 0 ? `
          <div class="section">
            <h2>Detail Pesanan</h2>
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Tanggal</th>
                  <th>Nama Anak</th>
                  <th>Kelas</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.orders.map((order, index) => `
                  <tr>
                    <td class="text-center">${index + 1}</td>
                    <td>${format(new Date(order.order_date), 'dd/MM/yyyy', { locale: id })}</td>
                    <td>${order.child_name}</td>
                    <td>${order.child_class}</td>
                    <td>${formatPrice(order.total_amount)}</td>
                    <td>${getStatusLabel(order.status)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        ${reportData && reportData.popularItems.length > 0 ? `
          <div class="section">
            <h2>Menu Terpopuler</h2>
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Menu</th>
                  <th class="text-center">Jumlah Terjual</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.popularItems.map((item, index) => `
                  <tr>
                    <td class="text-center">${index + 1}</td>
                    <td>${item.name}</td>
                    <td class="text-center"><strong>${item.total_sold}</strong></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'confirmed':
        return 'Confirmed';
      case 'preparing':
        return 'Preparing';
      case 'delivered':
        return 'Delivered';
      default:
        return 'Unknown';
    }
  };

  const dailySalesData = reportData?.dailySales.map(item => ({
    date: format(new Date(item.sales_date), 'dd/MM/yyyy'),
    sales: item.total_sales,
  }));

  const popularItemsData = reportData?.popularItems.map(item => ({
    name: item.name,
    value: item.total_sold,
  }));

  return (
    <div className="max-w-7xl mx-auto p-3 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-1">
            Laporan & Analisis
          </h1>
          <p className="text-gray-600 text-sm">Analisis data penjualan dan performa bisnis</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-2">
          <Button onClick={printReport} variant="outline" size="sm" className="text-xs">
            <Printer className="h-3 w-3 mr-1" />
            Print
          </Button>
          <Button onClick={exportToCSV} variant="outline" size="sm" className="text-xs">
            <Download className="h-3 w-3 mr-1" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg">Filter Laporan</CardTitle>
          <CardDescription className="text-xs md:text-sm">Pilih tipe laporan dan rentang tanggal</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label htmlFor="report-type" className="text-xs md:text-sm">Tipe Laporan</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="text-xs md:text-sm h-8 md:h-10">
                  <SelectValue placeholder="Pilih tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily" className="text-xs md:text-sm">Harian</SelectItem>
                  <SelectItem value="weekly" className="text-xs md:text-sm">Mingguan</SelectItem>
                  <SelectItem value="monthly" className="text-xs md:text-sm">Bulanan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="start-date" className="text-xs md:text-sm">Tanggal Mulai</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs md:text-sm h-8 md:h-10"
              />
            </div>
            
            <div>
              <Label htmlFor="end-date" className="text-xs md:text-sm">Tanggal Akhir</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs md:text-sm h-8 md:h-10"
              />
            </div>
            
            <div className="flex items-end">
              <Button onClick={handleFilter} className="w-full text-xs md:text-sm h-8 md:h-10">
                <Calendar className="h-3 w-3 mr-1" />
                Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      )}

      {reportData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2">
                <CardTitle className="text-xs md:text-sm font-medium">Total Pesanan</CardTitle>
                <ShoppingBag className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-lg md:text-2xl font-bold">{reportData.totalOrders}</div>
                <p className="text-xs text-muted-foreground">Pesanan</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2">
                <CardTitle className="text-xs md:text-sm font-medium">Pendapatan</CardTitle>
                <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-sm md:text-2xl font-bold">{formatPrice(reportData.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">Total</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2">
                <CardTitle className="text-xs md:text-sm font-medium">Total Item</CardTitle>
                <FileText className="h-3 w-3 md:h-4 md:w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-lg md:text-2xl font-bold">{reportData.totalItems}</div>
                <p className="text-xs text-muted-foreground">Item terjual</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2">
                <CardTitle className="text-xs md:text-sm font-medium">Rata-rata Nilai</CardTitle>
                <Users className="h-3 w-3 md:h-4 md:w-4 text-violet-600" />
              </CardHeader>
              <CardContent>
                <div className="text-sm md:text-2xl font-bold">{formatPrice(reportData.averageOrderValue)}</div>
                <p className="text-xs text-muted-foreground">Per pesanan</p>
              </CardContent>
            </Card>
          </div>

          {/* Daily Sales Chart */}
          {reportData.dailySales.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-xl">Grafik Penjualan Harian</CardTitle>
                <CardDescription className="text-xs md:text-sm">Total penjualan setiap hari</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailySalesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => formatPrice(value as number)} />
                    <Tooltip formatter={(value) => formatPrice(value as number)} />
                    <Legend />
                    <Bar dataKey="sales" fill="#f97316" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Popular Items Chart */}
          {reportData.popularItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-xl">Menu Terpopuler</CardTitle>
                <CardDescription className="text-xs md:text-sm">Item yang paling banyak dipesan</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={popularItemsData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      label
                    >
                      {popularItemsData?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => value + ' items'} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Order Details Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-xl">Detail Pesanan</CardTitle>
              <CardDescription className="text-xs md:text-sm">Informasi lengkap setiap pesanan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs md:text-sm">Tanggal</TableHead>
                      <TableHead className="text-xs md:text-sm">Nama Anak</TableHead>
                      <TableHead className="text-xs md:text-sm">Kelas</TableHead>
                      <TableHead className="text-xs md:text-sm text-right">Total</TableHead>
                      <TableHead className="text-xs md:text-sm">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.orders.map(order => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium text-xs md:text-sm">{format(new Date(order.order_date), 'dd/MM/yyyy')}</TableCell>
                        <TableCell className="text-xs md:text-sm">{order.child_name}</TableCell>
                        <TableCell className="text-xs md:text-sm">Kelas {order.child_class}</TableCell>
                        <TableCell className="text-xs md:text-sm text-right">{formatPrice(order.total_amount)}</TableCell>
                        <TableCell className="text-xs md:text-sm">{getStatusLabel(order.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Reports;

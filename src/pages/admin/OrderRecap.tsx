
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Download, FileText, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface OrderRecapItem {
  order_date: string;
  child_name: string;
  child_class: string;
  food_name: string;
  quantity: number;
  price: number;
  total_amount: number;
  status: string;
}

const OrderRecap = () => {
  const [recapData, setRecapData] = useState<OrderRecapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    // Set default dates (today)
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    
    setStartDate(todayStr);
    setEndDate(todayStr);
    
    fetchRecapData(todayStr, todayStr);
  }, []);

  const fetchRecapData = async (start?: string, end?: string) => {
    try {
      setLoading(true);
      
      const startDateFilter = start || startDate;
      const endDateFilter = end || endDate;
      
      console.log('Fetching recap data for:', startDateFilter, 'to', endDateFilter);

      const { data, error } = await supabase
        .from('orders')
        .select(`
          order_date,
          child_name,
          child_class,
          total_amount,
          status,
          order_items (
            quantity,
            price,
            food_items (
              name
            )
          )
        `)
        .gte('order_date', startDateFilter)
        .lte('order_date', endDateFilter)
        .neq('status', 'cancelled')
        .order('order_date', { ascending: false })
        .order('child_class', { ascending: true })
        .order('child_name', { ascending: true });

      if (error) throw error;

      // Transform data to flat structure
      const flatData: OrderRecapItem[] = [];
      
      data?.forEach(order => {
        order.order_items?.forEach(item => {
          flatData.push({
            order_date: order.order_date || '',
            child_name: order.child_name || '',
            child_class: order.child_class || '',
            food_name: item.food_items?.name || '',
            quantity: item.quantity,
            price: item.price,
            total_amount: item.quantity * item.price,
            status: order.status || ''
          });
        });
      });

      console.log('Recap data loaded:', flatData);
      setRecapData(flatData);
    } catch (error) {
      console.error('Error fetching recap data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data rekapitulasi",
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
    fetchRecapData();
  };

  const exportToCSV = () => {
    if (recapData.length === 0) {
      toast({
        title: "Error",
        description: "Tidak ada data untuk diekspor",
        variant: "destructive",
      });
      return;
    }

    const csvHeaders = [
      'Tanggal',
      'Nama Anak',
      'Kelas',
      'Nama Makanan',
      'Jumlah',
      'Harga Satuan',
      'Total Harga',
      'Status'
    ];

    const csvData = recapData.map(row => [
      format(new Date(row.order_date), 'dd/MM/yyyy'),
      row.child_name,
      row.child_class,
      row.food_name,
      row.quantity,
      row.price,
      row.total_amount,
      row.status
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
      link.setAttribute('download', `rekapitulasi-pesanan-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    toast({
      title: "Berhasil",
      description: "Rekapitulasi berhasil diunduh",
    });
  };

  const getSummary = () => {
    const totalItems = recapData.reduce((sum, item) => sum + item.quantity, 0);
    const totalRevenue = recapData.reduce((sum, item) => sum + item.total_amount, 0);
    const uniqueChildren = new Set(recapData.map(item => `${item.child_name}-${item.child_class}`)).size;
    const byClass = recapData.reduce((acc, item) => {
      acc[item.child_class] = (acc[item.child_class] || 0) + item.quantity;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalItems,
      totalRevenue,
      uniqueChildren,
      byClass
    };
  };

  const summary = getSummary();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDateForDisplay = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy', { locale: id });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 md:mb-8 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
            Rekapitulasi Pesanan
          </h1>
          <p className="text-gray-600 text-sm md:text-base">Laporan detail pesanan per kelas dan anak</p>
        </div>
        
        <div className="flex space-x-2 md:space-x-4">
          <Button onClick={exportToCSV} variant="outline" size="sm" className="text-xs md:text-sm">
            <Download className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter Section */}
      <Card className="mb-4 md:mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg md:text-xl">Filter Tanggal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="start-date" className="text-sm">Tanggal Mulai</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-sm"
              />
            </div>
            
            <div>
              <Label htmlFor="end-date" className="text-sm">Tanggal Akhir</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-sm"
              />
            </div>
            
            <div className="flex items-end">
              <Button onClick={handleFilter} className="w-full text-sm">
                <Calendar className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Total Item</CardTitle>
            <FileText className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">{summary.totalItems}</div>
            <p className="text-xs text-muted-foreground">
              Item yang dipesan
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Total Pendapatan</CardTitle>
            <FileText className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">{formatPrice(summary.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Pendapatan kotor
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Jumlah Anak</CardTitle>
            <Users className="h-3 w-3 md:h-4 md:w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">{summary.uniqueChildren}</div>
            <p className="text-xs text-muted-foreground">
              Anak yang memesan
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Kelas Terbanyak</CardTitle>
            <Users className="h-3 w-3 md:h-4 md:w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-sm md:text-2xl font-bold">
              {Object.keys(summary.byClass).length > 0 
                ? Object.entries(summary.byClass).sort(([,a], [,b]) => b - a)[0][0]
                : '-'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {Object.keys(summary.byClass).length > 0 
                ? `${Object.entries(summary.byClass).sort(([,a], [,b]) => b - a)[0][1]} item`
                : 'Tidak ada data'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recap by Class */}
      <Card className="mb-4 md:mb-6">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Rekapitulasi per Kelas</CardTitle>
          <CardDescription className="text-sm">Total pesanan berdasarkan kelas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {Object.entries(summary.byClass).map(([className, count]) => (
              <div key={className} className="text-center p-3 md:p-4 bg-gray-50 rounded-lg">
                <div className="text-xl md:text-2xl font-bold text-orange-600">{count}</div>
                <div className="text-xs md:text-sm text-gray-600">Kelas {className}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Detail Pesanan</CardTitle>
          <CardDescription className="text-sm">Daftar lengkap pesanan per anak</CardDescription>
        </CardHeader>
        <CardContent>
          {recapData.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs md:text-sm">Tanggal</TableHead>
                    <TableHead className="text-xs md:text-sm">Nama Anak</TableHead>
                    <TableHead className="text-xs md:text-sm">Kelas</TableHead>
                    <TableHead className="text-xs md:text-sm">Nama Makanan</TableHead>
                    <TableHead className="text-xs md:text-sm">Jumlah</TableHead>
                    <TableHead className="text-xs md:text-sm">Harga Satuan</TableHead>
                    <TableHead className="text-xs md:text-sm">Total</TableHead>
                    <TableHead className="text-xs md:text-sm">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recapData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-xs md:text-sm">{formatDateForDisplay(item.order_date)}</TableCell>
                      <TableCell className="font-medium text-xs md:text-sm">{item.child_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">Kelas {item.child_class}</Badge>
                      </TableCell>
                      <TableCell className="text-xs md:text-sm">{item.food_name}</TableCell>
                      <TableCell className="text-center text-xs md:text-sm">{item.quantity}</TableCell>
                      <TableCell className="text-xs md:text-sm">{formatPrice(item.price)}</TableCell>
                      <TableCell className="font-medium text-xs md:text-sm">{formatPrice(item.total_amount)}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === 'delivered' ? 'default' : 'secondary'} className="text-xs">
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 md:h-16 md:w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-base md:text-lg font-medium mb-2">Tidak Ada Data</h3>
              <p className="text-gray-600 text-sm md:text-base">Belum ada pesanan untuk periode yang dipilih</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderRecap;

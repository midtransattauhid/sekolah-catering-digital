import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Download, FileText, Calendar, Users, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface MenuSummary {
  food_name: string;
  total_quantity: number;
}

interface ClassMenuSummary {
  child_class: string;
  food_name: string;
  total_quantity: number;
}

interface OrderRecapData {
  menuSummary: MenuSummary[];
  classMenuSummary: ClassMenuSummary[];
  totalItems: number;
  totalRevenue: number;
  uniqueChildren: number;
}

const OrderRecap = () => {
  const [recapData, setRecapData] = useState<OrderRecapData>({
    menuSummary: [],
    classMenuSummary: [],
    totalItems: 0,
    totalRevenue: 0,
    uniqueChildren: 0
  });
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
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
        .order('order_date', { ascending: false });

      if (error) throw error;

      // Process data untuk mendapatkan rekapitulasi yang benar
      const menuMap = new Map<string, number>();
      const classMenuMap = new Map<string, number>();
      let totalItems = 0;
      let totalRevenue = 0;
      const childrenSet = new Set<string>();

      data?.forEach(order => {
        childrenSet.add(`${order.child_name}-${order.child_class}`);
        totalRevenue += order.total_amount || 0;

        order.order_items?.forEach(item => {
          const foodName = item.food_items?.name || '';
          const quantity = item.quantity;
          const className = order.child_class || '';
          
          totalItems += quantity;

          // Gabungan menu tanpa kelas
          const currentMenuTotal = menuMap.get(foodName) || 0;
          menuMap.set(foodName, currentMenuTotal + quantity);

          // Menu per kelas
          const classMenuKey = `${className}-${foodName}`;
          const currentClassMenuTotal = classMenuMap.get(classMenuKey) || 0;
          classMenuMap.set(classMenuKey, currentClassMenuTotal + quantity);
        });
      });

      // Convert maps to arrays
      const menuSummary: MenuSummary[] = Array.from(menuMap.entries()).map(([food_name, total_quantity]) => ({
        food_name,
        total_quantity
      })).sort((a, b) => b.total_quantity - a.total_quantity);

      const classMenuSummary: ClassMenuSummary[] = Array.from(classMenuMap.entries()).map(([key, total_quantity]) => {
        const [child_class, food_name] = key.split('-');
        return {
          child_class,
          food_name,
          total_quantity
        };
      }).sort((a, b) => a.child_class.localeCompare(b.child_class) || b.total_quantity - a.total_quantity);

      setRecapData({
        menuSummary,
        classMenuSummary,
        totalItems,
        totalRevenue,
        uniqueChildren: childrenSet.size
      });

      console.log('Recap data processed:', { menuSummary, classMenuSummary });
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

  const printReport = () => {
    if (recapData.menuSummary.length === 0 && recapData.classMenuSummary.length === 0) {
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
        <title>Rekapitulasi Pesanan - ${format(new Date(), 'dd MMMM yyyy', { locale: id })}</title>
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
          .badge { 
            background: #f97316; 
            color: white; 
            padding: 4px 8px; 
            border-radius: 4px; 
            font-size: 12px;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Rekapitulasi Pesanan</h1>
          <p>Periode: ${startDate === endDate ? format(new Date(startDate), 'dd MMMM yyyy', { locale: id }) : `${format(new Date(startDate), 'dd MMMM yyyy', { locale: id })} - ${format(new Date(endDate), 'dd MMMM yyyy', { locale: id })}`}</p>
          <p>Dicetak pada: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: id })}</p>
        </div>

        <div class="summary">
          <div class="summary-item">
            <h3>${recapData.totalItems}</h3>
            <p>Total Item Terjual</p>
          </div>
          <div class="summary-item">
            <h3>${formatPrice(recapData.totalRevenue)}</h3>
            <p>Total Pendapatan</p>
          </div>
          <div class="summary-item">
            <h3>${recapData.uniqueChildren}</h3>
            <p>Anak yang Memesan</p>
          </div>
        </div>

        <div class="section">
          <h2>Rekapitulasi Menu (Gabungan)</h2>
          ${recapData.menuSummary.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Menu</th>
                  <th class="text-center">Total Jumlah</th>
                </tr>
              </thead>
              <tbody>
                ${recapData.menuSummary.map((item, index) => `
                  <tr>
                    <td class="text-center">${index + 1}</td>
                    <td>${item.food_name}</td>
                    <td class="text-center"><strong>${item.total_quantity}</strong></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p>Tidak ada data untuk periode yang dipilih</p>'}
        </div>

        <div class="section">
          <h2>Rekapitulasi Menu Per Kelas</h2>
          ${recapData.classMenuSummary.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Kelas</th>
                  <th>Nama Menu</th>
                  <th class="text-center">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                ${recapData.classMenuSummary.map((item, index) => `
                  <tr>
                    <td class="text-center">${index + 1}</td>
                    <td><span class="badge">Kelas ${item.child_class}</span></td>
                    <td>${item.food_name}</td>
                    <td class="text-center"><strong>${item.total_quantity}</strong></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p>Tidak ada data untuk periode yang dipilih</p>'}
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const exportToCSV = () => {
    if (recapData.menuSummary.length === 0 && recapData.classMenuSummary.length === 0) {
      toast({
        title: "Error",
        description: "Tidak ada data untuk diekspor",
        variant: "destructive",
      });
      return;
    }

    // CSV untuk gabungan menu
    const menuHeaders = ['Nama Menu', 'Total Jumlah'];
    const menuData = recapData.menuSummary.map(item => [
      item.food_name,
      item.total_quantity
    ]);

    // CSV untuk menu per kelas
    const classMenuHeaders = ['Kelas', 'Nama Menu', 'Jumlah'];
    const classMenuData = recapData.classMenuSummary.map(item => [
      item.child_class,
      item.food_name,
      item.total_quantity
    ]);

    const csvContent = [
      'REKAPITULASI MENU (GABUNGAN)',
      menuHeaders.join(','),
      ...menuData.map(row => row.join(',')),
      '',
      'REKAPITULASI MENU PER KELAS',
      classMenuHeaders.join(','),
      ...classMenuData.map(row => row.join(','))
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-3 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-3 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-1">
            Rekapitulasi Pesanan
          </h1>
          <p className="text-gray-600 text-sm">Laporan gabungan menu dan per kelas</p>
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
          <CardTitle className="text-base md:text-lg">Filter Tanggal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Total Item</CardTitle>
            <FileText className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">{recapData.totalItems}</div>
            <p className="text-xs text-muted-foreground">Item terjual</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Pendapatan</CardTitle>
            <FileText className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-sm md:text-2xl font-bold">{formatPrice(recapData.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Anak</CardTitle>
            <Users className="h-3 w-3 md:h-4 md:w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">{recapData.uniqueChildren}</div>
            <p className="text-xs text-muted-foreground">Memesan</p>
          </CardContent>
        </Card>
      </div>

      {/* Gabungan Menu */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-xl">Rekapitulasi Menu (Gabungan)</CardTitle>
          <CardDescription className="text-xs md:text-sm">Total pesanan semua menu tanpa pembagian kelas</CardDescription>
        </CardHeader>
        <CardContent>
          {recapData.menuSummary.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs md:text-sm">Nama Menu</TableHead>
                    <TableHead className="text-xs md:text-sm text-center">Total Jumlah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recapData.menuSummary.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium text-xs md:text-sm">{item.food_name}</TableCell>
                      <TableCell className="text-center text-xs md:text-sm font-bold text-orange-600">
                        {item.total_quantity}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-6">
              <FileText className="h-8 w-8 md:h-12 md:w-12 mx-auto text-gray-400 mb-2" />
              <h3 className="text-sm md:text-base font-medium mb-1">Tidak Ada Data</h3>
              <p className="text-gray-600 text-xs md:text-sm">Belum ada pesanan untuk periode yang dipilih</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Menu Per Kelas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-xl">Rekapitulasi Menu Per Kelas</CardTitle>
          <CardDescription className="text-xs md:text-sm">Detail pesanan berdasarkan kelas</CardDescription>
        </CardHeader>
        <CardContent>
          {recapData.classMenuSummary.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs md:text-sm">Kelas</TableHead>
                    <TableHead className="text-xs md:text-sm">Nama Menu</TableHead>
                    <TableHead className="text-xs md:text-sm text-center">Jumlah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recapData.classMenuSummary.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">Kelas {item.child_class}</Badge>
                      </TableCell>
                      <TableCell className="font-medium text-xs md:text-sm">{item.food_name}</TableCell>
                      <TableCell className="text-center text-xs md:text-sm font-bold text-orange-600">
                        {item.total_quantity}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-6">
              <FileText className="h-8 w-8 md:h-12 md:w-12 mx-auto text-gray-400 mb-2" />
              <h3 className="text-sm md:text-base font-medium mb-1">Tidak Ada Data</h3>
              <p className="text-gray-600 text-xs md:text-sm">Belum ada pesanan untuk periode yang dipilih</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderRecap;

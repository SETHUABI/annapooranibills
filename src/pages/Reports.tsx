import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAllBills, getSettings } from '@/lib/db';
import { Bill, AppSettings } from '@/types';
import { Download, FileDown, Calendar } from 'lucide-react';
import { exportBillsToExcel, exportBillsToCSV } from '@/lib/export';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function Reports() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [billsData, settingsData] = await Promise.all([
        getAllBills(),
        getSettings(),
      ]);
      setBills(billsData);
      setSettings(settingsData || null);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reports data',
        variant: 'destructive',
      });
    }
  };

  const getFilteredBills = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (selectedPeriod) {
      case 'today':
        return bills.filter(bill => new Date(bill.createdAt) >= today);
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return bills.filter(bill => new Date(bill.createdAt) >= weekAgo);
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return bills.filter(bill => new Date(bill.createdAt) >= monthAgo);
      default:
        return bills;
    }
  };

  const filteredBills = getFilteredBills();
  const totalSales = filteredBills.reduce((sum, bill) => sum + bill.total, 0);
  const totalItems = filteredBills.reduce((sum, bill) => sum + bill.items.length, 0);
  const avgBillValue = filteredBills.length > 0 ? totalSales / filteredBills.length : 0;

  const handleExportExcel = () => {
    try {
      exportBillsToExcel(filteredBills, `bills-${selectedPeriod}-${Date.now()}.xlsx`);
      toast({
        title: 'Success',
        description: 'Bills exported to Excel successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export bills',
        variant: 'destructive',
      });
    }
  };

  const handleExportCSV = () => {
    try {
      exportBillsToCSV(filteredBills, `bills-${selectedPeriod}-${Date.now()}.csv`);
      toast({
        title: 'Success',
        description: 'Bills exported to CSV successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export bills',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Reports</h1>
          <p className="text-muted-foreground">View sales reports and analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <FileDown className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2">
        {(['today', 'week', 'month', 'all'] as const).map((period) => (
          <Button
            key={period}
            variant={selectedPeriod === period ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod(period)}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {settings?.currency || '₹'}{totalSales.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredBills.length} bills
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Bill
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {settings?.currency || '₹'}{avgBillValue.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              per transaction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Bills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {filteredBills.length}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Items Sold
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {totalItems}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              total items
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bills Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bills</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredBills.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No bills found for this period
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill No.</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Cashier</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBills.slice(0, 50).map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell className="font-medium">{bill.billNumber}</TableCell>
                      <TableCell>
                        {new Date(bill.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>{bill.createdByName}</TableCell>
                      <TableCell>{bill.items.length}</TableCell>
                      <TableCell className="capitalize">
                        {bill.paymentMethod || '-'}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {settings?.currency || '₹'}{bill.total.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

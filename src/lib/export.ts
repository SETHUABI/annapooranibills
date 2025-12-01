import * as XLSX from 'xlsx';
import { Bill, MenuItem } from '@/types';

export function exportBillsToExcel(bills: Bill[], filename: string = 'bills.xlsx'): void {
  const data = bills.map(bill => ({
    'Bill Number': bill.billNumber,
    'Date': new Date(bill.createdAt).toLocaleString(),
    'Cashier': bill.createdByName,
    'Customer': bill.customerName || '-',
    'Items': bill.items.length,
    'Subtotal': bill.subtotal,
    'CGST': bill.cgst,
    'SGST': bill.sgst,
    'Total': bill.total,
    'Payment': bill.paymentMethod || '-',
    'Synced': bill.syncedToCloud ? 'Yes' : 'No',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Bills');
  
  XLSX.writeFile(workbook, filename);
}

export function exportBillsToCSV(bills: Bill[], filename: string = 'bills.csv'): void {
  const headers = ['Bill Number', 'Date', 'Cashier', 'Customer', 'Items', 'Subtotal', 'CGST', 'SGST', 'Total', 'Payment', 'Synced'];
  const rows = bills.map(bill => [
    bill.billNumber,
    new Date(bill.createdAt).toLocaleString(),
    bill.createdByName,
    bill.customerName || '-',
    bill.items.length,
    bill.subtotal,
    bill.cgst,
    bill.sgst,
    bill.total,
    bill.paymentMethod || '-',
    bill.syncedToCloud ? 'Yes' : 'No',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportMenuToExcel(menuItems: MenuItem[], filename: string = 'menu.xlsx'): void {
  const data = menuItems.map(item => ({
    'Item ID': item.id,
    'Name': item.name,
    'Category': item.category,
    'Price': item.price,
    'Description': item.description || '-',
    'Available': item.isAvailable ? 'Yes' : 'No',
    'Created': new Date(item.createdAt).toLocaleString(),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Menu');
  
  XLSX.writeFile(workbook, filename);
}

export function exportDataBackup(bills: Bill[], menuItems: MenuItem[], filename: string = 'pos-backup.json'): void {
  const backup = {
    exportDate: new Date().toISOString(),
    version: '1.0',
    data: {
      bills,
      menuItems,
    }
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

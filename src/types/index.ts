// Core Types for Restaurant POS System

export type UserRole = 'admin' | 'staff' | 'manager';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  name: string;
  createdAt: string;
  isActive: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BillItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

/* FIXED — FINAL BILL INTERFACE */
export interface Bill {
  id: string;
  billNumber: string;

  // For displaying on screen
  billDate?: string;

  // ISO date stored for printing
  createdAt: string;

  createdBy: string;
  createdByName: string;

  // DINE-IN or PARCEL
  orderType: "dine-in" | "parcel";

  paymentMethod?: "cash" | "card" | "upi";
  customerName?: string;
  customerPhone?: string;
  notes?: string;

  subtotal: number;
  cgst: number;
  sgst: number;
  total: number;

  items: BillItem[];

  syncedToCloud: boolean;
}

export interface AppSettings {
  shopName: string;
  shopAddress: string;
  shopGST: string;
  shopPhone?: string;
  shopEmail?: string;
  cgstRate: number;
  sgstRate: number;
  printerFormat: "58mm" | "80mm";
  theme: "light" | "dark";
  googleSheetsUrl?: string;
  autoSync: boolean;
  currency: string;
}

export interface DailySummary {
  date: string;
  totalSales: number;
  totalBills: number;
  totalItems: number;
  avgBillValue: number;
}

export interface CategorySales {
  category: string;
  totalSales: number;
  itemCount: number;
}

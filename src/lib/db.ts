import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { User, MenuItem, Bill, AppSettings } from '@/types';

interface RestaurantPOSDB extends DBSchema {
  users: {
    key: string;
    value: User;
    indexes: { 'by-username': string };
  };
  menuItems: {
    key: string;
    value: MenuItem;
    indexes: { 'by-category': string; 'by-available': number };
  };
  bills: {
    key: string;
    value: Bill;
    indexes: { 'by-date': string; 'by-user': string; 'by-sync': number };
  };
  settings: {
    key: string;
    value: AppSettings;
  };
}

const DB_NAME = 'RestaurantPOS';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<RestaurantPOSDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<RestaurantPOSDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<RestaurantPOSDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // Users store
      if (!db.objectStoreNames.contains('users')) {
        const userStore = db.createObjectStore('users', { keyPath: 'id' });
        userStore.createIndex('by-username', 'username', { unique: true });
      }

      // Menu items store
      if (!db.objectStoreNames.contains('menuItems')) {
        const menuStore = db.createObjectStore('menuItems', { keyPath: 'id' });
        menuStore.createIndex('by-category', 'category');
        menuStore.createIndex('by-available', 'isAvailable');
      }

      // Bills store
      if (!db.objectStoreNames.contains('bills')) {
        const billStore = db.createObjectStore('bills', { keyPath: 'id' });
        billStore.createIndex('by-date', 'createdAt');
        billStore.createIndex('by-user', 'createdBy');
        billStore.createIndex('by-sync', 'syncedToCloud');
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }
    },
  });

  return dbInstance;
}

// User operations
export async function createUser(user: User): Promise<void> {
  const db = await getDB();
  await db.add('users', user);
}

export async function getUser(id: string): Promise<User | undefined> {
  const db = await getDB();
  return await db.get('users', id);
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const db = await getDB();
  return await db.getFromIndex('users', 'by-username', username);
}

export async function getAllUsers(): Promise<User[]> {
  const db = await getDB();
  return await db.getAll('users');
}

export async function updateUser(user: User): Promise<void> {
  const db = await getDB();
  await db.put('users', user);
}

export async function deleteUser(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('users', id);
}

// Menu item operations
export async function createMenuItem(item: MenuItem): Promise<void> {
  const db = await getDB();
  await db.add('menuItems', item);
}

export async function getMenuItem(id: string): Promise<MenuItem | undefined> {
  const db = await getDB();
  return await db.get('menuItems', id);
}

export async function getAllMenuItems(): Promise<MenuItem[]> {
  const db = await getDB();
  return await db.getAll('menuItems');
}

export async function getMenuItemsByCategory(category: string): Promise<MenuItem[]> {
  const db = await getDB();
  return await db.getAllFromIndex('menuItems', 'by-category', category);
}

export async function getAvailableMenuItems(): Promise<MenuItem[]> {
  const db = await getDB();
  const allItems = await db.getAll('menuItems');
  return allItems.filter(item => item.isAvailable);
}

export async function updateMenuItem(item: MenuItem): Promise<void> {
  const db = await getDB();
  await db.put('menuItems', item);
}

export async function deleteMenuItem(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('menuItems', id);
}

// Bill operations
export async function createBill(bill: Bill): Promise<void> {
  const db = await getDB();
  await db.add('bills', bill);
}

export async function getBill(id: string): Promise<Bill | undefined> {
  const db = await getDB();
  return await db.get('bills', id);
}

export async function getAllBills(): Promise<Bill[]> {
  const db = await getDB();
  return await db.getAll('bills');
}

export async function getBillsByDateRange(startDate: string, endDate: string): Promise<Bill[]> {
  const db = await getDB();
  const allBills = await db.getAll('bills');
  return allBills.filter(bill => 
    bill.createdAt >= startDate && bill.createdAt <= endDate
  );
}

export async function getUnsyncedBills(): Promise<Bill[]> {
  const db = await getDB();
  return await db.getAllFromIndex('bills', 'by-sync', 0);
}

export async function updateBill(bill: Bill): Promise<void> {
  const db = await getDB();
  await db.put('bills', bill);
}

export async function getLastBillNumber(): Promise<string> {
  const db = await getDB();
  const bills = await db.getAll('bills');
  if (bills.length === 0) return 'BILL0000';
  
  const lastBill = bills[bills.length - 1];
  const lastNumber = parseInt(lastBill.billNumber.replace('BILL', ''));
  return `BILL${String(lastNumber + 1).padStart(4, '0')}`;
}

// Settings operations
export async function getSettings(): Promise<AppSettings | undefined> {
  const db = await getDB();
  const settings = await db.getAll('settings');
  return settings[0];
}

export async function saveSettings(settings: AppSettings & { id: string }): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings);
}

// Initialize default data
export async function initializeDefaultData(): Promise<void> {
  const db = await getDB();
  
  // Check if already initialized
  const users = await db.getAll('users');
  if (users.length > 0) return;

  // Create default admin user (password: admin123)
  const bcrypt = await import('bcryptjs');
  const defaultAdmin: User = {
    id: 'user-1',
    username: 'admin',
    passwordHash: await bcrypt.hash('admin123', 10),
    role: 'admin',
    name: 'Admin User',
    createdAt: new Date().toISOString(),
    isActive: true,
  };
  await db.add('users', defaultAdmin);

  // Create default settings
  const defaultSettings: AppSettings & { id: string } = {
    id: 'settings-1',
    shopName: 'My Restaurant',
    shopAddress: '123 Main Street, City',
    shopGST: 'GSTIN123456789',
    cgstRate: 2.5,
    sgstRate: 2.5,
    printerFormat: '80mm',
    theme: 'dark',
    autoSync: false,
    currency: '₹',
  };
  await db.add('settings', defaultSettings);

  // Create sample menu items
  const categories = ['Starters', 'Main Course', 'Beverages', 'Desserts'];
  const sampleItems: MenuItem[] = [
    {
      id: 'menu-1',
      name: 'Veg Manchurian',
      price: 150,
      category: 'Starters',
      description: 'Crispy fried vegetables in tangy sauce',
      isAvailable: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'menu-2',
      name: 'Paneer Tikka',
      price: 200,
      category: 'Starters',
      description: 'Grilled cottage cheese with spices',
      isAvailable: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'menu-3',
      name: 'Butter Chicken',
      price: 280,
      category: 'Main Course',
      description: 'Creamy tomato curry with chicken',
      isAvailable: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'menu-4',
      name: 'Dal Makhani',
      price: 180,
      category: 'Main Course',
      description: 'Creamy black lentils',
      isAvailable: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'menu-5',
      name: 'Fresh Lime Soda',
      price: 60,
      category: 'Beverages',
      description: 'Refreshing lime drink',
      isAvailable: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'menu-6',
      name: 'Gulab Jamun',
      price: 80,
      category: 'Desserts',
      description: 'Sweet milk dumplings in syrup',
      isAvailable: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  for (const item of sampleItems) {
    await db.add('menuItems', item);
  }
}

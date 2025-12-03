import { openDB, DBSchema, IDBPDatabase } from "idb";
import { User, MenuItem, Bill, AppSettings } from "@/types";

interface RestaurantPOSDB extends DBSchema {
  users: {
    key: string;
    value: User;
    indexes: { "by-username": string };
  };
  menuItems: {
    key: string;
    value: MenuItem;
    indexes: { "by-category": string; "by-available": number };
  };
  bills: {
    key: string;
    value: Bill;
    indexes: { "by-date": string; "by-user": string; "by-sync": number };
  };
  settings: {
    key: string;
    value: AppSettings;
  };
}

const DB_NAME = "RestaurantPOS";
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<RestaurantPOSDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<RestaurantPOSDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<RestaurantPOSDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("users")) {
        const userStore = db.createObjectStore("users", { keyPath: "id" });
        userStore.createIndex("by-username", "username", { unique: true });
      }

      if (!db.objectStoreNames.contains("menuItems")) {
        const menuStore = db.createObjectStore("menuItems", { keyPath: "id" });
        menuStore.createIndex("by-category", "category");
        menuStore.createIndex("by-available", "isAvailable");
      }

      if (!db.objectStoreNames.contains("bills")) {
        const billStore = db.createObjectStore("bills", { keyPath: "id" });
        billStore.createIndex("by-date", "createdAt");
        billStore.createIndex("by-user", "createdBy");
        billStore.createIndex("by-sync", "syncedToCloud");
      }

      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "id" });
      }
    },
  });

  return dbInstance;
}

/* -------------------------------------------------------------------------- */
/*                              USER OPERATIONS                               */
/* -------------------------------------------------------------------------- */

export async function createUser(user: User): Promise<void> {
  const db = await getDB();
  await db.add("users", user);
}

export async function getUser(id: string): Promise<User | undefined> {
  const db = await getDB();
  return await db.get("users", id);
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const db = await getDB();
  return await db.getFromIndex("users", "by-username", username);
}

export async function getAllUsers(): Promise<User[]> {
  const db = await getDB();
  return await db.getAll("users");
}

export async function updateUser(user: User): Promise<void> {
  const db = await getDB();
  await db.put("users", user);
}

export async function deleteUser(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("users", id);
}

/* -------------------------------------------------------------------------- */
/*                           MENU ITEM OPERATIONS                             */
/* -------------------------------------------------------------------------- */

export async function createMenuItem(item: MenuItem): Promise<void> {
  const db = await getDB();
  await db.add("menuItems", item);
}

export async function getMenuItem(id: string): Promise<MenuItem | undefined> {
  const db = await getDB();
  return await db.get("menuItems", id);
}

export async function getAllMenuItems(): Promise<MenuItem[]> {
  const db = await getDB();
  return await db.getAll("menuItems");
}

export async function getMenuItemsByCategory(category: string): Promise<MenuItem[]> {
  const db = await getDB();
  return await db.getAllFromIndex("menuItems", "by-category", category);
}

export async function getAvailableMenuItems(): Promise<MenuItem[]> {
  const db = await getDB();
  return (await db.getAll("menuItems")).filter((x) => x.isAvailable);
}

export async function updateMenuItem(item: MenuItem): Promise<void> {
  const db = await getDB();
  await db.put("menuItems", item);
}

export async function deleteMenuItem(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("menuItems", id);
}

/* -------------------------------------------------------------------------- */
/*                             MENU RESET FUNCTION                            */
/* -------------------------------------------------------------------------- */

export async function resetMenuItems(): Promise<void> {
  const db = await getDB();

  // clear old menu
  const tx = db.transaction("menuItems", "readwrite");
  await tx.store.clear();
  await tx.done;

  const menuList = [
    // TIFFEN
    { name: "Tiffen", price: 50, category: "TIFFEN" },
    { name: "Amount", price: 10, category: "TIFFEN" },
    { name: "Pongal", price: 50, category: "TIFFEN" },
    { name: "Poori", price: 25, category: "TIFFEN" },

    // DOSA
    { name: "Dosa", price: 15, category: "DOSA" },
    { name: "Kal Dosa", price: 15, category: "DOSA" },
    { name: "Egg Dosa", price: 30, category: "DOSA" },
    { name: "Chicken Roast", price: 120, category: "DOSA" },
    { name: "Egg Kal Dosa", price: 30, category: "DOSA" },
    { name: "Egg Roast", price: 70, category: "DOSA" },
    { name: "Ghee Dosa", price: 40, category: "DOSA" },
    { name: "Ghee Roast", price: 70, category: "DOSA" },
    { name: "Roast", price: 50, category: "DOSA" },
    { name: "Uthappam", price: 30, category: "DOSA" },
    { name: "Kari Dosa", price: 120, category: "DOSA" },
    { name: "Podi Dosa", price: 30, category: "DOSA" },
    { name: "Podi Roast", price: 70, category: "DOSA" },
    { name: "Masala Roast", price: 80, category: "DOSA" },
    { name: "Mushroom Roast", price: 100, category: "DOSA" },
    { name: "Onion Dosa", price: 30, category: "DOSA" },
    { name: "Onion Kal Dosa", price: 30, category: "DOSA" },
    { name: "Onion Roast", price: 70, category: "DOSA" },
    { name: "Onion Uthappam", price: 70, category: "DOSA" },
    { name: "Panner Roast", price: 120, category: "DOSA" },

    // RICE
    { name: "Meals", price: 70, category: "RICE" },
    { name: "Tomato Rice", price: 50, category: "RICE" },

    // BIRYANI
    { name: "Egg Biryani", price: 80, category: "BIRYANI" },
    { name: "Chicken Biryani", price: 100, category: "BIRYANI" },
    { name: "MT Biryani", price: 70, category: "BIRYANI" },
    { name: "Veg Biryani", price: 60, category: "BIRYANI" },

    // PAROTTA
    { name: "Bun Parotta", price: 20, category: "PAROTTA" },
    { name: "Parotta", price: 15, category: "PAROTTA" },
    { name: "Kothu Parotta", price: 70, category: "PAROTTA" },
    { name: "Chappathi", price: 15, category: "PAROTTA" },
    { name: "Chicken Kothu Parotta", price: 120, category: "PAROTTA" },
    { name: "Egg Lappa", price: 80, category: "PAROTTA" },
    { name: "Chicken Lappa", price: 120, category: "PAROTTA" },
    { name: "Veechu Parotta", price: 20, category: "PAROTTA" },
    { name: "Egg Veechu Parotta", price: 40, category: "PAROTTA" },
    { name: "Chilly Parotta", price: 50, category: "PAROTTA" },
    { name: "Chicken Leaf Parotta", price: 150, category: "PAROTTA" },

    // NOODLES
    { name: "Chicken Noodles", price: 100, category: "NOODLES" },
    { name: "Veg Noodles", price: 70, category: "NOODLES" },
    { name: "Egg Noodles", price: 80, category: "NOODLES" },
    { name: "Gobi Noodles", price: 90, category: "NOODLES" },
    { name: "Mushroom Noodles", price: 100, category: "NOODLES" },
    { name: "Panner Noodles", price: 100, category: "NOODLES" },

    // FRIED RICE
    { name: "Chicken Rice", price: 100, category: "FRIED RICE" },
    { name: "Egg Rice", price: 80, category: "FRIED RICE" },
    { name: "Jeera Rice", price: 90, category: "FRIED RICE" },
    { name: "Gobi Rice", price: 90, category: "FRIED RICE" },
    { name: "Veg Rice", price: 70, category: "FRIED RICE" },
    { name: "Mushroom Rice", price: 100, category: "FRIED RICE" },
    { name: "Panner Rice", price: 100, category: "FRIED RICE" },

    // GOBI STARTERS
    { name: "Gobi Manchurian", price: 100, category: "GOBI STARTERS" },
    { name: "Gobi Masala", price: 100, category: "GOBI STARTERS" },

    // MUSHROOM STARTERS
    { name: "Mushroom Fry", price: 100, category: "MUSHROOM STARTERS" },
    { name: "Mushroom Manchurian", price: 120, category: "MUSHROOM STARTERS" },
    { name: "Mushroom Pepper Fry", price: 120, category: "MUSHROOM STARTERS" },

    // VEG GRAVY
    { name: "Mushroom Gravy", price: 120, category: "VEG GRAVY" },
    { name: "Panner Butter Masala", price: 120, category: "VEG GRAVY" },
    { name: "Panner Pepper Fry", price: 120, category: "VEG GRAVY" },

    // CHILLY SPECIAL
    { name: "Chilly Chicken", price: 80, category: "CHILLY SPECIAL" },
    { name: "Gobi Chilly", price: 70, category: "CHILLY SPECIAL" },
    { name: "Mushroom Chilly", price: 70, category: "CHILLY SPECIAL" },

    // EGG ITEMS
    { name: "Boiled Egg", price: 15, category: "EGG ITEMS" },
    { name: "Omelette", price: 15, category: "EGG ITEMS" },
    { name: "Kalaki", price: 15, category: "EGG ITEMS" },
    { name: "Full Boil", price: 15, category: "EGG ITEMS" },
    { name: "Egg Poriyal", price: 25, category: "EGG ITEMS" },
    { name: "Kullumbu Kalaki", price: 15, category: "EGG ITEMS" },
    { name: "Egg Masala", price: 100, category: "EGG ITEMS" },

    // CHICKEN GRAVY
    { name: "Butter Chicken Gravy", price: 150, category: "CHICKEN GRAVY" },
    { name: "Pallipalayam Chicken Gravy", price: 140, category: "CHICKEN GRAVY" },
    { name: "Pepper Chicken Gravy", price: 140, category: "CHICKEN GRAVY" },
    { name: "Chicken Fry", price: 120, category: "CHICKEN GRAVY" },
  ];

  for (const item of menuList) {
    await db.add("menuItems", {
      id: crypto.randomUUID(),
      name: item.name,
      price: item.price,
      category: item.category,
      description: "",
      isAvailable: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  console.log("MENU RESET completed!");
}

/* -------------------------------------------------------------------------- */
/*                             BILL OPERATIONS                                */
/* -------------------------------------------------------------------------- */

export async function createBill(bill: Bill): Promise<void> {
  const db = await getDB();
  await db.add("bills", bill);
}

export async function getBill(id: string): Promise<Bill | undefined> {
  const db = await getDB();
  return await db.get("bills", id);
}

export async function getAllBills(): Promise<Bill[]> {
  const db = await getDB();
  return await db.getAll("bills");
}

export async function getBillsByDateRange(startDate: string, endDate: string): Promise<Bill[]> {
  const db = await getDB();
  const bills = await db.getAll("bills");
  return bills.filter((x) => x.createdAt >= startDate && x.createdAt <= endDate);
}

export async function updateBill(bill: Bill): Promise<void> {
  const db = await getDB();
  await db.put("bills", bill);
}

/* ---------------------- ADDED DELETE BILL FUNCTION ------------------------ */
export async function deleteBill(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("bills", id);
}

export async function getLastBillNumber(): Promise<string> {
  const db = await getDB();
  const bills = await db.getAll("bills");
  if (bills.length === 0) return "BILL0000";

  const lastBill = bills[bills.length - 1];
  const num = parseInt(lastBill.billNumber.replace("BILL", ""));
  return `BILL${String(num + 1).padStart(4, "0")}`;
}

/* -------------------------------------------------------------------------- */
/*                           SETTINGS OPERATIONS                              */
/* -------------------------------------------------------------------------- */

export async function getSettings(): Promise<AppSettings | undefined> {
  const db = await getDB();
  const settings = await db.getAll("settings");
  return settings[0];
}

export async function saveSettings(settings: AppSettings & { id: string }): Promise<void> {
  const db = await getDB();
  await db.put("settings", settings);
}

/* -------------------------------------------------------------------------- */
/*                          DEFAULT INITIALIZER                               */
/* -------------------------------------------------------------------------- */

export async function initializeDefaultData(): Promise<void> {
  const db = await getDB();
  const users = await db.getAll("users");

  if (users.length > 0) return;

  // admin user
  const bcrypt = await import("bcryptjs");
  const admin: User = {
    id: "user-1",
    username: "admin",
    passwordHash: await bcrypt.hash("admin123", 10),
    role: "admin",
    name: "Admin User",
    createdAt: new Date().toISOString(),
    isActive: true,
  };

  await db.add("users", admin);

  // settings
  const settings: AppSettings & { id: string } = {
    id: "settings-1",
    shopName: "My Restaurant",
    shopAddress: "123 Main Street, City",
    shopGST: "",
    cgstRate: 2.5,
    sgstRate: 2.5,
    printerFormat: "80mm",
    theme: "dark",
    autoSync: false,
    currency: "₹",
  };

  await db.add("settings", settings);

  // EMPTY MENU
  // You will run resetMenuItems() manually
}

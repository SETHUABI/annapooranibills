// src/pages/Billing.tsx
import { useState, useEffect } from 'react'; 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createBill, getSettings } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { MenuItem, BillItem, Bill, AppSettings } from '@/types';
import { Plus, Minus, Trash2, ShoppingCart, Printer, Receipt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { printBill } from '@/lib/print';

// NEW IMPORT
import { getLastBillNumber, setLastBillNumber } from '@/lib/billCounter';

// STATIC MENU LIST (FULL MENU) - unchanged from your input
const STATIC_MENU: MenuItem[] = [
  // STARTERS
  { id: "1", name: "Gobi Manchurian", price: 100, category: "Starters", isAvailable: true },
  { id: "2", name: "Gobi Masala", price: 100, category: "Starters", isAvailable: true },
  { id: "3", name: "Mushroom Fry", price: 100, category: "Starters", isAvailable: true },
  { id: "4", name: "Mushroom Manchurian", price: 120, category: "Starters", isAvailable: true },
  { id: "5", name: "Mushroom Pepper Fry", price: 120, category: "Starters", isAvailable: true },
  { id: "6", name: "Chilly Chicken", price: 80, category: "Starters", isAvailable: true },
  { id: "7", name: "Gobi Chilly", price: 70, category: "Starters", isAvailable: true },
  { id: "8", name: "Mushroom Chilly", price: 70, category: "Starters", isAvailable: true },
  { id: "9", name: "Boiled Egg", price: 15, category: "Starters", isAvailable: true },
  { id: "10", name: "Omelette", price: 15, category: "Starters", isAvailable: true },
  { id: "11", name: "Kalaki", price: 15, category: "Starters", isAvailable: true },
  { id: "12", name: "Full Boil", price: 15, category: "Starters", isAvailable: true },
  { id: "13", name: "Egg Poriyal", price: 25, category: "Starters", isAvailable: true },
  { id: "14", name: "Kullumbu Kalaki", price: 15, category: "Starters", isAvailable: true },

  // TIFFEN
  { id: "15", name: "Tiffen", price: 50, category: "Tiffen", isAvailable: true },
  { id: "16", name: "Amount", price: 10, category: "Tiffen", isAvailable: true },
  { id: "17", name: "Pongal", price: 50, category: "Tiffen", isAvailable: true },
  { id: "18", name: "Poori", price: 25, category: "Tiffen", isAvailable: true },

  // DOSA
  { id: "19", name: "Dosa", price: 15, category: "Dosa", isAvailable: true },
  { id: "20", name: "Kal Dosa", price: 15, category: "Dosa", isAvailable: true },
  { id: "21", name: "Egg Dosa", price: 30, category: "Dosa", isAvailable: true },
  { id: "22", name: "Chicken Roast", price: 120, category: "Dosa", isAvailable: true },
  { id: "23", name: "Egg Kal Dosa", price: 30, category: "Dosa", isAvailable: true },
  { id: "24", name: "Egg Roast", price: 70, category: "Dosa", isAvailable: true },
  { id: "25", name: "Ghee Dosa", price: 40, category: "Dosa", isAvailable: true },
  { id: "26", name: "Ghee Roast", price: 70, category: "Dosa", isAvailable: true },
  { id: "27", name: "Roast", price: 50, category: "Dosa", isAvailable: true },
  { id: "28", name: "Uthappam", price: 30, category: "Dosa", isAvailable: true },
  { id: "29", name: "Kari Dosa", price: 120, category: "Dosa", isAvailable: true },
  { id: "30", name: "Podi Dosa", price: 30, category: "Dosa", isAvailable: true },
  { id: "31", name: "Podi Roast", price: 70, category: "Dosa", isAvailable: true },
  { id: "32", name: "Masala Roast", price: 80, category: "Dosa", isAvailable: true },
  { id: "33", name: "Mushroom Roast", price: 100, category: "Dosa", isAvailable: true },
  { id: "34", name: "Onion Dosa", price: 30, category: "Dosa", isAvailable: true },
  { id: "35", name: "Onion Kal Dosa", price: 30, category: "Dosa", isAvailable: true },
  { id: "36", name: "Onion Roast", price: 70, category: "Dosa", isAvailable: true },
  { id: "37", name: "Onion Uthappam", price: 70, category: "Dosa", isAvailable: true },
  { id: "38", name: "Panner Roast", price: 120, category: "Dosa", isAvailable: true },

  // RICE
  { id: "39", name: "Meals", price: 70, category: "Rice", isAvailable: true },
  { id: "40", name: "Tomato Rice", price: 50, category: "Rice", isAvailable: true },

  // BIRYANI
  { id: "41", name: "Egg Biryani", price: 80, category: "Biryani", isAvailable: true },
  { id: "42", name: "Chicken Biryani", price: 100, category: "Biryani", isAvailable: true },
  { id: "43", name: "MT Biryani", price: 70, category: "Biryani", isAvailable: true },
  { id: "44", name: "Veg Biryani", price: 60, category: "Biryani", isAvailable: true },

  // PAROTTA
  { id: "45", name: "Bun Parotta", price: 20, category: "Parotta", isAvailable: true },
  { id: "46", name: "Parotta", price: 15, category: "Parotta", isAvailable: true },
  { id: "47", name: "Kothu Parotta", price: 70, category: "Parotta", isAvailable: true },
  { id: "48", name: "Chappathi", price: 15, category: "Parotta", isAvailable: true },
  { id: "49", name: "Chicken Kothu Parotta", price: 120, category: "Parotta", isAvailable: true },
  { id: "50", name: "Egg Lappa", price: 80, category: "Parotta", isAvailable: true },
  { id: "51", name: "Chicken Lappa", price: 120, category: "Parotta", isAvailable: true },
  { id: "52", name: "Veechu Parotta", price: 20, category: "Parotta", isAvailable: true },
  { id: "53", name: "Egg Veechu Parotta", price: 40, category: "Parotta", isAvailable: true },
  { id: "54", name: "Chilly Parotta", price: 50, category: "Parotta", isAvailable: true },
  { id: "55", name: "Chicken Leaf Parotta", price: 150, category: "Parotta", isAvailable: true },

  // NOODLES
  { id: "56", name: "Chicken Noodles", price: 100, category: "Noodles", isAvailable: true },
  { id: "57", name: "Veg Noodles", price: 70, category: "Noodles", isAvailable: true },
  { id: "58", name: "Egg Noodles", price: 80, category: "Noodles", isAvailable: true },
  { id: "59", name: "Gobi Noodles", price: 90, category: "Noodles", isAvailable: true },
  { id: "60", name: "Mushroom Noodles", price: 100, category: "Noodles", isAvailable: true },
  { id: "61", name: "Panner Noodles", price: 100, category: "Noodles", isAvailable: true },

  // FRIED RICE
  { id: "62", name: "Chicken Rice", price: 100, category: "Fried Rice", isAvailable: true },
  { id: "63", name: "Egg Rice", price: 80, category: "Fried Rice", isAvailable: true },
  { id: "64", name: "Jeera Rice", price: 90, category: "Fried Rice", isAvailable: true },
  { id: "65", name: "Gobi Rice", price: 90, category: "Fried Rice", isAvailable: true },
  { id: "66", name: "Veg Rice", price: 70, category: "Fried Rice", isAvailable: true },
  { id: "67", name: "Mushroom Rice", price: 100, category: "Fried Rice", isAvailable: true },
  { id: "68", name: "Panner Rice", price: 100, category: "Fried Rice", isAvailable: true },

  // VEG GRAVY
  { id: "69", name: "Mushroom Gravy", price: 120, category: "Veg Gravy", isAvailable: true },
  { id: "70", name: "Panner Butter Masala", price: 120, category: "Veg Gravy", isAvailable: true },
  { id: "71", name: "Panner Pepper Fry", price: 120, category: "Veg Gravy", isAvailable: true },

  // CHICKEN GRAVY
  { id: "72", name: "Butter Chicken Gravy", price: 150, category: "Chicken Gravy", isAvailable: true },
  { id: "73", name: "Pallipalayam Chicken Gravy", price: 140, category: "Chicken Gravy", isAvailable: true },
  { id: "74", name: "Pepper Chicken Gravy", price: 140, category: "Chicken Gravy", isAvailable: true },
  { id: "75", name: "Chicken Fry", price: 120, category: "Chicken Gravy", isAvailable: true },
];

export default function Billing() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<BillItem[]>([]);
  // selectedCategory is still present but will be ignored when quickFilter active (Option A)
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');
  const [orderType, setOrderType] = useState<'dine-in' | 'parcel'>('dine-in');
  const [settings, setSettings] = useState<AppSettings | null>(null);

  const { toast } = useToast();
  const user = getCurrentUser();

  const today = new Date().toLocaleDateString("en-GB");
  const [billDate, setBillDate] = useState(today);
  const [manualDate, setManualDate] = useState(false);

  const [billNumber, setBillNumber] = useState("01");

  // --- NEW: quick filter + sort state ---
  // quickFilter: 'all' | 'egg' | 'chicken' | 'paneer'  (overrides category+search)
  const [quickFilter, setQuickFilter] = useState<'all' | 'egg' | 'chicken' | 'paneer'>('all');
  // sortOrder: 'asc' | 'desc' | null
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);

  useEffect(() => {
    loadData();
    loadBillNumber();
  }, []);

  const loadBillNumber = () => {
    const last = getLastBillNumber();
    const next = String(Number(last) + 1).padStart(2, "0");
    setBillNumber(next);
  };

  const loadData = async () => {
    try {
      // we use static menu as requested
      setMenuItems(STATIC_MENU);

      const settingsData = await getSettings();
      setSettings(settingsData || null);

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load menu items',
        variant: 'destructive',
      });
    }
  };

  const categories = ['all', ...Array.from(new Set(menuItems.map(item => item.category)))];

  /* -----------------------------
     FILTERING (Option A behavior)
     If quickFilter !== 'all' -> override category + search
     Otherwise use category + search
     ----------------------------- */
  const applyQuickFilter = (items: MenuItem[]) => {
    if (quickFilter === 'all') return items;

    if (quickFilter === 'egg') {
      return items.filter(i => /egg/i.test(i.name));
    }
    if (quickFilter === 'chicken') {
      return items.filter(i => /chicken/i.test(i.name));
    }
    if (quickFilter === 'paneer' || quickFilter === 'panner') {
      // match both "Panner" and "Paneer" (user uses "Panner" often)
      return items.filter(i => /paneer|panner/i.test(i.name));
    }
    return items;
  };

  const applyCategorySearch = (items: MenuItem[]) => {
    return items.filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  };

  const applySort = (items: MenuItem[]) => {
    if (!sortOrder) return items;
    const copy = [...items];
    copy.sort((a, b) => a.name.localeCompare(b.name));
    if (sortOrder === 'desc') copy.reverse();
    return copy;
  };

  // pipeline: first either quickFilter OR category+search -> then sort
  const filteredItems = applySort(
    quickFilter === 'all'
      ? applyCategorySearch(menuItems)
      : applyQuickFilter(menuItems)
  );

  /* -----------------------------
     CART OPERATIONS (unchanged)
     ----------------------------- */
  const addToCart = (item: MenuItem) => {
    const existingItem = cart.find(cartItem => cartItem.menuItemId === item.id);
    
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.menuItemId === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1, subtotal: (cartItem.quantity + 1) * cartItem.price }
          : cartItem
      ));
    } else {
      setCart([...cart, {
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        subtotal: item.price,
      }]);
    }
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.menuItemId === menuItemId) {
        const newQuantity = item.quantity + delta;
        if (newQuantity <= 0) return item;
        return {
          ...item,
          quantity: newQuantity,
          subtotal: newQuantity * item.price,
        };
      }
      return item;
    }));
  };

  const removeFromCart = (menuItemId: string) => {
    setCart(cart.filter(item => item.menuItemId !== menuItemId));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const cgst = subtotal * (settings?.cgstRate || 2.5) / 100;
    const sgst = subtotal * (settings?.sgstRate || 2.5) / 100;
    const total = subtotal + cgst + sgst;
    
    return { subtotal, cgst, sgst, total };
  };

  const handleSaveBill = async (shouldPrint: boolean = false) => {
    if (cart.length === 0) {
      toast({
        title: 'Empty Cart',
        description: 'Please add items to the cart before saving',
        variant: 'destructive',
      });
      return;
    }

    if (!user || !settings) {
      toast({
        title: 'Error',
        description: 'User or settings not found',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { subtotal, cgst, sgst, total } = calculateTotals();

      const bill: Bill = {
        id: `bill-${Date.now()}`,
        billNumber: billNumber,
        items: cart,
        subtotal,
        cgst,
        sgst,
        total,
        createdBy: user.id,
        createdByName: user.name,
        createdAt: billDate,
        billDate,
        paymentMethod,
        orderType,     // NEW FIELD already supported in types if added
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        syncedToCloud: false,
      };

      await createBill(bill);

      setLastBillNumber(billNumber);

      toast({
        title: 'Bill Saved',
        description: `Bill ${billNumber} saved successfully!`,
      });

      if (shouldPrint) printBill(bill, settings);

      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setPaymentMethod('cash');
      setOrderType('dine-in');   // RESET
      setBillDate(today);
      setManualDate(false);

      loadBillNumber();

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save bill',
        variant: 'destructive',
      });
    }
  };

  const { subtotal, cgst, sgst, total } = calculateTotals();

  /* -----------------------------
     UTILS: Veg/NonVeg badge
     - NonVeg when name contains "chicken" or "egg"
     - Veg otherwise
     ----------------------------- */
  const isNonVegItem = (name: string) => /chicken|egg/i.test(name);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Billing</h1>
          <p className="text-muted-foreground">Create new bills and manage orders</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* MENU SECTION */}
        <div className="lg:col-span-2 space-y-4">

          {/* SEARCH + CATEGORY + DATE + BILL NO */}
          <div className="flex gap-4 items-center">
            <Input
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* DATE BUTTON */}
            <div className="flex items-center gap-2">
              {manualDate ? (
                <Input
                  type="date"
                  value={billDate.split("/").reverse().join("-")}
                  onChange={(e) =>
                    setBillDate(
                      new Date(e.target.value).toLocaleDateString("en-GB")
                    )
                  }
                  className="w-40"
                />
              ) : (
                <span className="text-sm font-semibold">{billDate}</span>
              )}

              {!manualDate ? (
                <Button size="sm" variant="outline" onClick={() => setManualDate(true)}>
                  Change Date
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setManualDate(false);
                    setBillDate(today);
                  }}
                >
                  Auto
                </Button>
              )}
            </div>

            {/* BILL NUMBER MANUAL CHANGE */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Bill No: {billNumber}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const newNo = prompt("Enter Bill Number", billNumber);
                  if (newNo) {
                    const formatted = newNo.padStart(2, "0");
                    setBillNumber(formatted);
                    setLastBillNumber(String(Number(formatted) - 1).padStart(2, "0"));
                  }
                }}
              >
                Change
              </Button>
            </div>
          </div>

          {/* QUICK FILTER ROW (overrides category+search) */}
          <div className="flex items-center gap-2">
            <Button
              variant={quickFilter === 'all' ? 'default' : 'outline'}
              onClick={() => { setQuickFilter('all'); setSortOrder(null); }}
            >
              All Items
            </Button>

            <Button
              variant={quickFilter === 'egg' ? 'default' : 'outline'}
              onClick={() => { setQuickFilter('egg'); setSortOrder(null); }}
            >
              Egg Items
            </Button>

            <Button
              variant={quickFilter === 'chicken' ? 'default' : 'outline'}
              onClick={() => { setQuickFilter('chicken'); setSortOrder(null); }}
            >
              Chicken Items
            </Button>

            <Button
              variant={quickFilter === 'paneer' ? 'default' : 'outline'}
              onClick={() => { setQuickFilter('paneer'); setSortOrder(null); }}
            >
              Paneer Items
            </Button>

            <div className="ml-4 flex items-center gap-2">
              <Button
                variant={sortOrder === 'asc' ? 'default' : 'outline'}
                onClick={() => setSortOrder('asc')}
              >
                A → Z
              </Button>

              <Button
                variant={sortOrder === 'desc' ? 'default' : 'outline'}
                onClick={() => setSortOrder('desc')}
              >
                Z → A
              </Button>
            </div>
          </div>

          {/* MENU CARDS — COMPACT VERSION */}
          <div className="grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {filteredItems.map(item => (
              <Card
                key={item.id}
                className="cursor-pointer hover:shadow-md transition-all duration-150 relative"
                onClick={() => addToCart(item)}
              >
                <CardContent className="p-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm leading-tight">{item.name}</h3>

                    {/* Veg / Non-Veg label */}
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 800,
                        background: isNonVegItem(item.name) ? '#FCA5A5' : '#BBF7D0',
                        color: isNonVegItem(item.name) ? '#7F1D1D' : '#064E3B',
                      }}
                    >
                      {isNonVegItem(item.name) ? 'Non-Veg' : 'Veg'}
                    </span>
                  </div>

                  <p className="text-xs text-primary font-bold mt-1">
                    {settings?.currency || '₹'}{item.price}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CART */}
        <div className="space-y-4">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Current Order
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {cart.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Cart is empty. Add items from the menu.
                </p>
              ) : (
                <>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {cart.map(item => (
                      <div key={item.menuItemId} className="flex items-center gap-2 p-2 rounded bg-muted">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {settings?.currency || '₹'}{item.price} × {item.quantity}
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => updateQuantity(item.menuItemId, -1)}>
                            <Minus className="h-4 w-4" />
                          </Button>

                          <span className="w-8 text-center font-semibold">{item.quantity}</span>

                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => updateQuantity(item.menuItemId, 1)}>
                            <Plus className="h-4 w-4" />
                          </Button>

                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeFromCart(item.menuItemId)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="font-bold">
                          {settings?.currency || '₹'}{item.subtotal.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 border-t pt-4">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span className="font-semibold">{settings?.currency || '₹'}{subtotal.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span>CGST ({settings?.cgstRate || 2.5}%)</span>
                      <span className="font-semibold">{settings?.currency || '₹'}{cgst.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span>SGST ({settings?.sgstRate || 2.5}%)</span>
                      <span className="font-semibold">{settings?.currency || '₹'}{sgst.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total</span>
                      <span className="text-primary">{settings?.currency || '₹'}{total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Customer Name (Optional)</Label>
                      <Input
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Enter customer name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Phone (Optional)</Label>
                      <Input
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Enter phone number"
                      />
                    </div>

                    {/* PAYMENT METHOD */}
                    <div className="space-y-2">
                      <Label>Payment Method</Label>
                      <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* NEW: DINE-IN OR PARCEL */}
                    <div className="space-y-2">
                      <Label>Order Type</Label>
                      <Select value={orderType} onValueChange={(value: any) => setOrderType(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dine-in">Dine-In</SelectItem>
                          <SelectItem value="parcel">Parcel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1" variant="outline" onClick={() => handleSaveBill(false)}>
                      <Receipt className="mr-2 h-4 w-4" />
                      Save
                    </Button>

                    <Button className="flex-1" onClick={() => handleSaveBill(true)}>
                      <Printer className="mr-2 h-4 w-4" />
                      Save & Print
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

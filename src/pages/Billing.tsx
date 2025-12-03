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
import { createBill, getSettings, getAllMenuItems, getBillById } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { MenuItem, BillItem, Bill, AppSettings } from '@/types';
import { Plus, Minus, Trash2, ShoppingCart, Printer, Receipt, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { printBill } from '@/lib/print';
import { getLastBillNumber, setLastBillNumber } from '@/lib/billCounter';

export default function Billing() {

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<BillItem[]>([]);
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

  // Quick Filters
  const [quickFilter, setQuickFilter] =
    useState<'all' | 'egg' | 'chicken' | 'paneer' | 'favorite'>('all');

  // Sorting
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);

  /* ----------------------- LOAD DATA + CHECK EDIT MODE ----------------------- */
  useEffect(() => {
    loadData();
    loadBillNumber();

    // CHECK FOR EDIT MODE (From Reports.tsx)
    const raw = localStorage.getItem("editBill");
    if (raw) {
      const bill = JSON.parse(raw);
      loadEditBill(bill);
    }

  }, []);

  /* ------------------------- APPLY EDIT BILL DATA ------------------------- */
  const loadEditBill = (bill: any) => {
    if (!bill) return;

    // RESTORE CART
    const restoredCart = bill.items.map((i: any) => ({
      menuItemId: i.menuItemId,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      subtotal: i.subtotal,
    }));
    setCart(restoredCart);

    // RESTORE BILL FIELDS
    setCustomerName(bill.customerName || "");
    setCustomerPhone(bill.customerPhone || "");
    setPaymentMethod(bill.paymentMethod || "cash");
    setOrderType(bill.orderType || "dine-in");

    setBillDate(bill.billDate);
    setManualDate(true);

    // BILL NUMBER (Keep same)
    setBillNumber(bill.billNumber);
    setLastBillNumber(String(Number(bill.billNumber) - 1).padStart(2, "0"));

    // Clear storage so refresh doesn’t repeat
    localStorage.removeItem("editBill");
  };

  /* ----------------------------- BILL NUMBER ----------------------------- */
  const loadBillNumber = () => {
    const last = getLastBillNumber();
    const next = String(Number(last) + 1).padStart(2, "0");
    setBillNumber(next);
  };

  /* ----------------------------- LOAD MENU ----------------------------- */
  const loadData = async () => {
    try {
      const items = await getAllMenuItems();  
      setMenuItems(items);

      const settingsData = await getSettings();
      setSettings(settingsData || null);

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    }
  };

  const categories = ['all', ...Array.from(new Set(menuItems.map(item => item.category)))];

  /* ----------------------------- FILTERS ----------------------------- */
  const applyQuickFilter = (items: MenuItem[]) => {

    if (quickFilter === 'favorite') {
      return items.filter(i => i.isFavorite === true);
    }

    if (quickFilter === 'egg') {
      return items.filter(i => /egg/i.test(i.name));
    }

    if (quickFilter === 'chicken') {
      return items.filter(i => /chicken/i.test(i.name));
    }

    if (quickFilter === 'paneer' || quickFilter === 'panner') {
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

    const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));
    if (sortOrder === 'desc') sorted.reverse();
    return sorted;
  };

  const filteredItems = applySort(
    quickFilter === 'all'
      ? applyCategorySearch(menuItems)
      : applyQuickFilter(menuItems)
  );

  /* ----------------------------- CART METHODS ----------------------------- */
  const addToCart = (item: MenuItem) => {
    const existing = cart.find(i => i.menuItemId === item.id);

    if (existing) {
      setCart(cart.map(i =>
        i.menuItemId === item.id
          ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.price }
          : i
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

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(i => {
      if (i.menuItemId === id) {
        const newQty = i.quantity + delta;
        if (newQty <= 0) return i;
        return { ...i, quantity: newQty, subtotal: newQty * i.price };
      }
      return i;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(i => i.menuItemId !== id));
  };

  /* ----------------------------- TOTALS ----------------------------- */
  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const cgst = subtotal * (settings?.cgstRate || 2.5) / 100;
    const sgst = subtotal * (settings?.sgstRate || 2.5) / 100;
    const total = subtotal + cgst + sgst;
    return { subtotal, cgst, sgst, total };
  };

  /* ----------------------------- SAVE BILL ----------------------------- */
  const handleSaveBill = async (shouldPrint = false) => {
    if (cart.length === 0) {
      toast({ title: 'Cart Empty', description: 'Add items first', variant: 'destructive' });
      return;
    }

    if (!user || !settings) {
      toast({ title: 'Error', description: 'Settings missing', variant: 'destructive' });
      return;
    }

    try {
      const { subtotal, cgst, sgst, total } = calculateTotals();

      const bill: Bill = {
        id: `bill-${Date.now()}`,
        billNumber,
        items: cart,
        subtotal,
        cgst,
        sgst,
        total,
        createdBy: user.id,
        createdByName: user.name,
        billDate,
        createdAt: billDate,
        paymentMethod,
        orderType,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        syncedToCloud: false,
      };

      await createBill(bill);
      setLastBillNumber(billNumber);

      toast({ title: 'Saved', description: `Bill ${billNumber} saved` });

      if (shouldPrint) printBill(bill, settings);

      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setPaymentMethod('cash');
      setOrderType('dine-in');
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

  /* ----------------------------- VEG BADGE ----------------------------- */
  const isNonVegItem = (name: string, vegType?: string) =>
    vegType === 'nonveg' || /chicken|egg/i.test(name);

  /* ----------------------------- UI ----------------------------- */
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-4xl font-bold">Billing</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* MENU SECTION */}
        <div className="lg:col-span-2 space-y-4">

          {/* SEARCH + CATEGORY + DATE + BILL NUMBER */}
          <div className="flex gap-4 items-center">

            {/* SMALL SEARCH */}
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-40"
            />

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* DATE CONTROLS */}
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
                  className="w-36"
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

            {/* BILL NUMBER */}
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

          {/* QUICK FILTERS */}
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

            <Button
              variant={quickFilter === 'favorite' ? 'default' : 'outline'}
              onClick={() => { setQuickFilter('favorite'); setSortOrder(null); }}
              className="flex gap-2"
            >
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-600" />
              Favorites
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

          {/* MENU GRID */}
          <div className="grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {filteredItems.map(item => (
              <Card
                key={item.id}
                className="cursor-pointer hover:shadow-md transition-all duration-150 relative"
                onClick={() => addToCart(item)}
              >
                <CardContent className="p-2">
                  <div className="flex items-center justify-between">

                    <h3 className="font-semibold text-sm leading-tight flex gap-1 items-center">
                      {item.name}
                      {item.isFavorite && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </h3>

                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 800,
                        background: isNonVegItem(item.name, item.vegType)
                          ? '#FCA5A5'
                          : '#BBF7D0',
                        color: isNonVegItem(item.name, item.vegType)
                          ? '#7F1D1D'
                          : '#064E3B',
                      }}
                    >
                      {isNonVegItem(item.name, item.vegType) ? 'Non-Veg' : 'Veg'}
                    </span>

                  </div>

                  <p className="text-xs text-primary font-bold mt-1">
                    ₹{item.price}
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
                  Cart is empty
                </p>
              ) : (
                <>
                  <div className="space-y-2 max-h-64 overflow-y-auto">

                    {cart.map(item => (
                      <div key={item.menuItemId} className="flex items-center gap-2 p-2 rounded bg-muted">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            ₹{item.price} × {item.quantity}
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8"
                            onClick={() => updateQuantity(item.menuItemId, -1)}>
                            <Minus className="h-4 w-4" />
                          </Button>

                          <span className="w-8 text-center font-semibold">{item.quantity}</span>

                          <Button size="icon" variant="ghost" className="h-8 w-8"
                            onClick={() => updateQuantity(item.menuItemId, 1)}>
                            <Plus className="h-4 w-4" />
                          </Button>

                          <Button size="icon" variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeFromCart(item.menuItemId)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="font-bold">
                          ₹{item.subtotal.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 border-t pt-4">

                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span>CGST ({settings?.cgstRate || 2.5}%)</span>
                      <span className="font-semibold">₹{cgst.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span>SGST ({settings?.sgstRate || 2.5}%)</span>
                      <span className="font-semibold">₹{sgst.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total</span>
                      <span className="text-primary">₹{total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-3">

                    <div className="space-y-2">
                      <Label>Customer Name</Label>
                      <Input
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Payment Method</Label>
                      <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Order Type</Label>
                      <Select value={orderType} onValueChange={(v) => setOrderType(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
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

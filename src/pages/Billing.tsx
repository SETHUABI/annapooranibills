import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

import {
  getAllMenuItems,
  createBill,
  getSettings,
} from "@/lib/db";

import { getCurrentUser } from "@/lib/auth";
import { MenuItem, BillItem, Bill, AppSettings } from "@/types";
import { ShoppingCart, Minus, Plus, Trash2, Printer, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { printBill } from "@/lib/print";

import { getLastBillNumber, setLastBillNumber } from "@/lib/billCounter";


/* -------------------------------------------------------------------------- */
/*                          FIXED CATEGORY ORDER LIST                         */
/* -------------------------------------------------------------------------- */
const CATEGORY_ORDER = [
  "TIFFEN",
  "DOSA",
  "BIRYANI",
  "FRIED RICE",
  "PAROTTA",
  "NOODLES",
  "GOBI STARTERS",
  "MUSHROOM STARTERS",
  "VEG GRAVY",
  "CHILLY SPECIAL",
  "EGG ITEMS",
  "CHICKEN GRAVY",
];


export default function Billing() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<BillItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [billDate, setBillDate] = useState(
    new Date().toLocaleDateString("en-GB")
  );
  const [manualDate, setManualDate] = useState(false);

  const [billNumber, setBillNumber] = useState("01");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const [settings, setSettings] = useState<AppSettings | null>(null);

  const user = getCurrentUser();
  const { toast } = useToast();


  /* -------------------------------------------------------------------------- */
  /*                                     LOAD                                    */
  /* -------------------------------------------------------------------------- */

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
      const [items, settingsData] = await Promise.all([
        getAllMenuItems(),
        getSettings(),
      ]);

      setMenuItems(items.filter((x) => x.isAvailable));
      setSettings(settingsData || null);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load menu items",
        variant: "destructive",
      });
    }
  };


  /* -------------------------------------------------------------------------- */
  /*                           CATEGORY GROUPING LOGIC                           */
  /* -------------------------------------------------------------------------- */

  // unique categories from DB
  const dbCategories = Array.from(new Set(menuItems.map((x) => x.category)));

  // final sorted list
  const sortedCategories = [
    "all",
    ...CATEGORY_ORDER.filter((x) => dbCategories.includes(x)),
    ...dbCategories.filter((x) => !CATEGORY_ORDER.includes(x)),
  ];

  // filter menu items
  const filtered = menuItems.filter((item) => {
    const matchCat =
      selectedCategory === "all" || item.category === selectedCategory;
    const matchSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // group by category
  const grouped = sortedCategories
    .filter((cat) => cat !== "all")
    .map((category) => ({
      category,
      items: filtered.filter((x) => x.category === category),
    }));


  /* -------------------------------------------------------------------------- */
  /*                                CART ACTIONS                                */
  /* -------------------------------------------------------------------------- */

  const addToCart = (item: MenuItem) => {
    const found = cart.find((x) => x.menuItemId === item.id);

    if (found) {
      setCart(
        cart.map((x) =>
          x.menuItemId === item.id
            ? {
                ...x,
                quantity: x.quantity + 1,
                subtotal: (x.quantity + 1) * x.price,
              }
            : x
        )
      );
    } else {
      setCart([
        ...cart,
        {
          menuItemId: item.id,
          name: item.name,
          quantity: 1,
          price: item.price,
          subtotal: item.price,
        },
      ]);
    }
  };

  const updateQty = (id: string, delta: number) => {
    setCart(
      cart.map((x) => {
        if (x.menuItemId === id) {
          const qty = x.quantity + delta;
          if (qty <= 0) return x;
          return { ...x, quantity: qty, subtotal: qty * x.price };
        }
        return x;
      })
    );
  };

  const removeItem = (id: string) => {
    setCart(cart.filter((x) => x.menuItemId !== id));
  };


  /* -------------------------------------------------------------------------- */
  /*                                  SAVE BILL                                 */
  /* -------------------------------------------------------------------------- */

  const totals = () => {
    const subtotal = cart.reduce((s, x) => s + x.subtotal, 0);
    const cgst = subtotal * (settings?.cgstRate || 2.5) / 100;
    const sgst = subtotal * (settings?.sgstRate || 2.5) / 100;
    return { subtotal, cgst, sgst, total: subtotal + cgst + sgst };
  };

  const handleSave = async (print = false) => {
    if (cart.length === 0)
      return toast({
        title: "Empty Cart",
        description: "Add items before saving",
        variant: "destructive",
      });

    if (!settings || !user)
      return toast({
        title: "Error",
        description: "Settings or user missing",
        variant: "destructive",
      });

    const t = totals();

    const bill: Bill = {
      id: `bill-${Date.now()}`,
      billNumber,
      createdBy: user.id,
      createdByName: user.name,
      createdAt: billDate,
      billDate,
      paymentMethod,
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      syncedToCloud: false,
      ...t,
      items: cart,
    };

    await createBill(bill);
    setLastBillNumber(billNumber);

    if (print) printBill(bill, settings);

    toast({ title: "Success", description: "Bill saved" });

    // reset
    setCart([]);
    loadBillNumber();
  };


  /* -------------------------------------------------------------------------- */
  /*                                    UI                                      */
  /* -------------------------------------------------------------------------- */

  const { subtotal, cgst, sgst, total } = totals();

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-4xl font-bold">Billing</h1>

      {/* SEARCH + CATEGORY */}
      <div className="flex gap-4">
        <Input
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortedCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat === "all" ? "All Categories" : cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT: MENU */}
        <div className="lg:col-span-2 space-y-6">
          {grouped.map(({ category, items }) =>
            items.length === 0 ? null : (
              <div key={category} className="space-y-3">
                <h2 className="text-2xl font-bold">{category}</h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {items.map((item) => (
                    <Card
                      key={item.id}
                      className="cursor-pointer hover:shadow"
                      onClick={() => addToCart(item)}
                    >
                      <CardContent className="p-2">
                        <p className="font-semibold text-sm">{item.name}</p>
                        <p className="text-xs text-primary font-bold">
                          ₹{item.price}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          )}
        </div>

        {/* RIGHT: CART */}
        <Card className="space-y-3 p-4 sticky top-4 h-fit">
          <CardTitle className="flex items-center gap-2 mb-4">
            <ShoppingCart className="h-5 w-5" /> Current Order
          </CardTitle>

          {cart.length === 0 ? (
            <p className="text-muted-foreground text-center">Cart is empty</p>
          ) : (
            <>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {cart.map((item) => (
                  <div
                    key={item.menuItemId}
                    className="flex items-center justify-between bg-muted p-2 rounded"
                  >
                    <div>
                      <p className="font-semibold text-sm">{item.name}</p>
                      <p className="text-xs">
                        ₹{item.price} × {item.quantity}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => updateQty(item.menuItemId, -1)}>
                        <Minus />
                      </Button>
                      <span className="font-bold">{item.quantity}</span>
                      <Button size="icon" variant="ghost" onClick={() => updateQty(item.menuItemId, 1)}>
                        <Plus />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => removeItem(item.menuItemId)}>
                        <Trash2 />
                      </Button>
                    </div>

                    <div className="font-bold">₹{item.subtotal.toFixed(0)}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-1 border-t pt-3">
                <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(0)}</span></div>
                <div className="flex justify-between"><span>CGST</span><span>₹{cgst.toFixed(0)}</span></div>
                <div className="flex justify-between"><span>SGST</span><span>₹{sgst.toFixed(0)}</span></div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total</span><span>₹{total.toFixed(0)}</span>
                </div>
              </div>

              <div>
                <Label>Customer</Label>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="mb-2" />

                <Label>Phone</Label>
                <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="mb-2" />

                <Label>Payment</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 mt-4">
                <Button className="flex-1" variant="outline" onClick={() => handleSave(false)}>
                  <Receipt className="mr-2" /> Save
                </Button>
                <Button className="flex-1" onClick={() => handleSave(true)}>
                  <Printer className="mr-2" /> Save & Print
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

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
import { getAllMenuItems, createBill, getLastBillNumber, getSettings } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { MenuItem, BillItem, Bill, AppSettings } from '@/types';
import { Plus, Minus, Trash2, ShoppingCart, Printer, Receipt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { printBill } from '@/lib/print';

export default function Billing() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<BillItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const { toast } = useToast();
  const user = getCurrentUser();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [items, settingsData] = await Promise.all([
        getAllMenuItems(),
        getSettings(),
      ]);
      setMenuItems(items.filter(item => item.isAvailable));
      setSettings(settingsData || null);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load menu items',
        variant: 'destructive',
      });
    }
  };

  const categories = ['all', ...Array.from(new Set(menuItems.map(item => item.category)))];

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
      const billNumber = await getLastBillNumber();
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
        createdAt: new Date().toISOString(),
        paymentMethod,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        syncedToCloud: false,
      };

      await createBill(bill);

      toast({
        title: 'Bill Saved',
        description: `Bill ${billNumber} saved successfully!`,
      });

      if (shouldPrint) {
        printBill(bill, settings);
      }

      // Reset form
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setPaymentMethod('cash');
    } catch (error) {
      console.error('Failed to save bill:', error);
      toast({
        title: 'Error',
        description: 'Failed to save bill',
        variant: 'destructive',
      });
    }
  };

  const { subtotal, cgst, sgst, total } = calculateTotals();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Billing</h1>
          <p className="text-muted-foreground">Create new bills and manage orders</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Menu Items Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-4">
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
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredItems.map(item => (
              <Card
                key={item.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                onClick={() => addToCart(item)}
              >
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{item.category}</p>
                  <p className="text-2xl font-bold text-primary">
                    {settings?.currency || '₹'}{item.price}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cart Section */}
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
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.menuItemId, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-semibold">{item.quantity}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.menuItemId, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeFromCart(item.menuItemId)}
                          >
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
                      <Label htmlFor="customer-name">Customer Name (Optional)</Label>
                      <Input
                        id="customer-name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Enter customer name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customer-phone">Phone (Optional)</Label>
                      <Input
                        id="customer-phone"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment-method">Payment Method</Label>
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
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      variant="outline"
                      onClick={() => handleSaveBill(false)}
                    >
                      <Receipt className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => handleSaveBill(true)}
                    >
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

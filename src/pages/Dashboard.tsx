import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllBills, getAllMenuItems } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { Receipt, UtensilsCrossed, TrendingUp, DollarSign } from 'lucide-react';
import { Bill, MenuItem } from '@/types';

export default function Dashboard() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const user = getCurrentUser();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [billsData, menuData] = await Promise.all([
        getAllBills(),
        getAllMenuItems(),
      ]);
      setBills(billsData);
      setMenuItems(menuData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // FIXED: USE DD/MM/YYYY (matches Billing screen)
  const today = new Date().toLocaleDateString("en-GB");

  // FIXED: Exact match since bills save date as "DD/MM/YYYY"
  const todaysBills = bills.filter(bill => bill.createdAt === today);

  const todaysSales = todaysBills.reduce((sum, bill) => sum + bill.total, 0);
  const totalSales = bills.reduce((sum, bill) => sum + bill.total, 0);
  const availableItems = menuItems.filter(item => item.isAvailable).length;

  const stats = [
    {
      title: "Today's Sales",
      value: `₹${todaysSales.toFixed(2)}`,
      icon: DollarSign,
      description: `${todaysBills.length} bills today`,
      color: 'text-primary',
    },
    {
      title: 'Total Bills',
      value: bills.length,
      icon: Receipt,
      description: 'All time',
      color: 'text-blue-500',
    },
    {
      title: 'Menu Items',
      value: availableItems,
      icon: UtensilsCrossed,
      description: `${availableItems} available`,
      color: 'text-green-500',
    },
    {
      title: 'Total Revenue',
      value: `₹${totalSales.toFixed(2)}`,
      icon: TrendingUp,
      description: 'All time sales',
      color: 'text-purple-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.name}!</h1>
        <p className="text-muted-foreground text-lg">
          Here's your restaurant overview for today
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card
            key={stat.title}
            className="card-elevated hover:scale-105 transition-transform duration-200"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Recent Bills</CardTitle>
          </CardHeader>
          <CardContent>
            {todaysBills.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No bills today yet. Start billing!
              </p>
            ) : (
              <div className="space-y-4">
                {todaysBills.slice(0, 5).map((bill) => (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-semibold">{bill.billNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {bill.createdAt}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">₹{bill.total.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        {bill.items.length} items
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <a
              href="/billing"
              className="block p-4 rounded-lg bg-primary text-primary-foreground hover:brightness-110 transition-all font-semibold text-center"
            >
              Start New Bill
            </a>
            {user?.role === 'admin' && (
              <>
                <a
                  href="/menu"
                  className="block p-4 rounded-lg bg-secondary text-secondary-foreground hover:brightness-110 transition-all font-semibold text-center"
                >
                  Manage Menu
                </a>
                <a
                  href="/reports"
                  className="block p-4 rounded-lg bg-muted hover:bg-muted/80 transition-all font-semibold text-center"
                >
                  View Reports
                </a>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

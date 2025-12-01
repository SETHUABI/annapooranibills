import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getSettings, saveSettings, getAllMenuItems, getAllBills } from '@/lib/db';
import { AppSettings } from '@/types';
import { Save, Download, Moon, Sun } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportDataBackup } from '@/lib/export';

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>({
    shopName: 'My Restaurant',
    shopAddress: '',
    shopGST: '',
    cgstRate: 2.5,
    sgstRate: 2.5,
    printerFormat: '80mm',
    theme: 'dark',
    autoSync: false,
    currency: '₹',
  });
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
    // Apply theme
    const theme = localStorage.getItem('theme') || 'dark';
    setIsDarkMode(theme === 'dark');
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      if (data) {
        setSettings(data);
        setIsDarkMode(data.theme === 'dark');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSave = async () => {
    try {
      await saveSettings({
        ...settings,
        id: 'settings-1',
      });
      
      // Apply theme
      document.documentElement.classList.toggle('dark', settings.theme === 'dark');
      localStorage.setItem('theme', settings.theme);
      
      toast({
        title: 'Success',
        description: 'Settings saved successfully',
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    }
  };

  const handleThemeToggle = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(!isDarkMode);
    setSettings({ ...settings, theme: newTheme });
  };

  const handleBackup = async () => {
    try {
      const [bills, menuItems] = await Promise.all([
        getAllBills(),
        getAllMenuItems(),
      ]);
      exportDataBackup(bills, menuItems, `pos-backup-${Date.now()}.json`);
      toast({
        title: 'Success',
        description: 'Backup created successfully',
      });
    } catch (error) {
      console.error('Failed to create backup:', error);
      toast({
        title: 'Error',
        description: 'Failed to create backup',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure your POS system</p>
        </div>
        <Button onClick={handleSave} size="lg">
          <Save className="mr-2 h-5 w-5" />
          Save Settings
        </Button>
      </div>

      <Tabs defaultValue="shop" className="space-y-6">
        <TabsList>
          <TabsTrigger value="shop">Shop Info</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>

        <TabsContent value="shop" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shop Information</CardTitle>
              <CardDescription>
                This information will appear on printed bills
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shop-name">Shop Name *</Label>
                <Input
                  id="shop-name"
                  value={settings.shopName}
                  onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
                  placeholder="Enter shop name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shop-address">Shop Address</Label>
                <Textarea
                  id="shop-address"
                  value={settings.shopAddress}
                  onChange={(e) => setSettings({ ...settings, shopAddress: e.target.value })}
                  placeholder="Enter complete address"
                  rows={3}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shop-gst">GST Number</Label>
                  <Input
                    id="shop-gst"
                    value={settings.shopGST}
                    onChange={(e) => setSettings({ ...settings, shopGST: e.target.value })}
                    placeholder="GSTIN"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shop-phone">Phone Number</Label>
                  <Input
                    id="shop-phone"
                    value={settings.shopPhone || ''}
                    onChange={(e) => setSettings({ ...settings, shopPhone: e.target.value })}
                    placeholder="Contact number"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shop-email">Email</Label>
                <Input
                  id="shop-email"
                  type="email"
                  value={settings.shopEmail || ''}
                  onChange={(e) => setSettings({ ...settings, shopEmail: e.target.value })}
                  placeholder="shop@example.com"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tax Configuration</CardTitle>
              <CardDescription>
                Configure GST rates for billing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cgst">CGST Rate (%)</Label>
                  <Input
                    id="cgst"
                    type="number"
                    step="0.1"
                    value={settings.cgstRate}
                    onChange={(e) => setSettings({ ...settings, cgstRate: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sgst">SGST Rate (%)</Label>
                  <Input
                    id="sgst"
                    type="number"
                    step="0.1"
                    value={settings.sgstRate}
                    onChange={(e) => setSettings({ ...settings, sgstRate: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency Symbol</Label>
                <Input
                  id="currency"
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  placeholder="₹"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Printer Settings</CardTitle>
              <CardDescription>
                Configure thermal printer format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="printer-format">Printer Format</Label>
                <Select
                  value={settings.printerFormat}
                  onValueChange={(value: '58mm' | '80mm') => setSettings({ ...settings, printerFormat: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="58mm">58mm (Small)</SelectItem>
                    <SelectItem value="80mm">80mm (Standard)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme Settings</CardTitle>
              <CardDescription>
                Customize the appearance of your POS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Toggle between light and dark theme
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  <Switch checked={isDarkMode} onCheckedChange={handleThemeToggle} />
                  <Moon className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Backup</CardTitle>
              <CardDescription>
                Export your data for backup purposes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Download a complete backup of all bills and menu items in JSON format.
                This can be used to restore your data if needed.
              </p>
              <Button onClick={handleBackup} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download Backup
              </Button>
            </CardContent>
          </Card>

          <Card>
  <CardHeader>
    <CardTitle>Cloud Sync</CardTitle>
    <CardDescription>
      Sync your bills automatically to Google Sheets every month
    </CardDescription>
  </CardHeader>

  <CardContent className="space-y-4">

    {/* GOOGLE SCRIPT URL */}
    <div className="space-y-2">
      <Label htmlFor="sheets-url">Google Sheets Script URL</Label>
      <Input
        id="sheets-url"
        value={settings.googleSheetsUrl || ''}
        onChange={(e) =>
          setSettings({ ...settings, googleSheetsUrl: e.target.value })
        }
        placeholder="Paste Google Script Web App URL here"
      />
    </div>

    {/* AUTO SYNC SWITCH */}
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label>Enable Auto Sync</Label>
        <p className="text-sm text-muted-foreground">
          When enabled, new bills are pushed to Google Sheets automatically
        </p>
      </div>

      <Switch
        checked={settings.autoSync}
        onCheckedChange={(checked) =>
          setSettings({ ...settings, autoSync: checked })
        }
      />
    </div>

    <p className="text-xs text-muted-foreground">
      Requires a Google Apps Script Web App linked to a Google Sheet.
      Your POS will automatically create monthly sheets like 2025_Dec.
    </p>
  </CardContent>
</Card>

        </TabsContent>
      </Tabs>
    </div>
  );
}

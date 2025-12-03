import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  getAllMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from '@/lib/db';
import { MenuItem } from '@/types';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Menu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    isAvailable: true,
    isFavorite: false,      // NEW
    vegType: 'veg',         // NEW
  });

  const { toast } = useToast();

  useEffect(() => {
    loadMenuItems();
  }, []);

  const loadMenuItems = async () => {
    try {
      const items = await getAllMenuItems();
      setMenuItems(items);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load menu items',
        variant: 'destructive',
      });
    }
  };

  const filteredItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenDialog = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        price: item.price.toString(),
        category: item.category,
        description: item.description || '',
        isAvailable: item.isAvailable,
        isFavorite: item.isFavorite || false,
        vegType: item.vegType || 'veg',
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        price: '',
        category: '',
        description: '',
        isAvailable: true,
        isFavorite: false,
        vegType: 'veg',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price || !formData.category) {
      toast({
        title: 'Validation Error',
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingItem) {
        const updatedItem: MenuItem = {
          ...editingItem,
          name: formData.name,
          price: parseFloat(formData.price),
          category: formData.category,
          description: formData.description,
          isAvailable: formData.isAvailable,
          isFavorite: formData.isFavorite,
          vegType: formData.vegType,
          updatedAt: new Date().toISOString(),
        };
        await updateMenuItem(updatedItem);
      } else {
        const newItem: MenuItem = {
          id: `menu-${Date.now()}`,
          name: formData.name,
          price: parseFloat(formData.price),
          category: formData.category,
          description: formData.description,
          isAvailable: formData.isAvailable,
          isFavorite: formData.isFavorite,
          vegType: formData.vegType,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await createMenuItem(newItem);
      }

      setIsDialogOpen(false);
      loadMenuItems();

      toast({
        title: 'Success',
        description: editingItem ? 'Menu item updated' : 'Menu item added',
      });

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save item',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await deleteMenuItem(id);
      toast({ title: 'Item deleted' });
      loadMenuItems();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete',
        variant: 'destructive',
      });
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      await updateMenuItem({
        ...item,
        isAvailable: !item.isAvailable,
        updatedAt: new Date().toISOString(),
      });
      loadMenuItems();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update availability',
        variant: 'destructive',
      });
    }
  };

  const categories = Array.from(new Set(menuItems.map(item => item.category)));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Menu Management</h1>
          <p className="text-muted-foreground">Manage your restaurant menu items</p>
        </div>

        {/* ADD ITEM */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-5 w-5" />
              Add Item
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">

              {/* NAME */}
              <div className="space-y-2">
                <Label>Item Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* PRICE + CATEGORY */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price *</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    list="categories"
                  />
                  <datalist id="categories">
                    {categories.map(cat => <option key={cat} value={cat} />)}
                  </datalist>
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* VEG / NON-VEG */}
              <div className="space-y-2">
                <Label>Veg / Non-Veg</Label>
                <div className="flex gap-2">
                  <Button
                    variant={formData.vegType === 'veg' ? 'default' : 'outline'}
                    onClick={() => setFormData({ ...formData, vegType: 'veg' })}
                  >
                    Veg
                  </Button>
                  <Button
                    variant={formData.vegType === 'nonveg' ? 'default' : 'outline'}
                    onClick={() => setFormData({ ...formData, vegType: 'nonveg' })}
                  >
                    Non-Veg
                  </Button>
                </div>
              </div>

              {/* FAVORITE */}
              <div className="flex items-center justify-between">
                <Label>Mark as Favorite</Label>
                <Switch
                  checked={formData.isFavorite}
                  onCheckedChange={(v) => setFormData({ ...formData, isFavorite: v })}
                />
              </div>

              {/* AVAILABLE */}
              <div className="flex items-center justify-between">
                <Label>Available</Label>
                <Switch
                  checked={formData.isAvailable}
                  onCheckedChange={(v) => setFormData({ ...formData, isAvailable: v })}
                />
              </div>

            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingItem ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>

          </DialogContent>
        </Dialog>
      </div>

      {/* SEARCH */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search menu items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* CATEGORY LIST */}
      {categories.map(category => {
        const categoryItems = filteredItems.filter(item => item.category === category);
        if (categoryItems.length === 0) return null;

        return (
          <div key={category} className="space-y-4">
            <h2 className="text-2xl font-bold">{category}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">

              {categoryItems.map(item => (
                <Card key={item.id} className={!item.isAvailable ? 'opacity-60' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">

                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        {item.isFavorite && (
                          <span className="text-yellow-500 text-xl font-bold">★</span>
                        )}
                      </div>

                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">₹{item.price}</span>

                      {/* SHOW VEG / NON-VEG BADGE */}
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          item.vegType === 'veg' ? 'bg-green-300 text-green-900' : 'bg-red-300 text-red-900'
                        }`}
                      >
                        {item.vegType === 'veg' ? 'Veg' : 'Non-Veg'}
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {item.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                        <Switch
                          checked={item.isAvailable}
                          onCheckedChange={() => handleToggleAvailability(item)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

            </div>
          </div>
        );
      })}

      {filteredItems.length === 0 && (
        <Card className="p-12 text-center text-muted-foreground">
          No menu items found
        </Card>
      )}
    </div>
  );
}

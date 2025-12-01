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
      console.error('Failed to load menu items:', error);
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
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        price: '',
        category: '',
        description: '',
        isAvailable: true,
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
          updatedAt: new Date().toISOString(),
        };
        await updateMenuItem(updatedItem);
        toast({
          title: 'Success',
          description: 'Menu item updated successfully',
        });
      } else {
        const newItem: MenuItem = {
          id: `menu-${Date.now()}`,
          name: formData.name,
          price: parseFloat(formData.price),
          category: formData.category,
          description: formData.description,
          isAvailable: formData.isAvailable,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await createMenuItem(newItem);
        toast({
          title: 'Success',
          description: 'Menu item created successfully',
        });
      }
      setIsDialogOpen(false);
      loadMenuItems();
    } catch (error) {
      console.error('Failed to save menu item:', error);
      toast({
        title: 'Error',
        description: 'Failed to save menu item',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await deleteMenuItem(id);
      toast({
        title: 'Success',
        description: 'Menu item deleted successfully',
      });
      loadMenuItems();
    } catch (error) {
      console.error('Failed to delete menu item:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete menu item',
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
      toast({
        title: 'Success',
        description: `Item ${!item.isAvailable ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Failed to toggle availability:', error);
      toast({
        title: 'Error',
        description: 'Failed to update item',
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
              <DialogDescription>
                {editingItem ? 'Update the menu item details' : 'Add a new item to your menu'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter item name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Main Course"
                    list="categories"
                  />
                  <datalist id="categories">
                    {categories.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter item description"
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="available">Available</Label>
                <Switch
                  id="available"
                  checked={formData.isAvailable}
                  onCheckedChange={(checked) => setFormData({ ...formData, isAvailable: checked })}
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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search menu items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

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
                      <div className="flex-1">
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleOpenDialog(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(item.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">₹{item.price}</span>
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
        <Card className="p-12">
          <div className="text-center">
            <p className="text-muted-foreground">No menu items found</p>
          </div>
        </Card>
      )}
    </div>
  );
}

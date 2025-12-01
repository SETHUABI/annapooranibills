import { 
  LayoutDashboard, 
  Receipt, 
  UtensilsCrossed, 
  BarChart3, 
  Settings, 
  LogOut,
  ChefHat
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { logout, getCurrentUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';

const menuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Billing', url: '/billing', icon: Receipt },
  { title: 'Menu', url: '/menu', icon: UtensilsCrossed, adminOnly: true },
  { title: 'Reports', url: '/reports', icon: BarChart3 },
  { title: 'Settings', url: '/settings', icon: Settings, adminOnly: true },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const user = getCurrentUser();
  const isCollapsed = state === 'collapsed';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredItems = menuItems.filter(item => {
    if (item.adminOnly && user?.role !== 'admin') {
      return false;
    }
    return true;
  });

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent>
        {/* Logo/Brand */}
        <div className={`flex items-center gap-3 p-4 border-b border-sidebar-border ${isCollapsed ? 'justify-center' : ''}`}>
          <img src={logo} alt="POS Logo" className="w-8 h-8" />
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sidebar-foreground">RestaurantPOS</span>
              <span className="text-xs text-muted-foreground">{user?.name}</span>
            </div>
          )}
        </div>

        <SidebarGroup>
          {!isCollapsed && <SidebarGroupLabel>Menu</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => {
                const isActive = currentPath === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <NavLink to={item.url} className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={`w-full ${isCollapsed ? 'px-2' : 'justify-start'}`}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span className="ml-3">Logout</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

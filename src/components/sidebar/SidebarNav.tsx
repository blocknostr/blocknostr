
import React from 'react';
import { useLocation } from '@/lib/next-app-router-shim';
import SidebarNavItem from './SidebarNavItem';
import { Separator } from '@/components/ui/separator';
import { 
  Home, MessageSquare, Bell, Bookmark, Settings, 
  Users, Wallet, FileText, Crown, Search
} from 'lucide-react';

interface SidebarNavProps {
  isLoggedIn: boolean;
}

const SidebarNav: React.FC<SidebarNavProps> = ({ isLoggedIn }) => {
  const location = useLocation();
  
  const navigationItems = [
    {
      key: 'home',
      label: 'Home',
      icon: Home,
      href: '/',
      isActive: location.pathname === '/'
    },
    {
      key: 'messages',
      label: 'Messages',
      icon: MessageSquare,
      href: '/messages',
      isActive: location.pathname.startsWith('/messages')
    },
    {
      key: 'notifications',
      label: 'Notifications',
      icon: Bell,
      href: '/notifications',
      isActive: location.pathname.startsWith('/notifications')
    },
    {
      key: 'notebin',
      label: 'Notebin',
      icon: FileText,
      href: '/notebin',
      isActive: location.pathname.startsWith('/notebin'),
      newFeature: true
    },
    {
      key: 'communities',
      label: 'Communities',
      icon: Users,
      href: '/communities',
      isActive: location.pathname.startsWith('/communities')
    },
    {
      key: 'search',
      label: 'Search',
      icon: Search,
      href: '/search',
      isActive: location.pathname === '/search'
    }
  ];
  
  // Secondary navigation items (may require auth)
  const secondaryItems = [
    {
      key: 'wallets',
      label: 'Wallets',
      icon: Wallet,
      href: '/wallets',
      isActive: location.pathname.startsWith('/wallets'),
      requiresAuth: true
    },
    {
      key: 'premium',
      label: 'Premium',
      icon: Crown,
      href: '/premium',
      isActive: location.pathname.startsWith('/premium')
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: Settings,
      href: '/settings',
      isActive: location.pathname.startsWith('/settings')
    }
  ];
  
  return (
    <div className="flex flex-col flex-1 overflow-y-auto py-2">
      <nav className="space-y-1 px-2">
        {navigationItems.map((item) => (
          <SidebarNavItem
            key={item.key}
            icon={item.icon}
            label={item.label}
            path={item.href}
            active={item.isActive}
            newFeature={item.key === 'notebin'}
          />
        ))}
      </nav>
      
      <div className="mt-4">
        <Separator className="my-4 bg-sidebar-border" />
        
        <nav className="space-y-1 px-2">
          {secondaryItems.map((item) => (
            (!item.requiresAuth || (item.requiresAuth && isLoggedIn)) && (
              <SidebarNavItem
                key={item.key}
                icon={item.icon}
                label={item.label}
                path={item.href}
                active={item.isActive}
              />
            )
          ))}
        </nav>
      </div>
    </div>
  );
};

export default SidebarNav;

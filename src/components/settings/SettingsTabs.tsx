
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SettingsTabs = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  
  const tabs = [
    { label: 'Profile', path: '/settings/profile' },
    { label: 'Account', path: '/settings/account' },
    { label: 'Relays', path: '/settings/relays' },
    { label: 'Privacy', path: '/settings/privacy' },
    { label: 'Notifications', path: '/settings/notifications' },
    { label: 'About', path: '/settings/about' },
  ];

  return (
    <Tabs value={currentPath} className="w-full">
      <TabsList className="grid grid-cols-3 md:grid-cols-6">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.path}
            value={tab.path}
            className={isActive(tab.path) ? 'data-[state=active]:bg-muted' : ''}
            asChild
          >
            <NavLink to={tab.path}>{tab.label}</NavLink>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};

export default SettingsTabs;

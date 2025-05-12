
import React from 'react';
import { RelayConnectionMonitor } from './components/RelayConnectionMonitor';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      {children}
      <RelayConnectionMonitor />
    </div>
  );
};

export default Layout;

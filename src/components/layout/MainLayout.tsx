
import React from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      {children}
    </div>
  );
};

export default MainLayout;

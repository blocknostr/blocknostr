
import React from 'react';
import GlobalSearch from '../GlobalSearch';
import Logo from './Logo';
import MobileMenuButton from './MobileMenuButton';
import HeaderActions from './HeaderActions';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {  
  return (
    <header className="sticky top-0 z-40 bg-background border-b h-14 flex items-center px-4">
      <div className="flex items-center w-full max-w-7xl mx-auto justify-between">
        <div className="flex items-center gap-4">
          <MobileMenuButton onClick={toggleSidebar} />
          <Logo />
        </div>
        
        <div className="hidden md:flex flex-1 max-w-sm mx-4">
          <GlobalSearch />
        </div>
        
        <HeaderActions />
      </div>
    </header>
  );
};

export default Header;

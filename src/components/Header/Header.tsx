
import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Search, Bell, MessageSquare } from 'lucide-react';
import { Button } from "@/components/ui/button";
import LoginButton from '../LoginButton';
import GlobalSearch from '../GlobalSearch';
import { nostrService } from '@/lib/nostr';
import HeaderRelayStatus from '../header/HeaderRelayStatus';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header = ({ toggleSidebar }: HeaderProps) => {
  const isLoggedIn = !!nostrService.publicKey;
  
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b h-14 flex items-center px-4">
      <div className="flex items-center w-full max-w-6xl mx-auto justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSidebar}>
            <Menu className="h-5 w-5" />
          </Button>
          
          <Link to="/" className="text-lg font-semibold flex items-center gap-2">
            BlockNoster
          </Link>
        </div>
        
        <div className="hidden md:flex flex-1 max-w-xs mx-4">
          <GlobalSearch />
        </div>
        
        <div className="flex items-center gap-3">
          {isLoggedIn && <HeaderRelayStatus />}
          
          <Button variant="ghost" size="icon" asChild className="md:hidden">
            <Link to="/search">
              <Search className="h-5 w-5" />
            </Link>
          </Button>
          
          {isLoggedIn && (
            <>
              <Button variant="ghost" size="icon" asChild>
                <Link to="/notifications">
                  <Bell className="h-5 w-5" />
                </Link>
              </Button>
              
              <Button variant="ghost" size="icon" asChild>
                <Link to="/messages">
                  <MessageSquare className="h-5 w-5" />
                </Link>
              </Button>
            </>
          )}
          
          <LoginButton />
        </div>
      </div>
    </header>
  );
};

export default Header;

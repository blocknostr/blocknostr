
import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Search, Bell, MessageSquare, BookmarkIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import LoginButton from '../LoginButton';
import GlobalSearch from '../GlobalSearch';
import { nostrService } from '@/lib/nostr';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header = ({ toggleSidebar }: HeaderProps) => {
  const isLoggedIn = !!nostrService.publicKey;
  
  return (
    <header className="sticky top-0 z-40 bg-background border-b h-14 flex items-center px-4">
      <div className="flex items-center w-full max-w-7xl mx-auto justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSidebar}>
            <Menu className="h-5 w-5" />
          </Button>
          
          <Link to="/" className="text-xl font-bold flex items-center gap-2">
            BlockNoster
          </Link>
        </div>
        
        <div className="hidden md:flex flex-1 max-w-sm mx-4">
          <GlobalSearch />
        </div>
        
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <>
              <Button variant="ghost" size="icon" asChild>
                <Link to="/search" className="md:hidden">
                  <Search className="h-5 w-5" />
                </Link>
              </Button>
              
              <Button variant="ghost" size="icon" asChild>
                <Link to="/notifications">
                  <Bell className="h-5 w-5" />
                </Link>
              </Button>

              <Button variant="ghost" size="icon" asChild>
                <Link to="/bookmarks">
                  <BookmarkIcon className="h-5 w-5" />
                </Link>
              </Button>
              
              <Button variant="ghost" size="icon" asChild>
                <Link to="/messages">
                  <MessageSquare className="h-5 w-5" />
                </Link>
              </Button>
            </>
          ) : (
            <LoginButton />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

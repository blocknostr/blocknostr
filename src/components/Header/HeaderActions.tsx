
import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Bell, MessageSquare } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useHapticFeedback } from "@/hooks/use-haptic-feedback";
import LoginButton from '../LoginButton';
import WalletConnectButton from '../wallet/WalletConnectButton';
import { nostrService } from '@/lib/nostr';

const HeaderActions: React.FC = () => {
  const isLoggedIn = !!nostrService.publicKey;
  const { triggerHaptic } = useHapticFeedback();
  
  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-2">
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
          <Link to="/messages">
            <MessageSquare className="h-5 w-5" />
          </Link>
        </Button>
        
        <WalletConnectButton className="hidden sm:block" />
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-2">
      <WalletConnectButton className="hidden sm:block" />
      <LoginButton />
    </div>
  );
};

export default HeaderActions;

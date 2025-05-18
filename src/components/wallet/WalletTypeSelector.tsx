
import React from "react";
import { Check, ChevronDown, Bitcoin, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlephiumLogo } from "@/components/icons/wallets";

export type WalletType = "Bitcoin" | "Alephium" | "Ethereum" | "Solana";

interface WalletTypeSelectorProps {
  selectedWallet: WalletType;
  onSelectWallet: (wallet: WalletType) => void;
  walletConnections?: {[key in WalletType]: boolean};
}

const WalletTypeSelector: React.FC<WalletTypeSelectorProps> = ({
  selectedWallet,
  onSelectWallet,
  walletConnections = {},
}) => {
  const walletTypes: Array<{type: WalletType; icon: React.ReactNode}> = [
    { 
      type: "Bitcoin", 
      icon: <Bitcoin className="h-4 w-4 mr-2 text-orange-500" /> 
    },
    { 
      type: "Alephium", 
      icon: <AlephiumLogo className="h-4 w-4 mr-2" /> 
    },
    { 
      type: "Ethereum", 
      icon: <svg className="h-4 w-4 mr-2 text-blue-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 1.75L5.75 12.25L12 16L18.25 12.25L12 1.75Z" fill="currentColor"/>
        <path d="M12 16L5.75 12.25L12 22.25L18.25 12.25L12 16Z" fill="currentColor" fillOpacity="0.6"/>
      </svg> 
    },
    { 
      type: "Solana", 
      icon: <svg className="h-4 w-4 mr-2 text-purple-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 15.5L16.5 4H19L7.5 15.5H5Z" fill="currentColor"/>
        <path d="M5 8.5L16.5 20H19L7.5 8.5H5Z" fill="currentColor"/>
        <path d="M12 12L5 8.5V15.5L12 12Z" fill="currentColor"/>
      </svg> 
    }
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          {walletTypes.find(w => w.type === selectedWallet)?.icon}
          <span>{selectedWallet}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {walletTypes.map(({ type, icon }) => (
          <DropdownMenuItem
            key={type}
            onClick={() => onSelectWallet(type)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center">
              {icon}
              {type}
              {walletConnections[type] && (
                <span className="ml-2 h-2 w-2 rounded-full bg-green-500"></span>
              )}
            </div>
            {selectedWallet === type && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default WalletTypeSelector;

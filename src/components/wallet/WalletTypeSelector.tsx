
import React from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type WalletType = "Bitcoin" | "Alephium" | "Ergo";

interface WalletTypeSelectorProps {
  selectedWallet: WalletType;
  onSelectWallet: (wallet: WalletType) => void;
}

const WalletTypeSelector: React.FC<WalletTypeSelectorProps> = ({
  selectedWallet,
  onSelectWallet,
}) => {
  const walletTypes: WalletType[] = ["Bitcoin", "Alephium", "Ergo"];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <span>{selectedWallet}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {walletTypes.map((wallet) => (
          <DropdownMenuItem
            key={wallet}
            onClick={() => onSelectWallet(wallet)}
            className="flex items-center justify-between"
          >
            {wallet}
            {selectedWallet === wallet && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default WalletTypeSelector;


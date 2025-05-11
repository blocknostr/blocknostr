
import React from "react";
import { Wallet, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useHapticFeedback } from "@/hooks/use-haptic-feedback";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";

interface CompactWalletButtonProps {
  isConnected: boolean;
  onConnect: () => void;
  onLogout: () => void;
  className?: string;
}

const CompactWalletButton = ({
  isConnected,
  onConnect,
  onLogout,
  className
}: CompactWalletButtonProps) => {
  const { triggerHaptic } = useHapticFeedback();

  if (isConnected) {
    return (
      <div className={className}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    onClick={() => triggerHaptic('light')}
                  >
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                    <Wallet className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/wallets" className="flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      <span>View Wallets</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onLogout}
                    className="text-red-500 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Disconnect</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TooltipTrigger>
            <TooltipContent>
              <p>Wallet Connected</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className={className}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost" 
              size="icon"
              onClick={onConnect}
            >
              <Wallet className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Connect Wallet</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default CompactWalletButton;


import { Button } from "@/components/ui/button";
import { useAlephium } from "@/hooks/use-alephium";
import { Wallet } from "lucide-react";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";
import WalletMenu from "./WalletMenu";
import { AlephiumConnectButton } from "@/lib/alephium";

const WalletButton = () => {
  const { isConnected } = useAlephium();

  return (
    <>
      {isConnected ? (
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
            >
              <Wallet className="h-4 w-4" />
              <span>Wallet</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0">
            <WalletMenu />
          </PopoverContent>
        </Popover>
      ) : (
        <AlephiumConnectButton.Custom>
          {({ isConnecting, openConnectModal }) => (
            <Button 
              onClick={openConnectModal}
              disabled={isConnecting}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Wallet className="h-4 w-4" />
              <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
            </Button>
          )}
        </AlephiumConnectButton.Custom>
      )}
    </>
  );
};

export default WalletButton;

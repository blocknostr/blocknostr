
import { Button } from "@/components/ui/button";
import { useAlephium } from "@/hooks/use-alephium";
import { Wallet } from "lucide-react";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";
import WalletMenu from "./WalletMenu";

const WalletButton = () => {
  const { isConnected, connectWallet } = useAlephium();

  const handleConnect = async () => {
    await connectWallet();
  };

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
        <Button 
          onClick={handleConnect}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Wallet className="h-4 w-4" />
          <span>Connect Wallet</span>
        </Button>
      )}
    </>
  );
};

export default WalletButton;

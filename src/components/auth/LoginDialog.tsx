import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Wallet, ExternalLink, CheckCircle } from "lucide-react";
import { nostrService } from "@/lib/nostr";
import { toast } from "sonner";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LoginDialog: React.FC<LoginDialogProps> = ({ open, onOpenChange }) => {
  const [hasExtension, setHasExtension] = useState<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Check for Nostr extension
  useEffect(() => {
    const checkExtension = () => {
      setHasExtension(!!window.nostr);
    };

    checkExtension();
    
    // Check periodically in case extension loads after page
    const interval = setInterval(checkExtension, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleConnect = async () => {
    if (!hasExtension) {
      // If no extension, keep dialog open to guide installation
      return;
    }

    setIsLoggingIn(true);
    try {
      const success = await nostrService.login();
      if (success) {
        toast.success("Successfully connected to Nostr!");
        onOpenChange(false);
        
        // Reload the page to refresh content with logged in state
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error("Failed to connect. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Connection error. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" /> Connect to BlockNoster
          </DialogTitle>
          <DialogDescription>
            BlockNoster requires a Nostr extension to access the decentralized network.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {hasExtension ? (
            <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-md text-green-700 dark:text-green-300">
              <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span>Nostr extension detected! Click connect to proceed.</span>
            </div>
          ) : (
            <div className="flex items-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md text-amber-700 dark:text-amber-300">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span>No Nostr extension detected. Please install one to continue.</span>
            </div>
          )}

          <div className="mt-4 space-y-4">
            <h4 className="text-sm font-medium">Supported Nostr Extensions:</h4>
            <div className="grid grid-cols-2 gap-3">
              <a 
                href="https://getalby.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="mr-3 h-8 w-8 rounded-full bg-yellow-400 flex items-center justify-center text-white font-bold">
                  A
                </div>
                <div>
                  <p className="font-medium">Alby</p>
                  <p className="text-xs text-muted-foreground">Browser extension</p>
                </div>
                <ExternalLink className="ml-auto h-4 w-4 text-muted-foreground" />
              </a>
              
              <a 
                href="https://github.com/fiatjaf/nos2x" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="mr-3 h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                  N
                </div>
                <div>
                  <p className="font-medium">nos2x</p>
                  <p className="text-xs text-muted-foreground">Browser extension</p>
                </div>
                <ExternalLink className="ml-auto h-4 w-4 text-muted-foreground" />
              </a>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConnect}
            disabled={isLoggingIn || !hasExtension}
            className={hasExtension ? "" : "opacity-50"}
          >
            {isLoggingIn ? "Connecting..." : hasExtension ? "Connect" : "Install Extension First"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;

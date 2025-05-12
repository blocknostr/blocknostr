
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
import { AlertCircle, Wallet, ExternalLink, CheckCircle, QrCode, Fingerprint } from "lucide-react";
import { nostrService } from "@/lib/nostr";
import { toast } from "sonner";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LoginDialog: React.FC<LoginDialogProps> = ({ open, onOpenChange }) => {
  const [hasExtension, setHasExtension] = useState<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [connectStatus, setConnectStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');

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
    setConnectStatus('connecting');
    try {
      const success = await nostrService.login();
      if (success) {
        setConnectStatus('success');
        toast.success("Successfully connected to Nostr!");
        
        // Short delay to show success state before closing
        setTimeout(() => {
          onOpenChange(false);
          
          // Reload the page to refresh content with logged in state
          setTimeout(() => {
            window.location.reload();
          }, 300);
        }, 700);
      } else {
        setConnectStatus('error');
        toast.error("Connection failed. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setConnectStatus('error');
      toast.error("Connection error. Please try again.");
    } finally {
      if (connectStatus !== 'success') {
        setIsLoggingIn(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-b from-background to-background/95 border-muted/30 shadow-lg animate-in fade-in-0 zoom-in-95">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Wallet className="h-5 w-5 text-primary" /> Connect to BlockNoster
          </DialogTitle>
          <DialogDescription>
            Connect your Nostr wallet to access the decentralized social network.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-5">
          {connectStatus === 'success' ? (
            <div className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-md text-green-700 dark:text-green-300 animate-in fade-in slide-in-from-top-5">
              <CheckCircle className="h-6 w-6 mr-3 flex-shrink-0" />
              <span className="font-medium">Connected successfully!</span>
            </div>
          ) : hasExtension ? (
            <div className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-md text-green-700 dark:text-green-300">
              <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span>Nostr extension detected! Click connect to proceed.</span>
            </div>
          ) : (
            <div className="flex items-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-md text-amber-700 dark:text-amber-300">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span>No Nostr extension detected. Please install one to continue.</span>
            </div>
          )}

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Connect with:</h4>
            <div className="grid grid-cols-2 gap-3">
              <a 
                href="https://getalby.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center p-3 border rounded-lg hover:bg-accent transition-colors group"
              >
                <div className="mr-3 h-10 w-10 rounded-full bg-yellow-400 flex items-center justify-center text-white font-bold">
                  A
                </div>
                <div className="flex-1">
                  <p className="font-medium">Alby</p>
                  <p className="text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors">Browser extension</p>
                </div>
                <ExternalLink className="ml-auto h-4 w-4 text-muted-foreground opacity-70 group-hover:opacity-100" />
              </a>
              
              <a 
                href="https://github.com/fiatjaf/nos2x" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center p-3 border rounded-lg hover:bg-accent transition-colors group"
              >
                <div className="mr-3 h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                  N
                </div>
                <div className="flex-1">
                  <p className="font-medium">nos2x</p>
                  <p className="text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors">Browser extension</p>
                </div>
                <ExternalLink className="ml-auto h-4 w-4 text-muted-foreground opacity-70 group-hover:opacity-100" />
              </a>
              
              <a 
                href="https://snort.social/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center p-3 border rounded-lg hover:bg-accent transition-colors group"
              >
                <div className="mr-3 h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                  S
                </div>
                <div className="flex-1">
                  <p className="font-medium">Snort</p>
                  <p className="text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors">Web client</p>
                </div>
                <ExternalLink className="ml-auto h-4 w-4 text-muted-foreground opacity-70 group-hover:opacity-100" />
              </a>
              
              <a 
                href="https://coracle.social/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center p-3 border rounded-lg hover:bg-accent transition-colors group"
              >
                <div className="mr-3 h-10 w-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                  C
                </div>
                <div className="flex-1">
                  <p className="font-medium">Coracle</p>
                  <p className="text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors">Web client</p>
                </div>
                <ExternalLink className="ml-auto h-4 w-4 text-muted-foreground opacity-70 group-hover:opacity-100" />
              </a>
            </div>
            
            <div className="pt-2">
              <p className="text-xs text-muted-foreground text-center mb-3">
                New to Nostr? <a href="https://nostr.how" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Learn more
                </a>
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={connectStatus === 'connecting' || connectStatus === 'success'}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConnect}
            disabled={isLoggingIn || !hasExtension || connectStatus === 'success'}
            className={hasExtension ? "relative overflow-hidden group" : "opacity-50"}
          >
            {isLoggingIn ? (
              <div className="flex items-center">
                <span className="animate-pulse">Connecting...</span>
              </div>
            ) : connectStatus === 'success' ? (
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                <span>Connected</span>
              </div>
            ) : (
              <div className="flex items-center">
                <Fingerprint className="h-4 w-4 mr-2" />
                <span>{hasExtension ? "Connect" : "Install Extension First"}</span>
              </div>
            )}
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;

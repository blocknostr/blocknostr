import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Fingerprint, Wallet, ExternalLink, CheckCircle, QrCode, Shield, AlertCircle } from "lucide-react";
import { nostrService } from "@/lib/nostr";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LoginDialog: React.FC<LoginDialogProps> = ({ open, onOpenChange }) => {
  const [hasExtension, setHasExtension] = useState<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [connectStatus, setConnectStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');
  const [animateIn, setAnimateIn] = useState<boolean>(false);

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

  // Add animation when dialog opens
  useEffect(() => {
    if (open) {
      // Slight delay for animation to trigger after dialog opens
      const timer = setTimeout(() => {
        setAnimateIn(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setAnimateIn(false);
    }
  }, [open]);

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
        toast.success("Connected successfully", {
          description: "Welcome to BlockNoster"
        });
        
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
        toast.error("Connection failed", {
          description: "Please try again or check your extension"
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      setConnectStatus('error');
      toast.error("Connection error", {
        description: "Please check your extension settings"
      });
    } finally {
      if (connectStatus !== 'success') {
        setIsLoggingIn(false);
      }
    }
  };

  const clientOptions = [
    {
      id: "alby",
      name: "Alby",
      description: "Browser extension",
      color: "bg-amber-400",
      letter: "A",
      url: "https://getalby.com/"
    },
    {
      id: "alephium",
      name: "Alephium",
      description: "Wallet extension",
      color: "bg-green-500", 
      letter: "A",
      url: "https://alephium.org/docs/wallet/browser-extension-wallet/"
    },
    {
      id: "nos2x",
      name: "nos2x",
      description: "Browser extension",
      color: "bg-blue-500",
      letter: "N",
      url: "https://github.com/fiatjaf/nos2x"
    },
    {
      id: "snort",
      name: "Snort",
      description: "Web client",
      color: "bg-purple-500",
      letter: "S",
      url: "https://snort.social/"
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "sm:max-w-md bg-background/80 backdrop-blur-xl border-muted/20 shadow-lg",
        "animate-in fade-in-0 zoom-in-95 duration-200",
        "before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-b before:from-primary/5 before:to-primary/10 before:rounded-lg before:opacity-70",
        "max-h-[90vh] overflow-y-auto"
      )}>
        <div className={cn(
          "absolute inset-0 -z-10 bg-gradient-to-br from-background/40 to-background/60 rounded-lg opacity-80",
          "transition-opacity duration-300 ease-in-out",
          animateIn ? "opacity-80" : "opacity-0"
        )}/>
        
        <DialogHeader className="space-y-3">
          <div className="mx-auto p-2.5 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mb-2 transition-all duration-300 ease-in-out">
            <Shield className={cn(
              "h-6 w-6 text-primary transition-all duration-300",
              animateIn ? "opacity-100 scale-100" : "opacity-0 scale-90"
            )} />
          </div>
          <DialogTitle className={cn(
            "text-center text-xl font-light tracking-tight",
            "transition-all duration-300 ease-in-out",
            animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          )}>
            Connect to BlockNoster
          </DialogTitle>
        </DialogHeader>

        <div className={cn(
          "space-y-4 transition-all duration-300 ease-in-out", 
          animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        )}>
          {connectStatus === 'success' ? (
            <div className="flex items-center p-3 bg-green-50/50 dark:bg-green-900/20 rounded-lg text-green-700 dark:text-green-300 animate-in fade-in slide-in-from-top-5">
              <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
              <span className="font-medium">Connected successfully!</span>
            </div>
          ) : hasExtension ? (
            <div className="flex items-center p-3 bg-green-50/50 dark:bg-green-900/20 rounded-lg text-green-700 dark:text-green-300">
              <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
              <span>Nostr extension detected</span>
            </div>
          ) : (
            <div className="flex items-center p-3 bg-amber-50/50 dark:bg-amber-900/20 rounded-lg text-amber-700 dark:text-amber-300">
              <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
              <span>No Nostr extension detected</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {clientOptions.map(client => (
                <a 
                  key={client.id}
                  href={client.url}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center p-3 border border-border/50 rounded-lg hover:bg-accent/30 transition-colors group"
                >
                  <div className={`mr-2 h-8 w-8 rounded-full ${client.color} flex items-center justify-center text-white font-medium text-sm`}>
                    {client.letter}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{client.name}</p>
                    <p className="text-xs text-muted-foreground">{client.description}</p>
                  </div>
                  <ExternalLink className="ml-auto h-3 w-3 text-muted-foreground opacity-60 group-hover:opacity-100" />
                </a>
              ))}
            </div>
            
            <div className="bg-blue-50/40 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/30">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <span className="font-semibold">Alephium users:</span> If you have the Alephium wallet extension, it can be used with Nostr. When connecting, it will prompt you to create a Schnorr signature child wallet.
              </p>
            </div>
            
            <div className="pt-1">
              <p className="text-xs text-muted-foreground text-center">
                New to Nostr? <a href="https://nostr.how" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Learn more
                </a>
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className={cn(
          "flex justify-between sm:justify-between gap-2 transition-all duration-300 ease-in-out",
          animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={connectStatus === 'connecting' || connectStatus === 'success'}
            className="border-border/50 hover:bg-accent/30"
          >
            Cancel
          </Button>
          
          <Button
            onClick={handleConnect}
            disabled={isLoggingIn || !hasExtension || connectStatus === 'success'}
            className={cn(
              "relative overflow-hidden",
              hasExtension ? "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70" : "opacity-50"
            )}
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
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
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;

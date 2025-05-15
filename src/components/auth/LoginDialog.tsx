
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogIn, AlertCircle, Download, Key, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNostrAuth } from "@/hooks/useNostrAuth";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LoginDialog = ({ open, onOpenChange }: LoginDialogProps) => {
  const [activeTab, setActiveTab] = useState<string>("extension");
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [hasExtension, setHasExtension] = useState<boolean>(false);
  
  const { login, isLoggedIn } = useNostrAuth();
  
  // Check if extension is available
  useEffect(() => {
    const checkExtension = () => {
      setHasExtension(!!window.nostr);
    };
    
    checkExtension();
    
    // Check periodically if an extension gets installed
    const interval = setInterval(checkExtension, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Close dialog if user is already logged in
  useEffect(() => {
    if (isLoggedIn && open) {
      onOpenChange(false);
    }
  }, [isLoggedIn, open, onOpenChange]);
  
  const handleLoginWithExtension = async () => {
    if (!hasExtension) {
      toast.error("No Nostr extension found", {
        description: "Please install an extension like Alby or nos2x"
      });
      return;
    }
    
    setIsLoggingIn(true);
    
    try {
      const success = await login();
      
      if (success) {
        toast.success("Successfully logged in");
        onOpenChange(false);
      } else {
        toast.error("Login failed", {
          description: "Could not connect with your extension"
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login error", {
        description: "An unexpected error occurred"
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Connect to Nostr
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-1 w-full mb-4">
            <TabsTrigger value="extension">Browser Extension</TabsTrigger>
          </TabsList>
          
          <TabsContent value="extension" className="space-y-4">
            {hasExtension ? (
              <div className="space-y-4">
                <div className="text-center py-2">
                  <p className="text-sm text-muted-foreground">
                    Connect with your Nostr browser extension
                  </p>
                </div>
                
                <Button
                  onClick={handleLoginWithExtension}
                  className="w-full"
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <LogIn className="h-4 w-4 mr-2" />
                  )}
                  Connect Extension
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert variant="warning">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No extension detected</AlertTitle>
                  <AlertDescription className="text-sm">
                    You need to install a Nostr browser extension to continue.
                  </AlertDescription>
                </Alert>
                
                <div className="flex flex-col gap-3">
                  <Button asChild>
                    <a
                      href="https://getalby.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 w-full"
                    >
                      <Download className="h-4 w-4" />
                      Get Alby Extension
                    </a>
                  </Button>
                  
                  <Button asChild variant="outline">
                    <a
                      href="https://github.com/aljazceru/nostr-desktop"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 w-full"
                    >
                      <Download className="h-4 w-4" />
                      Get Nostr Browser Extension
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <div className="text-xs text-muted-foreground text-center w-full">
            Your keys never leave your device. Learn more about{" "}
            <a
              href="https://nostr.com/how-to-create-a-nostr-account"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary transition-colors"
            >
              Nostr security
            </a>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;

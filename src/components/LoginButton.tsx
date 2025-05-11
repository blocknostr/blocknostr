
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from 'react';
import { nostrService } from "@/lib/nostr";
import { LogIn, LogOut, User, AlertCircle, Wallet, CheckCircle2, Loader } from "lucide-react";
import { toast } from "sonner";
import { useHapticFeedback } from "@/hooks/use-haptic-feedback";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const LoginButton = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [npub, setNpub] = useState<string>("");
  const [hasExtension, setHasExtension] = useState<boolean>(false);
  const [step, setStep] = useState<'welcome' | 'extension' | 'success'>('welcome');
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { triggerHaptic } = useHapticFeedback();
  const animationRef = useRef<number | null>(null);
  
  useEffect(() => {
    // Check if user is already logged in
    const checkLogin = () => {
      const pubkey = nostrService.publicKey;
      if (pubkey) {
        setIsLoggedIn(true);
        setNpub(nostrService.formatPubkey(pubkey));
      } else {
        setIsLoggedIn(false);
        setNpub("");
      }
      
      // Check for NIP-07 extension
      setHasExtension(!!window.nostr);
    };
    
    checkLogin();
    
    // Re-check for extension periodically (it might be installed after page load)
    const intervalId = setInterval(() => {
      setHasExtension(!!window.nostr);
    }, 5000);
    
    return () => {
      clearInterval(intervalId);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);
  
  const handleLogin = async () => {
    if (!window.nostr) {
      triggerHaptic('warning');
      setLoginDialogOpen(true);
      setStep('extension');
      return;
    }
    
    setLoginDialogOpen(true);
    setStep('welcome');
    triggerHaptic('medium');
  };
  
  const proceedToLogin = async () => {
    try {
      setIsLoading(true);
      triggerHaptic('medium');
      
      const success = await nostrService.login();
      
      if (success) {
        const pubkey = nostrService.publicKey;
        if (pubkey) {
          setIsLoggedIn(true);
          setNpub(nostrService.formatPubkey(pubkey));
          setStep('success');
          triggerHaptic('success');
        }
      } else {
        triggerHaptic('error');
        toast.error("Login failed. Please try again.");
        setLoginDialogOpen(false);
      }
    } catch (error) {
      console.error("Login error:", error);
      triggerHaptic('error');
      toast.error("Login failed");
      setLoginDialogOpen(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  const closeSuccessAndFinish = () => {
    toast.success("Successfully logged in!");
    setLoginDialogOpen(false);
  };
  
  const handleLogout = async () => {
    triggerHaptic('medium');
    await nostrService.signOut();
    setIsLoggedIn(false);
    setNpub("");
    toast.success("Signed out successfully");
  };
  
  if (isLoggedIn) {
    const shortNpub = npub.length > 14 
      ? `${npub.substring(0, 7)}...${npub.substring(npub.length - 7)}`
      : npub;
      
    return (
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600/10 to-indigo-600/10 border-purple-300/20 dark:border-purple-500/20"
                onClick={() => { 
                  triggerHaptic('light');
                  window.location.href = "/profile"; 
                }}
              >
                <User className="h-4 w-4" />
                <span>{shortNpub}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View your profile</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-red-500" 
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Sign out</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }
  
  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              onClick={handleLogin} 
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md hover:shadow-purple-500/20 transition-all duration-300"
              variant="default"
            >
              <LogIn className="h-4 w-4" />
              <span>Sign in</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {hasExtension ? 
              "Sign in using your Nostr extension" : 
              "Install Alby, nos2x or another Nostr extension"
            }
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
        <DialogContent className="sm:max-w-md bg-gradient-to-b from-background to-background/95 backdrop-blur-sm border-purple-300/20 dark:border-purple-500/20 overflow-hidden">
          <DialogHeader>
            <DialogTitle className={step === 'success' ? "text-center" : ""}>
              {step === 'welcome' && 'Welcome to BlockNoster'} 
              {step === 'extension' && 'Nostr Extension Required'} 
              {step === 'success' && 'Successfully Connected!'}
            </DialogTitle>
            <DialogDescription className={step === 'success' ? "text-center" : ""}>
              {step === 'welcome' && 'Connect with your Nostr extension to access all features'} 
              {step === 'extension' && 'Please install a Nostr browser extension to continue'} 
              {step === 'success' && 'Your Nostr account is now connected to BlockNoster'}
            </DialogDescription>
          </DialogHeader>
          
          {/* Multi-step content */}
          <div className="px-1">
            {/* Welcome step */}
            {step === 'welcome' && (
              <div className="space-y-6 py-4">
                <div className="relative overflow-hidden rounded-xl border p-4 bg-gradient-to-br from-purple-500/5 to-indigo-500/5">
                  <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
                  <div className="relative flex flex-col items-center text-center space-y-4 p-2">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                      <Wallet className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold">Decentralized Identity</h3>
                    <p className="text-sm text-muted-foreground">
                      BlockNoster uses Nostr for secure, decentralized authentication. 
                      Your keys always remain in your control.
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3 justify-center">
                  <Card className="w-[48%] bg-gradient-to-br from-purple-500/5 to-transparent hover:from-purple-500/10 transition-all cursor-default">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-2">
                        <CheckCircle2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h4 className="text-sm font-medium">Private & Secure</h4>
                    </CardContent>
                  </Card>
                  
                  <Card className="w-[48%] bg-gradient-to-br from-indigo-500/5 to-transparent hover:from-indigo-500/10 transition-all cursor-default">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-2">
                        <CheckCircle2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <h4 className="text-sm font-medium">Cross-Platform</h4>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="flex justify-center">
                  <Button 
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white w-full max-w-[240px] py-6 font-medium shadow-lg"
                    onClick={proceedToLogin}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-4 w-4" />
                        Connect with Nostr
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Extension install step */}
            {step === 'extension' && (
              <div className="space-y-6 py-4">
                <div className="relative overflow-hidden rounded-xl border p-6 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
                  <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
                  <div className="relative flex flex-col items-center text-center space-y-4">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                      <AlertCircle className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold">Extension Required</h3>
                    <p className="text-sm text-muted-foreground">
                      To use BlockNoster, you need a Nostr-compatible browser extension that manages your keys securely.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-sm">
                      <a 
                        href="https://getalby.com/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex flex-col items-center p-4 rounded-lg border border-amber-200/20 hover:bg-amber-500/5 transition-all"
                        onClick={() => triggerHaptic('medium')}
                      >
                        <div className="h-12 w-12 mb-2 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                          <img src="https://getalby.com/favicon.png" className="h-8 w-8" alt="Alby logo" />
                        </div>
                        <span className="text-sm font-medium">Get Alby</span>
                      </a>
                      
                      <a 
                        href="https://github.com/fiatjaf/nos2x" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex flex-col items-center p-4 rounded-lg border border-orange-200/20 hover:bg-orange-500/5 transition-all"
                        onClick={() => triggerHaptic('medium')}
                      >
                        <div className="h-12 w-12 mb-2 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                          <span className="text-xl font-bold text-orange-600 dark:text-orange-400">N2X</span>
                        </div>
                        <span className="text-sm font-medium">Get nos2x</span>
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      triggerHaptic('light');
                      setLoginDialogOpen(false);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
            
            {/* Success step */}
            {step === 'success' && (
              <div className="space-y-6 py-4 flex flex-col items-center">
                <div className="flex flex-col items-center justify-center text-center space-y-3">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center justify-center animate-ping opacity-30">
                      <div className="h-20 w-20 rounded-full bg-green-500" />
                    </div>
                    <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                      <CheckCircle2 className="h-12 w-12 text-white" />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold mt-4">Connected!</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Your Nostr key is securely connected to BlockNoster. You can now access all features.
                  </p>
                </div>
                
                <Button 
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-6 px-8 font-medium shadow-lg mt-4"
                  onClick={closeSuccessAndFinish}
                >
                  Continue to BlockNoster
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LoginButton;

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Database, Trash2, Bug, Download, Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { nostrService } from "@/lib/nostr";
import { useWalletCache } from "@/hooks/business/useWalletCache";
import { formatDistanceToNow } from "date-fns";

const WalletDebug: React.FC = () => {
  const {
    savedWallets,
    addWallet,
    removeWallet,
    restoreWalletsFromNostr,
    resetRestorationState,
    isOnline
  } = useWalletCache();

  const [isRestoring, setIsRestoring] = useState(false);
  const [autoRestorationTriggered, setAutoRestorationTriggered] = useState(false);
  const [loginTransitionDetected, setLoginTransitionDetected] = useState(false);

  // Monitor for auto-restoration activity
  useEffect(() => {
    if (nostrService.publicKey && savedWallets.length === 0) {
      setAutoRestorationTriggered(true);
      // Reset after a delay
      const timer = setTimeout(() => setAutoRestorationTriggered(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [nostrService.publicKey, savedWallets.length]);

  // 🚀 Monitor for login transitions (similar to WalletManager)
  const previousNostrState = useRef<string | null>(null);
  useEffect(() => {
    const currentNostrState = nostrService.publicKey;
    const wasLoggedOut = !previousNostrState.current;
    const isNowLoggedIn = !!currentNostrState;
    
    if (wasLoggedOut && isNowLoggedIn && savedWallets.length === 0) {
      console.log('🔧 [DEBUG] Login transition detected!');
      setLoginTransitionDetected(true);
      setTimeout(() => setLoginTransitionDetected(false), 5000);
    }
    
    previousNostrState.current = currentNostrState;
  }, [nostrService.publicKey, savedWallets.length]);

  const handleManualRestore = async () => {
    setIsRestoring(true);
    try {
      console.log('🔧 [DEBUG] Manual restore triggered');
      await restoreWalletsFromNostr();
    } catch (error) {
      console.error('🔧 [DEBUG] Manual restore failed:', error);
      toast.error('Manual restore failed');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleResetRestorationState = () => {
    console.log('🔧 [DEBUG] Resetting restoration state');
    resetRestorationState();
    setAutoRestorationTriggered(false);
    setLoginTransitionDetected(false);
    toast.success('Restoration state reset');
  };

  const handleClearAllWallets = () => {
    console.log('🔧 [DEBUG] Clearing all wallets');
    savedWallets.forEach(wallet => {
      removeWallet(wallet.address);
    });
    setAutoRestorationTriggered(false);
    toast.success('All wallets cleared');
  };

  const handleAddTestWallet = () => {
    const testAddress = `test${Date.now()}`;
    console.log('🔧 [DEBUG] Adding test wallet:', testAddress);
    addWallet({
      address: testAddress,
      label: `Test Wallet ${Date.now()}`,
      dateAdded: Date.now(),
      network: "Alephium",
      isWatchOnly: true
    });
    toast.success('Test wallet added');
  };

  const handleTestLoginTransition = () => {
    console.log('🔧 [DEBUG] Simulating login transition for testing');
    // This will help test the login detection logic
    const currentState = nostrService.publicKey;
    toast.info(`Current Nostr state: ${currentState ? 'Logged In' : 'Logged Out'}`);
    
    if (!currentState) {
      toast.warning('Connect to Nostr first to test login transition');
    } else if (savedWallets.length > 0) {
      toast.warning('Clear all wallets first to test auto-restoration');
    } else {
      toast.success('Conditions met for auto-restoration test!');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
                  <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Wallet Debug Panel
            {(isRestoring || autoRestorationTriggered || loginTransitionDetected) && (
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            )}
          </CardTitle>
          <CardDescription>
            Debug and test wallet management functionality
            {loginTransitionDetected && (
              <span className="block text-green-600 text-sm mt-1">
                🎯 Login transition detected - triggering auto-restoration!
              </span>
            )}
            {autoRestorationTriggered && !loginTransitionDetected && (
              <span className="block text-blue-600 text-sm mt-1">
                🚀 Auto-restoration in progress...
              </span>
            )}
          </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Section */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">System Status</h3>
            <div className="flex flex-col gap-1 text-xs">
              <Badge variant={isOnline ? "default" : "destructive"}>
                {isOnline ? "🟢 Online" : "🔴 Offline"}
              </Badge>
              <Badge variant={nostrService.publicKey ? "default" : "secondary"}>
                {nostrService.publicKey ? "🔑 Nostr Connected" : "⚪ Nostr Disconnected"}
              </Badge>
              <Badge variant="outline">
                💾 {savedWallets.length} Saved Wallets
              </Badge>
              {loginTransitionDetected && (
                <Badge variant="default" className="bg-green-500">
                  🎯 Login Transition!
                </Badge>
              )}
              {(isRestoring || autoRestorationTriggered) && !loginTransitionDetected && (
                <Badge variant="default" className="bg-blue-500">
                  🔄 Restoring...
                </Badge>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Debug Info</h3>
            <div className="text-xs text-muted-foreground">
              <div>User: {nostrService.publicKey ? `${nostrService.publicKey.substring(0, 8)}...` : 'Not connected'}</div>
              <div>Wallets: {savedWallets.length}</div>
              <div>Locked: {savedWallets.filter(w => w.locked?.isLocked).length}</div>
              <div>Local: {savedWallets.filter(w => !w.locked?.isLocked).length}</div>
              <div className="text-blue-600">
                Auto-restore: {nostrService.publicKey && savedWallets.length === 0 ? 'Ready' : 'Inactive'}
              </div>
            </div>
          </div>
        </div>

        {/* Wallet List */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Current Wallets</h3>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {savedWallets.length === 0 ? (
              <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                {nostrService.publicKey ? (
                  autoRestorationTriggered ? (
                    <span className="text-blue-600">🔄 Searching for locked wallets...</span>
                  ) : (
                    "No wallets found - Try manual restore or connect to Nostr"
                  )
                ) : (
                  "Connect to Nostr first to restore locked wallets"
                )}
              </div>
            ) : (
              savedWallets.map((wallet, index) => (
                <div key={wallet.address} className="flex items-center justify-between p-2 bg-muted rounded text-xs">
                  <div>
                    <div className="font-medium">{wallet.label}</div>
                    <div className="text-muted-foreground">
                      {wallet.address.substring(0, 12)}...
                      {wallet.network && ` • ${wallet.network}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {wallet.locked?.isLocked && (
                      <Badge variant="destructive" className="text-xs">
                        🔒 Locked
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {formatDistanceToNow(wallet.dateAdded, { addSuffix: true })}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRestore}
            disabled={isRestoring || !nostrService.publicKey}
            className="text-xs"
          >
            {isRestoring ? (
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Download className="h-3 w-3 mr-1" />
            )}
            Manual Restore
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleResetRestorationState}
            className="text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Reset State
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleAddTestWallet}
            className="text-xs"
          >
            <Database className="h-3 w-3 mr-1" />
            Add Test Wallet
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleTestLoginTransition}
            className="text-xs"
          >
            <Bug className="h-3 w-3 mr-1" />
            Test Transition
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={handleClearAllWallets}
            className="text-xs col-span-2"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear All Wallets
          </Button>
        </div>

        {/* Enhanced Instructions */}
        <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
          <strong>🚀 Improved Test Flow:</strong>
          <ol className="list-decimal list-inside mt-1 space-y-1">
            <li>Connect to Nostr → <span className="text-blue-600">Auto-restoration triggers immediately</span></li>
            <li>Clear all wallets → <span className="text-blue-600">Auto-restoration triggers again</span></li>
            <li>Watch for batch loading → <span className="text-green-600">All wallets appear at once</span></li>
            <li>Check console logs for batch processing details</li>
          </ol>
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-blue-800">
            <strong>✨ New Features:</strong> Immediate restoration, true batch processing, auto wallet selection
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletDebug; 

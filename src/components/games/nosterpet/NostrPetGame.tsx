import React, { useEffect, useRef, useState } from 'react';
import { useWallet } from "@alephium/web3-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import PixiGameComponent from './PixiGameComponent';
import { Card } from '@/components/ui/card';
import { nostrService } from '@/lib/nostr/index';

const NostrPetGame = () => {
  const { account, connectionStatus } = useWallet();
  const [isNostrConnected, setIsNostrConnected] = useState(!!nostrService.publicKey);
  const mountRef = useRef<HTMLDivElement>(null);

  const isWalletConnected = connectionStatus === 'connected' && !!account;

  const handleConnectNostr = async () => {
    try {
      await nostrService.login();
      setIsNostrConnected(!!nostrService.publicKey);
      toast.success("Nostr connected successfully!");
    } catch (error) {
      toast.error("Failed to connect to Nostr", {
        description: "Please make sure you have a Nostr extension installed."
      });
      console.error("Nostr connection error:", error);
    }
  };

  if (!isWalletConnected) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <p className="text-center text-muted-foreground">
          Please connect your Alephium wallet to play NostrPet.
        </p>
        <Button variant="default" size="sm" onClick={() => window.location.href = '/wallets'}>
          Go to Wallets Page
        </Button>
      </div>
    );
  }

  if (!isNostrConnected) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <p className="text-center text-muted-foreground">
          NostrPet requires a Nostr identity for social features.
        </p>
        <Button variant="default" size="sm" onClick={handleConnectNostr}>
          Connect to Nostr
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="relative w-full">
        <Card className="overflow-hidden bg-background border-2 aspect-[4/3] max-w-3xl mx-auto">
          <div className="relative w-full h-full">
            <PixiGameComponent
              address={account?.address || ''}
              nostrPubkey={nostrService.publicKey || ''}
            />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm mt-4">
        <div className="bg-muted/30 p-3 rounded border border-muted">
          <h3 className="font-semibold mb-1">Alephium Integration</h3>
          <p className="text-muted-foreground">Your pet is an NFT on Alephium blockchain with on-chain stats.</p>
        </div>
        <div className="bg-muted/30 p-3 rounded border border-muted">
          <h3 className="font-semibold mb-1">Nostr Social Features</h3>
          <p className="text-muted-foreground">Share pet updates via Nostr and join community events.</p>
        </div>
        <div className="bg-muted/30 p-3 rounded border border-muted">
          <h3 className="font-semibold mb-1">Bitcoin Lightning</h3>
          <p className="text-muted-foreground">Purchase items and earn rewards using Lightning Network.</p>
        </div>
      </div>
    </div>
  );
};

export default NostrPetGame;
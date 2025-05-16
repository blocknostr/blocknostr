
import React, { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface PhaserGameComponentProps {
  address: string;
  nostrPubkey: string;
}

const PhaserGameComponent: React.FC<PhaserGameComponentProps> = ({ address, nostrPubkey }) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    let game: Phaser.Game;
    
    const initPhaser = async () => {
      try {
        // Dynamically import Phaser and the game scene to reduce initial load time
        const Phaser = await import('phaser');
        const { default: GameScene } = await import('./scenes/GameScene');
        
        // Create game configuration
        const config = {
          type: Phaser.AUTO,
          width: 800,
          height: 600,
          parent: gameRef.current || undefined,
          backgroundColor: '#282c34',
          scene: [GameScene],
          physics: {
            default: 'arcade',
            arcade: {
              gravity: { y: 0, x: 0 }, // Fixed: Added x property to match Vector2Like type
              debug: false
            }
          },
          scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
          }
        };
        
        // Initialize the game
        game = new Phaser.Game(config);
        
        // Pass wallet address and Nostr pubkey to game scene
        game.registry.set('walletAddress', address);
        game.registry.set('nostrPubkey', nostrPubkey);
        
        setIsLoading(false);
        
        toast.success("NostrPet game loaded successfully!", {
          description: "Take care of your blockchain pet and watch it grow!"
        });
      } catch (err) {
        console.error("Failed to initialize game:", err);
        setError("Failed to load the game. Please refresh the page and try again.");
        setIsLoading(false);
        
        toast.error("Failed to load game", {
          description: "There was an issue loading the NostrPet game. Please try again."
        });
      }
    };
    
    // Initialize the game
    initPhaser();
    
    // Cleanup function
    return () => {
      if (game) {
        game.destroy(true);
      }
    };
  }, [address, nostrPubkey]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] text-center p-4">
        <p className="text-red-500 mb-2">⚠️ {error}</p>
        <button 
          className="px-4 py-2 bg-primary text-primary-foreground rounded"
          onClick={() => window.location.reload()}
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Loading NostrPet game...</p>
        </div>
      )}
      <div ref={gameRef} className="game-container" />
    </div>
  );
};

export default PhaserGameComponent;

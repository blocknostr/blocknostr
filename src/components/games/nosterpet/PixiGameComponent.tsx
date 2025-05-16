import React, { useEffect, useRef, useState } from 'react';
import GameScene from './scenes/GameScene';

interface PixiGameComponentProps {
  address: string;
  nostrPubkey: string;
}

const PixiGameComponent: React.FC<PixiGameComponentProps> = ({ address, nostrPubkey }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const gameRef = useRef<GameScene | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Observe container size
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Initialize game when container has valid size
  useEffect(() => {
    let cancelled = false;
    const el = mountRef.current;
    const { width, height } = containerSize;
    if (!el || width === 0 || height === 0) return;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const game = await GameScene.create(el, address, nostrPubkey);
        if (!cancelled) gameRef.current = game;
      } catch (err) {
        setError('Failed to load game: ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      gameRef.current?.destroy();
      gameRef.current = null;
    };
  }, [containerSize, address, nostrPubkey]);

  // Render only the container div for PixiJS to mount into
  return (
    <div className="absolute inset-0 w-full h-full min-h-[60vh]">
      <div ref={mountRef} className="w-full h-full" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
          <span className="text-white">Loading game...</span>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900/80 z-20">
          <span className="text-white font-bold">{error}</span>
        </div>
      )}
    </div>
  );
};

export default PixiGameComponent;
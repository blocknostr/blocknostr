// SpaceFlyerGame.tsx
import React, { useEffect, useRef, useState } from "react";
import kaboom, { GameObj, KaboomCtx, Vec2 } from "kaboom";
import { Button } from "@/components/ui/button";
import { Pause, Play } from "lucide-react";
import { nostrService } from '@/lib/nostr/index';
import { NostrMultiplayerManager, PlayerState } from './NostrMultiplayerManager';

interface GameObject extends GameObj {
    speed?: number;
    value?: number;
    hp?: () => number;
    hurt?: (damage: number) => void;
}

const SpaceFlyerGame: React.FC = () => {
    const gameRef = useRef<HTMLDivElement>(null);
    const kaboomRef = useRef<KaboomCtx | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [highScore, setHighScore] = useState(
        Number(localStorage.getItem("spaceFlyerHighScore") || "0")
    );
    const [gameState, setGameState] = useState<"playing" | "gameover" | "paused">("playing");
    const scoreRef = useRef(0);

    useEffect(() => {
        // Prompt for login immediately if not logged in
        if (!nostrService.publicKey && nostrService.login) {
            nostrService.login();
        }
        const initTimeout = setTimeout(() => {
            console.log("Checking game container...");
            if (!gameRef.current) {
                setError("Game container not found after delay.");
                setIsLoading(false);
                return;
            }
            console.log("Game container found:", gameRef.current);

            // Initialize Kaboom
            try {
                kaboomRef.current = kaboom({
                    width: 640,
                    height: 640,
                    root: gameRef.current,
                    background: [0, 0, 20],
                    scale: 1.5,
                    crisp: true,
                });
            } catch (err) {
                setError("Failed to initialize Kaboom: " + (err as Error).message);
                setIsLoading(false);
                return;
            }

            const k = kaboomRef.current;
            // Multiplayer state
            const otherPlayers: Record<string, GameObj> = {};
            const otherBullets: Record<string, GameObj[]> = {};
            const playerTimestamps: Record<string, number> = {}; // Added missing declaration
            const myPubkey = nostrService.publicKey || Math.random().toString(36).slice(2);
            // Load assets with timeout and error handling
            const loadAssets = async () => {
                console.log("Starting asset load...");
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Asset loading timed out after 10 seconds.")), 10000)
                );

                const assetPromises = Promise.all([
                    k.loadSprite("fox", "/assets/fox.png").catch(() =>
                        console.error("Failed to load fox sprite")
                    ),
                    k.loadSprite("asteroid", "/assets/asteroid.png").catch(() =>
                        console.error("Failed to load asteroid sprite")
                    ),
                    k.loadSound("hit", "/assets/hit.mp3").catch(() =>
                        console.error("Failed to load hit sound")
                    ),
                    k.loadSound("score", "/assets/score.mp3").catch(() =>
                        console.error("Failed to load score sound")
                    ),
                ]);

                try {
                    await Promise.race([assetPromises, timeoutPromise]);
                    console.log("Assets loaded successfully.");
                    setIsLoading(false);
                } catch (error) {
                    console.error("Asset loading error:", error);
                    setError(
                        "Failed to load game assets. Please ensure assets are in public/assets/ and refresh the page."
                    );
                    setIsLoading(false);
                }
            };

            // Game scene
            const initGame = () => {
                console.log("Initializing game scene...");
                try {
                    k.scene("main", () => {
                        // Player
                        const fox = k.add([
                            k.sprite("fox", { width: 32, height: 32 }),
                            k.area({ scale: 0.8 }),
                            k.body(),
                            k.pos(320, 560),
                            k.health(3),
                            { speed: 320 } as GameObject,
                            "player",
                            { pubkey: myPubkey }
                        ]);

                        // UI
                        const scoreLabel = k.add([
                            k.text("Score: 0", { size: 16, font: "sans-serif" }),
                            k.pos(12, 12),
                            k.color(255, 255, 255),
                            { value: 0 } as GameObject,
                        ]);
                        const highScoreLabel = k.add([
                            k.text(`High: ${highScore}`, { size: 16, font: "sans-serif" }),
                            k.pos(12, 36),
                            k.color(255, 255, 255),
                        ]);
                        const healthLabel = k.add([
                            k.text("Health: 3", { size: 16, font: "sans-serif" }),
                            k.pos(12, 60),
                            k.color(255, 255, 255),
                        ]);

                        // Controls
                        k.onKeyDown("left", () => {
                            if (!isPaused && gameState === "playing") {
                                fox.move(-fox.speed! * k.dt(), 0);
                            }
                        });
                        k.onKeyDown("right", () => {
                            if (!isPaused && gameState === "playing") {
                                fox.move(fox.speed! * k.dt(), 0);
                            }
                        });
                        // Shooting
                        k.onKeyPress("z", () => shoot());
                        k.onKeyPress("space", () => {
                            if (gameState === "playing" || gameState === "paused") {
                                setIsPaused((prev) => !prev);
                                setGameState((prev) => (prev === "paused" ? "playing" : "paused"));
                            } else {
                                shoot();
                            }
                        });
                        // Touch shooting
                        k.onTouchStart(() => shoot());

                        // --- Multiplayer: send isShooting true when shooting (with score/health) ---
                        const shoot = () => {
                            if (isPaused || gameState !== "playing") return;
                            k.add([
                                k.rect(4, 16),
                                k.pos(fox.pos.x + 14, fox.pos.y - 16),
                                k.color(80, 200, 255),
                                k.move(0, -600),
                                k.area(),
                                "bullet"
                            ]);
                            NostrMultiplayerManager.sendState({
                                pubkey: myPubkey,
                                x: fox.pos.x,
                                y: fox.pos.y,
                                isShooting: true,
                                ts: Date.now(),
                                score: scoreRef.current,
                                health: fox.hp!()
                            });
                        };

                        // --- Enemy sync: broadcast enemy spawns (co-op) ---
                        const spawnEnemy = (xOverride?: number) => {
                            if (isPaused || gameState !== "playing") return;
                            const x = typeof xOverride === 'number' ? xOverride : k.rand(24, 616);
                            const enemy = k.add([
                                k.rect(28, 28),
                                k.pos(x, -24),
                                k.color(255, 80, 80),
                                k.move(0, k.rand(120, 220)),
                                k.area({ scale: 0.8 }),
                                k.health(1),
                                "enemy"
                            ]);
                            enemy.onUpdate(() => {
                                if (enemy.pos.y > 680) {
                                    k.destroy(enemy);
                                }
                            });
                            // Only broadcast if not from network
                            if (typeof xOverride !== 'number') {
                                NostrMultiplayerManager.sendEnemySpawn({ x, ts: Date.now() });
                            }
                        };
                        // Listen for enemy spawns from others (use only spawnEnemy)
                        NostrMultiplayerManager.onEnemySpawn(({ x }) => {
                            spawnEnemy(x);
                        });
                        k.loop(1.2, () => spawnEnemy());

                        // Bullet-enemy collision
                        k.onCollide("bullet", "enemy", (b, e) => {
                            k.destroy(b);
                            k.destroy(e);
                            scoreLabel.value! += 5;
                            scoreRef.current = scoreLabel.value!;
                            scoreLabel.text = `Score: ${scoreLabel.value}`;
                            Promise.resolve(k.play("score", { volume: 0.5 })).catch(() =>
                                console.error("Failed to play score sound")
                            );
                            if (scoreLabel.value! > highScore) {
                                setHighScore(scoreLabel.value!);
                                localStorage.setItem("spaceFlyerHighScore", scoreLabel.value!.toString());
                                highScoreLabel.text = `High: ${scoreLabel.value}`;
                            }
                        });

                        // Asteroid spawning (optional: keep as obstacles)
                        const spawnInterval = 0.7;
                        function spawnAsteroid() {
                            if (isPaused || gameState !== "playing") return;
                            const x = k.rand(24, 616);
                            const asteroid = k.add([
                                k.sprite("asteroid", { width: 32, height: 32 }),
                                k.area({ scale: 0.8 }),
                                k.pos(x, -24),
                                k.move(0, k.rand(200, 400)),
                                k.health(1),
                                "asteroid",
                            ]);
                            asteroid.onUpdate(() => {
                                if (asteroid.pos.y > 680) {
                                    k.destroy(asteroid);
                                }
                            });
                        }
                        k.loop(spawnInterval, spawnAsteroid);

                        // Player collision with enemies or asteroids
                        fox.onCollide(["enemy", "asteroid"], (obj: GameObj) => {
                            if (isPaused || gameState !== "playing") return;
                            Promise.resolve(k.play("hit", { volume: 0.5 })).catch(() =>
                                console.error("Failed to play hit sound")
                            );
                            fox.hurt!(1);
                            k.destroy(obj);
                            healthLabel.text = `Health: ${fox.hp!()}`;
                            if (fox.hp!() <= 0) {
                                setGameState("gameover");
                                k.add([
                                    k.text(
                                        `Game Over\nScore: ${scoreLabel.value}\nHigh: ${highScore}\nPress R to Restart`,
                                        { size: 24, align: "center", font: "sans-serif" }
                                    ),
                                    k.pos(320, 320),
                                    k.anchor("center"),
                                ]);
                                k.get("asteroid").forEach((asteroid: GameObj) => k.destroy(asteroid));
                                k.get("enemy").forEach((enemy: GameObj) => k.destroy(enemy));
                                k.get("bullet").forEach((bullet: GameObj) => k.destroy(bullet));
                            }
                        });

                        // Restart game
                        k.onKeyPress("r", () => {
                            if (gameState === "gameover") {
                                setGameState("playing");
                                setIsPaused(false);
                                k.go("main");
                            }
                        });
                        // Touch controls for mobile
                        k.onTouchMove((pos: Vec2) => {
                            if (!isPaused && gameState === "playing") {
                                if (pos.x < k.width() / 2) {
                                    fox.move(-fox.speed! * k.dt(), 0);
                                } else {
                                    fox.move(fox.speed! * k.dt(), 0);
                                }
                            }
                        });

                        // --- Multiplayer: listen for other players ---
                        NostrMultiplayerManager.subscribe((state: PlayerState) => {
                            if (!state.pubkey || state.pubkey === myPubkey) return;
                            // Add or update other player ship
                            if (!otherPlayers[state.pubkey] || !otherPlayers[state.pubkey].exists()) {
                                otherPlayers[state.pubkey] = k.add([
                                    k.sprite("fox", { width: 32, height: 32 }),
                                    k.pos(state.x, state.y),
                                    k.color(120, 255, 120),
                                    k.opacity(0.7),
                                    k.z(10),
                                    { pubkey: state.pubkey },
                                    "other-player"
                                ]);
                                // Add label
                                k.add([
                                    k.text(state.pubkey.slice(0, 8), { size: 10 }),
                                    k.pos(state.x, state.y - 20),
                                    k.color(120, 255, 120),
                                    k.z(11),
                                    { pubkey: state.pubkey, label: true },
                                    "other-label"
                                ]);
                            } else {
                                otherPlayers[state.pubkey].pos.x = state.x;
                                otherPlayers[state.pubkey].pos.y = state.y;
                                // Move label too
                                k.get("other-label").forEach((lbl: GameObj & { pubkey?: string }) => {
                                    if (lbl.pubkey === state.pubkey) {
                                        lbl.pos.x = state.x;
                                        lbl.pos.y = state.y - 20;
                                    }
                                });
                            }
                            // Handle shooting
                            if (state.isShooting) {
                                if (!otherBullets[state.pubkey]) otherBullets[state.pubkey] = [];
                                const bullet = k.add([
                                    k.rect(4, 16),
                                    k.pos(state.x + 14, state.y - 16),
                                    k.color(120, 255, 120),
                                    k.move(0, -600),
                                    k.area(),
                                    "other-bullet"
                                ]);
                                otherBullets[state.pubkey].push(bullet);
                            }
                            // Optionally: display other players' score/health
                        });

                        // --- Multiplayer: send my state every frame (with score/health) ---
                        fox.onUpdate(() => {
                            NostrMultiplayerManager.sendState({
                                pubkey: myPubkey,
                                x: fox.pos.x,
                                y: fox.pos.y,
                                isShooting: false, // set to true when shooting
                                ts: Date.now(),
                                score: scoreRef.current,
                                health: fox.hp!()
                            });
                        });
                    });

                    // Start the game in the "main" scene
                    k.go("main"); // Use go instead of start
                } catch (err) {
                    setError("Failed to initialize game scene: " + (err as Error).message);
                    setIsLoading(false);
                }
            };

            // Load assets and initialize the game
            loadAssets().then(initGame).catch((err) => {
                setError("Error during game initialization: " + (err as Error).message);
                setIsLoading(false);
            });
        }, 100);

        // Store the current gameRef for cleanup
        const cleanupGameRef = gameRef.current;

        return () => {
            clearTimeout(initTimeout);
            // Cleanup Kaboom on unmount
            if (cleanupGameRef) {
                cleanupGameRef.innerHTML = "";
            }
            kaboomRef.current = null;
        };
    }, [gameState, highScore, isPaused]);

    // Always render the game container, overlay loading/error/login
    const isLoggedIn = !!nostrService.publicKey;
    return (
        <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            background: "radial-gradient(ellipse at center, #181a2a 60%, #0a0a1a 100%)"
        }}>
            <div style={{
                position: "relative",
                width: 640,
                height: 640,
                background: "#0a0a1a",
                border: "4px solid #222",
                borderRadius: 16,
                boxShadow: "0 0 32px #0008"
            }}>
                <div ref={gameRef} style={{ touchAction: "none", width: 640, height: 640 }} />
                {!nostrService.publicKey && (
                    <div style={{
                        position: "absolute", left: 0, top: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.85)", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 20
                    }}>
                        <div style={{ fontSize: 24, marginBottom: 24 }}>Sign in to play</div>
                        <button onClick={() => nostrService.login && nostrService.login()} style={{ fontSize: 18, padding: "12px 32px", borderRadius: 8, background: "#4f46e5", color: "#fff", border: 0, cursor: "pointer" }}>Sign in with Nostr</button>
                    </div>
                )}
                {isLoading && nostrService.publicKey && (
                    <div style={{
                        position: "absolute", left: 0, top: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.7)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10
                    }}>Loading game...</div>
                )}
                {error && nostrService.publicKey && (
                    <div style={{
                        position: "absolute", left: 0, top: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.7)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10
                    }}>Error: {error}</div>
                )}
            </div>
        </div>
    );
};

export default SpaceFlyerGame;
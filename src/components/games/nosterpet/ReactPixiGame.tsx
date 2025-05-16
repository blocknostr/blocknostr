import { Stage, Sprite, Text, Graphics } from '@pixi/react';
import { useEffect, useState, useRef } from 'react';

interface ReactPixiGameProps {
    width?: number;
    height?: number;
    address: string;
    nostrPubkey: string;
}

export default function ReactPixiGame({ width = 640, height = 480, address, nostrPubkey }: ReactPixiGameProps) {
    const [petTexture, setPetTexture] = useState<string | null>(null);
    const [happiness, setHappiness] = useState(50);
    const [bounce, setBounce] = useState(0);
    const [showPlusOne, setShowPlusOne] = useState(false);
    const [plusOneY, setPlusOneY] = useState(height / 2 - 60);
    const bounceRef = useRef<number>(0);
    const plusOneTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setPetTexture('/assets/games/nosterpet/idle.svg');
    }, []);

    // Bounce animation
    useEffect(() => {
        let frame: number;
        const animate = () => {
            bounceRef.current += 0.1;
            setBounce(Math.sin(bounceRef.current) * 10);
            frame = requestAnimationFrame(animate);
        };
        animate();
        return () => cancelAnimationFrame(frame);
    }, []);

    // Floating +1 animation
    useEffect(() => {
        if (showPlusOne) {
            let y = height / 2 - 60;
            setPlusOneY(y);
            const interval = setInterval(() => {
                y -= 2;
                setPlusOneY(y);
            }, 16);
            plusOneTimeout.current = setTimeout(() => {
                setShowPlusOne(false);
                clearInterval(interval);
            }, 600);
            return () => {
                clearInterval(interval);
                if (plusOneTimeout.current) clearTimeout(plusOneTimeout.current);
            };
        }
    }, [showPlusOne, height]);

    // Handle pet click
    const handlePetClick = () => {
        setHappiness(h => Math.min(100, h + 1));
        setShowPlusOne(true);
    };

    // Draw happiness bar
    const renderHappinessBar = () => (
        <Graphics
            draw={g => {
                g.clear();
                // Background
                g.beginFill(0x222222, 0.6);
                g.drawRoundedRect(width / 2 - 60, height - 60, 120, 18, 9);
                g.endFill();
                // Bar
                g.beginFill(0x00e676);
                g.drawRoundedRect(width / 2 - 58, height - 58, 1.16 * happiness, 14, 7);
                g.endFill();
            }}
        />
    );

    return (
        <Stage width={width} height={height} options={{ backgroundColor: 0x1099bb }}>
            {petTexture && (
                <Sprite
                    image={petTexture}
                    x={width / 2}
                    y={height / 2 + bounce}
                    anchor={0.5}
                    interactive
                    pointerdown={handlePetClick}
                    scale={showPlusOne ? { x: 1.15, y: 1.15 } : { x: 1, y: 1 }}
                    cursor="pointer"
                />
            )}
            {/* Happiness stat overlay */}
            <Text
                text={`Happiness: ${happiness}`}
                x={width / 2}
                y={height - 80}
                anchor={0.5}
                style={{
                    fontFamily: 'Arial',
                    fontSize: 22,
                    fill: '#fff',
                    fontWeight: 'bold',
                    dropShadow: true,
                    dropShadowDistance: 2,
                    dropShadowColor: '#222',
                } as any}
            />
            {/* Happiness bar */}
            {renderHappinessBar()}
            {/* Floating +1 animation */}
            {showPlusOne && (
                <Text
                    text={'+1'}
                    x={width / 2}
                    y={plusOneY}
                    anchor={0.5}
                    style={{
                        fontFamily: 'Arial',
                        fontSize: 28,
                        fill: '#ffeb3b',
                        fontWeight: 'bold',
                        stroke: '#222',
                        strokeThickness: 4,
                    } as any}
                />
            )}
        </Stage>
    );
}

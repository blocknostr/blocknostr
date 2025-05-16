import { Stage, Sprite, Text, Graphics } from '@pixi/react';
import { useEffect, useState, useRef } from 'react';
import { TextStyle } from '@pixi/text';

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
    const bounceRef = useRef<number>(0);

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

    // Handle pet click
    const handlePetClick = () => {
        setHappiness(h => Math.min(100, h + 1));
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
                    scale={{ x: 1, y: 1 }}
                    cursor="pointer"
                />
            )}
            {/* Happiness stat overlay */}
            <Text
                text={`Happiness: ${happiness}`}
                x={width / 2}
                y={height - 80}
                anchor={0.5}
                style={new TextStyle({
                    fontFamily: 'Arial',
                    fontSize: 22,
                    fill: '#fff',
                    fontWeight: 'bold',
                    dropShadow: true,
                    dropShadowDistance: 2,
                    dropShadowColor: '#222',
                })}
            />
            {/* Happiness bar */}
            {renderHappinessBar()}
        </Stage>
    );
}

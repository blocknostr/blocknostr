// GamesPage.tsx
import React, { useState } from "react";
import { useWallet } from "@alephium/web3-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Gamepad2, X } from "lucide-react";
import { Link } from "react-router-dom";
import SpaceFlyerGame from "@/components/games/spaceflyer/SpaceFlyerGame";

const Modal: React.FC<{
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
}> = ({ open, onClose, children }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
            <div
                className="rounded-lg shadow-2xl p-8 max-w-[720px] w-full relative"
                style={{
                    background: "linear-gradient(135deg, rgba(0, 0, 30, 0.9), rgba(0, 0, 50, 0.7))",
                    backdropFilter: "blur(8px)", // Frosted glass effect
                    border: "1px solid rgba(99, 102, 241, 0.3)",
                }}
            >
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 text-white hover:bg-indigo-500/20 rounded-full"
                    onClick={onClose}
                >
                    <X size={24} />
                </Button>
                <div className="text-center">
                    <h2
                        className="text-3xl font-bold text-white mb-2"
                        style={{ fontFamily: "'Orbitron', sans-serif" }}
                    >
                        SpaceFlyer
                    </h2>
                    <p className="text-white/80 mb-4">
                        Use ← → to move, Space to pause, R to restart
                    </p>
                </div>
                {children}
            </div>
        </div>
    );
};

const GamesPage: React.FC = () => {
    const { account, connectionStatus } = useWallet();
    const isWalletConnected = connectionStatus === "connected" && !!account;
    const [showSpaceFlyer, setShowSpaceFlyer] = useState(false);

    return (
        <div className="container max-w-6xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Games</h1>
                    <p className="text-muted-foreground">
                        Play blockchain-powered games with Nostr integration
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* NostrPet card */}
                <Card className="overflow-hidden transition-transform hover:scale-105">
                    <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                        <div className="flex items-center justify-between">
                            <CardTitle>NostrPet</CardTitle>
                            <Gamepad2 size={24} />
                        </div>
                        <CardDescription className="text-white/80">
                            Virtual pet powered by Nostr
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground mb-4">
                            Raise your own digital pet on the blockchain. Feed, play, and watch
                            it evolve!
                        </p>
                    </CardContent>
                    <CardFooter className="p-4">
                        {isWalletConnected ? (
                            <Button variant="default" size="lg" asChild className="w-full">
                                <Link to="/games/nostrpet">Launch NostrPet</Link>
                            </Button>
                        ) : (
                            <Button variant="outline" size="lg" asChild className="w-full">
                                <Link to="/wallets">Connect Wallet to Play</Link>
                            </Button>
                        )}
                    </CardFooter>
                </Card>

                {/* SpaceFlyer Game card */}
                <Card className="overflow-hidden transition-transform hover:scale-105">
                    <CardHeader className="bg-gradient-to-r from-orange-500 to-pink-500 text-white">
                        <div className="flex items-center justify-between">
                            <CardTitle>SpaceFlyer</CardTitle>
                            <Gamepad2 size={24} />
                        </div>
                        <CardDescription className="text-white/80">
                            Arcade shooter — survive the asteroid field!
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground mb-4">
                            Dodge asteroids and rack up your high score as the SpaceFox!
                        </p>
                    </CardContent>
                    <CardFooter className="p-4">
                        <Button
                            variant="default"
                            size="lg"
                            className="w-full bg-indigo-500 hover:bg-indigo-600"
                            onClick={() => setShowSpaceFlyer(true)}
                        >
                            Play SpaceFlyer
                        </Button>
                    </CardFooter>
                </Card>

                {/* Placeholder for more games */}
                <Card className="overflow-hidden opacity-60">
                    <CardHeader className="bg-gradient-to-r from-gray-500 to-gray-600 text-white">
                        <div className="flex items-center justify-between">
                            <CardTitle>Coming Soon</CardTitle>
                            <Gamepad2 size={24} />
                        </div>
                        <CardDescription className="text-white/80">
                            More games in development
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground mb-4">
                            Stay tuned for more blockchain games with Nostr integration!
                        </p>
                    </CardContent>
                    <CardFooter className="p-4">
                        <Button variant="outline" size="lg" disabled className="w-full">
                            Coming Soon
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            <Modal open={showSpaceFlyer} onClose={() => setShowSpaceFlyer(false)}>
                <SpaceFlyerGame />
            </Modal>
        </div>
    );
};

export default GamesPage;
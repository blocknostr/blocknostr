import React from "react";
import { useWallet } from "@alephium/web3-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import NostrPetGame from "@/components/games/nosterpet/NostrPetGame";

const NostrPetGamePage = () => {
    const { account, connectionStatus } = useWallet();
    const isWalletConnected = connectionStatus === 'connected' && !!account;

    if (!isWalletConnected) {
        return (
            <div className="container max-w-6xl mx-auto px-4 py-8">
                <div className="flex items-center mb-6">
                    <Link to="/games">
                        <Button variant="ghost" size="sm" className="flex items-center gap-1">
                            <ArrowLeft size={16} />
                            Back to Games
                        </Button>
                    </Link>
                </div>

                <div className="flex flex-col items-center justify-center p-8 space-y-4">
                    <h1 className="text-2xl font-bold">Wallet Required</h1>
                    <p className="text-center text-muted-foreground">
                        Please connect your Alephium wallet to play NostrPet.
                    </p>
                    <Button variant="default" size="lg" asChild>
                        <Link to="/wallets">Go to Wallets Page</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container max-w-6xl mx-auto px-4 py-8">
            <div className="flex items-center mb-6">
                <Link to="/games">
                    <Button variant="ghost" size="sm" className="flex items-center gap-1">
                        <ArrowLeft size={16} />
                        Back to Games
                    </Button>
                </Link>
            </div>

            <Card className="overflow-hidden">
                <CardHeader>
                    <CardTitle>NostrPet</CardTitle>
                    <CardDescription>
                        Your virtual pet powered by Nostr and blockchain technology
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <NostrPetGame />
                </CardContent>
            </Card>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">How to Play</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Feed your pet to maintain its hunger level</li>
                            <li>Play with your pet to increase happiness</li>
                            <li>Let your pet rest to restore energy</li>
                            <li>Watch your pet evolve as it gains experience</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Features</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Blockchain persistence keeps your pet safe</li>
                            <li>Nostr integration for social features</li>
                            <li>Multiple evolution stages</li>
                            <li>Customizable pet appearance</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Upcoming Features</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Pet battles with other players</li>
                            <li>Rare item collection</li>
                            <li>Special limited-time events</li>
                            <li>NFT marketplace integration</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default NostrPetGamePage;

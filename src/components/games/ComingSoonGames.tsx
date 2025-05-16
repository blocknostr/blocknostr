
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Swords, Trophy, Users } from "lucide-react";

const games = [
  {
    title: "BlockMatch",
    description: "Match-3 puzzle game with on-chain rewards and leaderboards",
    icon: <Trophy className="h-5 w-5 text-yellow-600" />,
    status: "Development",
    eta: "Q3 2025"
  },
  {
    title: "CryptoQuest",
    description: "Adventure RPG with NFT characters and blockchain quests",
    icon: <Swords className="h-5 w-5 text-blue-600" />,
    status: "Design",
    eta: "Q4 2025"
  },
  {
    title: "NostrChess",
    description: "Chess tournaments with Nostr identity integration",
    icon: <Users className="h-5 w-5 text-green-600" />,
    status: "Planning",
    eta: "Q2 2025"
  },
  {
    title: "Alephium Trading Cards",
    description: "Collectible card game with tradable NFT cards",
    icon: <BookOpen className="h-5 w-5 text-purple-600" />,
    status: "Research",
    eta: "2026"
  }
];

const ComingSoonGames = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {games.map((game, index) => (
        <Card key={index} className="overflow-hidden border-muted bg-muted/20">
          <CardHeader className="bg-muted/30 pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              {game.icon}
              {game.title}
            </CardTitle>
            <CardDescription>{game.description}</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-1">
                <span className="font-semibold">Status:</span>
                <span className="text-muted-foreground">{game.status}</span>
              </div>
              <div className="text-primary">
                <span className="text-xs">Expected</span> {game.eta}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ComingSoonGames;

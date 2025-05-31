import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gamepad2, Trophy, Users, Zap } from 'lucide-react';

const GamesPage = () => {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Games</h1>
        <p className="text-muted-foreground">
          Blockchain-powered games and competitions coming soon to BlockNostr
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-primary" />
              <CardTitle>Nostr Games</CardTitle>
            </div>
            <CardDescription>
              Decentralized gaming experiences built on Nostr protocol
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Play games directly through Nostr events, with scores and achievements 
              stored permanently on the network.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <CardTitle>Tournaments</CardTitle>
            </div>
            <CardDescription>
              Compete in community tournaments and leaderboards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Join competitive tournaments with Bitcoin Lightning Network prizes 
              and community recognition.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <CardTitle>Multiplayer</CardTitle>
            </div>
            <CardDescription>
              Real-time multiplayer games using Nostr relays
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Connect with friends and play real-time games using Nostr's 
              decentralized messaging infrastructure.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" />
              <CardTitle>Lightning Games</CardTitle>
            </div>
            <CardDescription>
              Micro-transaction powered gaming experiences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Play games with Lightning Network integration for instant 
              micropayments and rewards.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center">
        <Card>
          <CardContent className="pt-6">
            <Gamepad2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
            <p className="text-muted-foreground">
              Games functionality is currently in development. Stay tuned for exciting 
              blockchain-powered gaming experiences!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GamesPage; 

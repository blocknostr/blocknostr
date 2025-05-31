import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Check, Zap, Shield, Star, Rocket } from 'lucide-react';

const PremiumPage = () => {
  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Crown className="h-8 w-8 text-yellow-600" />
          <h1 className="text-4xl font-bold">BlockNostr Premium</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Unlock the full potential of decentralized social networking with premium features
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {/* Free Tier */}
        <Card className="relative">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-blue-500" />
              Free
            </CardTitle>
            <CardDescription>Perfect for getting started</CardDescription>
            <div className="text-3xl font-bold">$0</div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Basic Nostr posting</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Community participation</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Article reading</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Basic wallet features</span>
              </li>
            </ul>
            <Button className="w-full mt-6" variant="outline">
              Current Plan
            </Button>
          </CardContent>
        </Card>

        {/* Premium Tier */}
        <Card className="relative border-primary shadow-lg">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
              Most Popular
            </span>
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-600" />
              Premium
            </CardTitle>
            <CardDescription>Enhanced features for power users</CardDescription>
            <div className="text-3xl font-bold">$5<span className="text-lg font-normal text-muted-foreground">/month</span></div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Everything in Free</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Advanced analytics</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Priority relay access</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Enhanced community tools</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Article publishing</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Custom themes</span>
              </li>
            </ul>
            <Button className="w-full mt-6">
              Upgrade to Premium
            </Button>
          </CardContent>
        </Card>

        {/* Pro Tier */}
        <Card className="relative">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-purple-500" />
              Pro
            </CardTitle>
            <CardDescription>For creators and businesses</CardDescription>
            <div className="text-3xl font-bold">$9<span className="text-lg font-normal text-muted-foreground">/month</span></div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Everything in Premium</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Advanced monetization</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">API access</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">White-label options</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Priority support</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Advanced integrations</span>
              </li>
            </ul>
            <Button className="w-full mt-6" variant="outline">
              Contact Sales
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <CardTitle className="text-lg">Lightning Fast</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Premium users get priority access to our fastest relays and enhanced performance.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              <CardTitle className="text-lg">Enhanced Security</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Advanced security features including backup solutions and enhanced encryption.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-lg">Exclusive Access</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Get early access to new features and exclusive premium-only communities.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 text-center">
        <Card>
          <CardContent className="pt-6">
            <Crown className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
            <h3 className="text-lg font-semibold mb-2">Celebrating Alephium's Danube Upgrade</h3>
            <p className="text-muted-foreground mb-4">
              To celebrate Alephium's Danube Upgrade, we are giving everyone full-access to all our tools and services.
            </p>
            <p className="text-muted-foreground mb-4">
              We are here to help push decentralization, and censorship-resistant protocols. Help us grow this website, consider sending a donation in ALPH or in SATS.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline">
                Donate ALPH
              </Button>
              <Button variant="outline">
                Donate SATS
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PremiumPage;


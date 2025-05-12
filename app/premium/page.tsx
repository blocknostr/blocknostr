
'use client';

import React from "react";
import PremiumSubscribeButton from "@/components/premium/PremiumSubscribeButton";
import PageHeader from "@/components/navigation/PageHeader";

export default function PremiumPage() {
  return (
    <>
      <PageHeader 
        title="Premium"
        showBackButton={true}
      />
      
      <div className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="flex flex-col items-center justify-center space-y-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Upgrade to BlockNoster Premium</h2>
            <p className="text-muted-foreground max-w-md">
              Enhance your BlockNoster experience with exclusive features, priority access, and premium support.
            </p>
            
            <div className="w-full max-w-md my-8">
              <PremiumSubscribeButton />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg mt-8">
              <div className="p-4 border rounded-lg bg-card">
                <h3 className="font-medium mb-2">Ad-Free Experience</h3>
                <p className="text-sm text-muted-foreground">Enjoy BlockNoster without any advertisements</p>
              </div>
              <div className="p-4 border rounded-lg bg-card">
                <h3 className="font-medium mb-2">Exclusive Features</h3>
                <p className="text-sm text-muted-foreground">Access to premium-only tools and capabilities</p>
              </div>
              <div className="p-4 border rounded-lg bg-card">
                <h3 className="font-medium mb-2">Priority Support</h3>
                <p className="text-sm text-muted-foreground">Get help faster with dedicated premium support</p>
              </div>
              <div className="p-4 border rounded-lg bg-card">
                <h3 className="font-medium mb-2">Custom Badges</h3>
                <p className="text-sm text-muted-foreground">Show off your premium status with exclusive badges</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


'use client';

import React from "react";
import PageHeader from "@/components/navigation/PageHeader";

export default function WalletsPage() {
  return (
    <>
      <PageHeader 
        title="Wallets"
        showBackButton={true}
      />
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Alephium Wallet Integration</h2>
            <p className="text-muted-foreground">
              Manage your ALPH tokens and interact with the Alephium blockchain
            </p>
          </div>
          
          {/* Wallet content will be implemented in future updates */}
          <div className="border rounded-lg p-6 text-center">
            <p>Wallet functionality coming soon</p>
          </div>
        </div>
      </div>
    </>
  );
}

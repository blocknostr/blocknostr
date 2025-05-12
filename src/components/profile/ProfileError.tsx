
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Sidebar from "@/components/Sidebar";

interface ProfileErrorProps {
  error: string;
  onRetry: () => void;
}

const ProfileError = ({ error, onRetry }: ProfileErrorProps) => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 ml-0 md:ml-64">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              
              <h2 className="text-xl font-semibold mb-2">Profile Error</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              
              <div className="flex space-x-4">
                <Button onClick={onRetry} className="flex items-center">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                
                <Button variant="outline" asChild>
                  <Link to="/" className="flex items-center">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go Home
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfileError;

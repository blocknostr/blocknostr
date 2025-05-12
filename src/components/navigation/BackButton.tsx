
'use client';

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useNavigation } from "@/contexts/NavigationContext";

interface BackButtonProps {
  fallbackPath?: string;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  showText?: boolean;
  forceHome?: boolean;
}

const BackButton: React.FC<BackButtonProps> = ({ 
  fallbackPath = "/", 
  className = "",
  variant = "ghost",
  showText = false,
  forceHome = false
}) => {
  const router = useRouter();
  const { goBack, canGoBack, parentRoute } = useNavigation();
  const isClient = typeof window !== 'undefined';
  const pathname = isClient ? window.location.pathname : "/";
  const isHomePage = pathname === "/";

  const handleClick = () => {
    // If forceHome is true, always navigate to home
    if (forceHome) {
      router.push("/");
      return;
    }

    // If we can go back in history, use that
    if (canGoBack) {
      goBack();
    } 
    // Otherwise use the fallback or parent route
    else if (fallbackPath) {
      router.push(fallbackPath);
    } 
    // Finally, use the detected parent route
    else if (parentRoute) {
      router.push(parentRoute);
    }
    // Last resort - go home
    else {
      router.push("/");
    }
  };

  // Determine what text to show based on where the button will navigate
  const getButtonText = () => {
    if (forceHome) return "Home";
    if (canGoBack) return "Back";
    if (fallbackPath === "/") return "Home";
    if (parentRoute === "/") return "Home";
    return "Back";
  };

  return (
    <Button
      variant={variant}
      size="sm"
      className={`flex items-center gap-1 ${className}`}
      onClick={handleClick}
      aria-label={forceHome ? "Go back to home" : "Go back"}
    >
      <ArrowLeft className="h-4 w-4" />
      {showText && <span>{getButtonText()}</span>}
    </Button>
  );
};

export default BackButton;

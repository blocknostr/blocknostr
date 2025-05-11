
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BackButtonProps {
  fallbackPath?: string;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  showText?: boolean;
}

const BackButton: React.FC<BackButtonProps> = ({ 
  fallbackPath = "/", 
  className = "",
  variant = "ghost",
  showText = false
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // Always navigate to home
    navigate("/");
  };

  return (
    <Button
      variant={variant}
      size="sm"
      className={`flex items-center gap-1 ${className}`}
      onClick={handleClick}
      aria-label="Go back to home"
    >
      <ArrowLeft className="h-4 w-4" />
      {showText && <span>Home</span>}
    </Button>
  );
};

export default BackButton;


import React from 'react';
import { Menu } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface MobileMenuButtonProps {
  onClick: () => void;
}

const MobileMenuButton: React.FC<MobileMenuButtonProps> = ({ onClick }) => {
  return (
    <Button variant="ghost" size="icon" className="md:hidden" onClick={onClick}>
      <Menu className="h-5 w-5" />
    </Button>
  );
};

export default MobileMenuButton;

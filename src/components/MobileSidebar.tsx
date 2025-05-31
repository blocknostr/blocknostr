
import React from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import Sidebar from "@/components/sidebar/Sidebar";
import { useSwipeable } from "@/hooks/ui/use-swipeable";

interface MobileSidebarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const MobileSidebar = ({ isOpen, onOpenChange }: MobileSidebarProps) => {
  // Add swipe to close functionality
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (isOpen) {
        onOpenChange(false);
      }
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: false,
    swipeThreshold: 10, // More sensitive for iOS
    swipeDuration: 250
  });

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="p-0 ios-safe-padding-top ios-safe-padding-bottom" {...swipeHandlers}>
        <div className="h-full overscroll-none">
          <Sidebar />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileSidebar;


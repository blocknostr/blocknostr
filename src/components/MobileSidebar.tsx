
import React from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import Sidebar from "@/components/sidebar/Sidebar";

interface MobileSidebarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const MobileSidebar = ({ isOpen, onOpenChange }: MobileSidebarProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="p-0">
        <Sidebar />
      </SheetContent>
    </Sheet>
  );
};

export default MobileSidebar;

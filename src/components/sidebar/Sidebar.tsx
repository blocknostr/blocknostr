import * as React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import SidebarNav from "./SidebarNav";
import SidebarUserProfile from "./SidebarUserProfile";
import { useSidebarProfile } from "./useSidebarProfile";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Sheet, SheetContent } from "@/components/ui/sheet"; // Added Sheet imports

interface SidebarProps {
  isOpen?: boolean; // Prop to control mobile sheet visibility
  onClose?: () => void; // Prop to handle closing mobile sheet
  // className prop can be optionally added if MainLayout needs to pass specific classes for the Sheet trigger or container
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const isMobile = useIsMobile();
  const { isLoggedIn, userProfile, isLoading } = useSidebarProfile();

  const sidebarContent = (
    // Removed h-full from here, will be controlled by parent (aside or SheetContent)
    <div className="flex flex-col px-4 py-4 flex-grow"> {/* Added flex-grow to fill height */}
      {/* Theme-aware, thick wordmark with subtle white glow */}
      <div className="mb-6 flex items-center justify-center">
        <Link
          to="/"
          className={cn(
            "text-3xl",
            "font-extrabold",
            "tracking-tight",
            "hover:opacity-80 transition-opacity",
            "filter drop-shadow-[0_0_4px_rgba(255,255,255,0.4)]",
            "text-black dark:text-white"
          )}
        >
          BlockNostr
        </Link>
      </div>

      <SidebarNav isLoggedIn={isLoggedIn} />

      <div className="mt-auto pt-4 space-y-2"> {/* User Profile at bottom */}
        {isLoggedIn && (
          <ErrorBoundary
            fallback={
              <div className="p-2 text-sm text-muted-foreground">
                Failed to load profile
              </div>
            }
          >
            <SidebarUserProfile
              userProfile={userProfile}
              isLoading={isLoading}
            />
          </ErrorBoundary>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={(openStatus) => {
        if (!openStatus && onClose) {
          onClose();
        }
      }}>
        <SheetContent side="left" className="w-64 p-0 flex flex-col"> {/* Ensure SheetContent is flex col and remove padding */}
          {sidebarContent}
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop view
  return (
    <aside
      className={cn(
        "w-64 flex-shrink-0 border-r bg-background h-screen sticky top-0 overflow-y-auto", // Desktop specific: sticky, full height
        "hidden md:flex md:flex-col" // Ensures it's a flex column on desktop
      )}
    >
      {sidebarContent}
    </aside>
  );
};

export default Sidebar;

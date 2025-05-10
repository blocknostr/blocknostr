
import { Link } from "react-router-dom";
import { 
  Home, 
  Bell, 
  Mail, 
  User, 
  Users, 
  Settings, 
  FileText, 
  Wallet, 
  Bookmark, 
  Crown 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { nostrService } from "@/lib/nostr";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";

const Sidebar = () => {
  const isLoggedIn = !!nostrService.publicKey;
  const location = useLocation();
  const isMobile = useIsMobile();
  const [userProfile, setUserProfile] = useState<{
    name?: string;
    displayName?: string;
    picture?: string;
    nip05?: string;
  }>({});
  
  // Force profile refresh when route changes, user logs in, or after 30 seconds
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (isLoggedIn) {
        try {
          const profile = await nostrService.getUserProfile(nostrService.publicKey);
          if (profile) {
            setUserProfile({
              name: profile.name,
              displayName: profile.display_name,
              picture: profile.picture,
              nip05: profile.nip05
            });
          }
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
        }
      }
    };
    
    fetchUserProfile();
    
    // Set up an interval to periodically refresh the profile
    const intervalId = setInterval(fetchUserProfile, 30000);
    
    return () => clearInterval(intervalId);
  }, [isLoggedIn, location.pathname]);
  
  const navItems = [
    {
      name: "Home",
      icon: Home,
      href: "/",
      requiresAuth: false
    },
    {
      name: "Wallets",
      icon: Wallet,
      href: "/wallets",
      requiresAuth: true
    },
    {
      name: "Notifications",
      icon: Bell,
      href: "/notifications",
      requiresAuth: true
    },
    {
      name: "BlockMail",
      icon: Mail,
      href: "/messages",
      requiresAuth: true
    },
    {
      name: "Bookmarks",
      icon: Bookmark,
      href: "/bookmarks",
      requiresAuth: true
    },
    {
      name: "Communities",
      icon: Users,
      href: "/communities",
      requiresAuth: false
    },
    {
      name: "Notebin",
      icon: FileText,
      href: "/notebin",
      requiresAuth: false
    },
    {
      name: "Premium",
      icon: Crown,
      href: "/premium",
      requiresAuth: false
    },
    {
      name: "Profile",
      icon: User,
      href: "/profile",
      requiresAuth: true
    },
    {
      name: "Settings",
      icon: Settings,
      href: "/settings",
      requiresAuth: false
    }
  ];
  
  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (userProfile.displayName || userProfile.name) {
      const name = (userProfile.displayName || userProfile.name || '').trim();
      if (name) {
        return name.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2);
      }
    }
    return 'U';
  };
  
  return (
    <aside className={cn(
      "border-r h-full py-4 bg-background",
      isMobile ? "w-full" : "w-64 fixed left-0 top-0 hidden md:block"
    )}>
      <div className="flex flex-col h-full px-4">
        <div className="mb-6">
          <Link to="/" className="text-2xl font-bold text-primary hover:opacity-80 transition-opacity">
            BlockNostr
          </Link>
        </div>
        
        <nav className="flex-1">
          <ul className="space-y-2">
            {navItems.map((item) => {
              if (item.requiresAuth && !isLoggedIn) {
                return null;
              }
              
              const isActive = location.pathname === item.href;
              
              return (
                <li key={item.name}>
                  <Link to={item.href}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start text-left font-medium",
                        isActive ? "bg-accent text-accent-foreground" : ""
                      )}
                    >
                      <item.icon className="mr-2 h-5 w-5" />
                      {item.name}
                    </Button>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="mt-auto pt-4 space-y-2">
          {isLoggedIn && (
            <Link to="/profile">
              <div className="flex items-center gap-3 px-2 py-2 hover:bg-accent rounded-md transition-colors">
                <Avatar>
                  <AvatarImage src={userProfile.picture} alt={userProfile.displayName || userProfile.name || 'User'} />
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium text-sm truncate max-w-[140px]">
                    {userProfile.displayName || userProfile.name || 'User'}
                  </span>
                  {userProfile.nip05 && (
                    <span className="text-xs text-muted-foreground truncate max-w-[140px]">{userProfile.nip05}</span>
                  )}
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

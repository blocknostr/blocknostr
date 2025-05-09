
import { Link } from "react-router-dom";
import { Home, Hash, Bell, Mail, User, Users, Settings, FileText, BookOpen, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { nostrService } from "@/lib/nostr";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

const Sidebar = () => {
  const isLoggedIn = !!nostrService.publicKey;
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(true);
  
  // Toggle dark mode function
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Set initial dark mode state based on html class
  useEffect(() => {
    setDarkMode(document.documentElement.classList.contains('dark'));
  }, []);
  
  const navItems = [
    {
      name: "Home",
      icon: Home,
      href: "/",
      requiresAuth: false
    },
    {
      name: "Explore",
      icon: Hash,
      href: "/explore",
      requiresAuth: false
    },
    {
      name: "Notifications",
      icon: Bell,
      href: "/notifications",
      requiresAuth: true
    },
    {
      name: "Messages",
      icon: Mail,
      href: "/messages",
      requiresAuth: true
    },
    {
      name: "Profile",
      icon: User,
      href: "/profile",
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
      name: "Articles",
      icon: BookOpen,
      href: "/articles",
      requiresAuth: false
    },
    {
      name: "Settings",
      icon: Settings,
      href: "/settings",
      requiresAuth: false
    }
  ];
  
  return (
    <aside className="w-64 border-r h-full fixed left-0 top-0 py-4 bg-background hidden md:block">
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
          <Button 
            variant="outline"
            size="icon"
            className="w-full flex justify-between"
            onClick={toggleDarkMode}
          >
            {darkMode ? (
              <>
                Light Mode
                <Sun className="h-5 w-5" />
              </>
            ) : (
              <>
                Dark Mode
                <Moon className="h-5 w-5" />
              </>
            )}
          </Button>
          
          {isLoggedIn && (
            <Button 
              className="w-full"
              onClick={() => { window.location.href = "/compose"; }}
            >
              Post
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

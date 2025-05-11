
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useNavigation } from "@/contexts/NavigationContext";
import PageBreadcrumbs from "@/components/navigation/PageBreadcrumbs";

const AppBreadcrumbs: React.FC = () => {
  const location = useLocation();
  const { parentRoute, getParentRoute } = useNavigation();
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{label: string; path: string; isCurrentPage?: boolean}>>([]);

  // Generate breadcrumbs based on current location
  useEffect(() => {
    const path = location.pathname;
    const newBreadcrumbs = [];
    
    // Skip breadcrumbs for home page
    if (path === '/') {
      setBreadcrumbs([]);
      return;
    }
    
    // Add current page
    const pageName = getPageTitle(path);
    
    // If we're on a deep path, add the parent
    if (parentRoute && parentRoute !== '/') {
      // Get the parent page title
      const parentPathParts = parentRoute.split('/').filter(Boolean);
      const parentName = parentPathParts.length > 0 ? 
        parentPathParts[parentPathParts.length - 1].charAt(0).toUpperCase() + 
        parentPathParts[parentPathParts.length - 1].slice(1) : 
        "Home";
      
      newBreadcrumbs.push({
        label: parentName,
        path: parentRoute,
      });
    }
    
    // Add current page to breadcrumbs
    newBreadcrumbs.push({
      label: pageName,
      path: path,
      isCurrentPage: true
    });
    
    setBreadcrumbs(newBreadcrumbs);
  }, [location.pathname, parentRoute]);

  // Determine page title based on current route
  const getPageTitle = (path: string) => {
    if (path === "/") return "Home";
    if (path.startsWith("/profile")) return "Profile";
    if (path.startsWith("/settings")) return "Settings";
    if (path.startsWith("/communities")) {
      if (path === "/communities") return "Communities";
      // Extract community name from path if possible
      const parts = path.split('/');
      if (parts.length > 2 && parts[2]) {
        return parts[2].charAt(0).toUpperCase() + parts[2].slice(1);
      }
      return "Community";
    }
    if (path.startsWith("/messages")) return "Messages";
    if (path.startsWith("/notifications")) return "Notifications";
    if (path.startsWith("/notebin")) return "Notebin";
    if (path.startsWith("/wallets")) return "Wallets";
    if (path.startsWith("/premium")) return "Premium";
    if (path.startsWith("/post")) return "Post";
    
    return "BlockNoster";
  };

  // Show breadcrumbs only on deeper pages, not top-level sections
  const shouldShowBreadcrumbs = () => breadcrumbs.length > 1;

  if (!shouldShowBreadcrumbs()) {
    return null;
  }

  return (
    <div className="px-4 py-2 bg-background">
      <PageBreadcrumbs items={breadcrumbs} />
    </div>
  );
};

export default AppBreadcrumbs;

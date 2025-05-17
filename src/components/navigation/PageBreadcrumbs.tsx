
import React from "react";
import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export interface BreadcrumbItem {
  label: string;
  path: string;
  isCurrentPage?: boolean;
}

interface PageBreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

const PageBreadcrumbs: React.FC<PageBreadcrumbsProps> = ({ 
  items,
  className = ""
}) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList className="flex-wrap">
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        <BreadcrumbSeparator />
        
        {items.map((item, index) => (
          <React.Fragment key={item.path}>
            <BreadcrumbItem>
              {item.isCurrentPage ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={item.path} className="hover:text-primary transition-colors">{item.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            
            {index < items.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default PageBreadcrumbs;

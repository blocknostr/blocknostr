
import React from 'react';
import { Link as RouterLink, LinkProps as RouterLinkProps } from 'react-router-dom';

// Define proper types for the Next.js Link component props
interface NextLinkProps extends Omit<RouterLinkProps, 'to'> {
  href: string;
  as?: string;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  passHref?: boolean;
  prefetch?: boolean;
  locale?: string;
  children: React.ReactNode;
}

// Create a Link component that mimics Next.js Link API but uses react-router-dom
const Link = React.forwardRef<HTMLAnchorElement, NextLinkProps>(({ 
  href, 
  as,
  replace, 
  scroll, 
  shallow,
  passHref,
  prefetch,
  locale,
  children,
  ...rest 
}, ref) => {
  return (
    <RouterLink 
      to={href} 
      replace={replace} 
      ref={ref}
      {...rest}
    >
      {children}
    </RouterLink>
  );
});

Link.displayName = 'Link';

export default Link;

// For compatibility with imports like: import { Link } from "next/link"
export { default as Link } from './Link';

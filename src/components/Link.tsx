
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

// Create a Link component that mimics Next.js Link API but uses react-router-dom
const Link = React.forwardRef(({ 
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

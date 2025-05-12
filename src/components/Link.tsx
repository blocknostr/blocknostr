
import React from 'react';
import NextLink, { LinkProps as NextLinkProps } from 'next/link';

// Define proper types for the Next.js Link component props
interface LinkProps extends Omit<NextLinkProps, 'href'> {
  href: string;
  as?: string;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  passHref?: boolean;
  prefetch?: boolean;
  locale?: string;
  children: React.ReactNode;
  className?: string;
}

// Create a Link component that uses Next.js Link
const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(({ 
  href, 
  as,
  replace, 
  scroll, 
  shallow,
  passHref,
  prefetch,
  locale,
  children,
  className,
  ...rest 
}, ref) => {
  return (
    <NextLink 
      href={href} 
      as={as}
      replace={replace}
      scroll={scroll} 
      shallow={shallow}
      prefetch={prefetch}
      locale={locale}
      passHref={passHref || true}
      {...rest}
    >
      <a ref={ref} className={className}>
        {children}
      </a>
    </NextLink>
  );
});

Link.displayName = 'Link';

export default Link;

// For compatibility with imports like: import { Link } from "next/link"
export { Link };

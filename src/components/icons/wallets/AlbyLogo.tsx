
import React from "react";

const AlbyLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 64 64" 
      width="100%" 
      height="100%"
      fill="currentColor"
      {...props}
    >
      <circle cx="32" cy="32" r="30" fill="#F5CD00" />
      <path d="M32 12L18 36h28L32 12zm0 10l7 14H25l7-14z" fill="#FFFFFF" />
    </svg>
  );
};

export default AlbyLogo;

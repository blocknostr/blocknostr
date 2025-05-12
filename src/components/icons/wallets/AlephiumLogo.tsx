
import React from "react";

const AlephiumLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 64 64" 
      width="100%" 
      height="100%"
      fill="currentColor"
      {...props}
    >
      <circle cx="32" cy="32" r="30" fill="#10B981" />
      <path d="M44 20H20v24h24V20zm-18 6h6v6h-6v-6zm0 12h6v-6h-6v6zm12 0h6v-6h-6v6zm6-12h-6v6h6v-6z" fill="white" />
    </svg>
  );
};

export default AlephiumLogo;

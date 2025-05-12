
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
      <path d="M32 15L19 36h26L32 15zm0 9l6 12H26l6-12z" fill="white" />
      <path d="M27 40h10v6H27v-6z" fill="white" />
    </svg>
  );
};

export default AlephiumLogo;

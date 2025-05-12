
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
      <path d="M32 2C15.432 2 2 15.432 2 32s13.432 30 30 30 30-13.432 30-30S48.568 2 32 2zm12.93 32.42L32 44.75 19.07 34.92 32 11.792l12.93 22.628z" fill="#FFB300"/>
      <path d="M32 23.509L26.062 34.35h11.876L32 23.509z" fill="#FFF2CC"/>
    </svg>
  );
};

export default AlbyLogo;

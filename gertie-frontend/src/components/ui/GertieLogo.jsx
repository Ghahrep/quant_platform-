import React from "react";

export const GertieLogo = ({ className = "w-10 h-10" }) => (
  <svg
    className={className}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="50" cy="50" r="40" fill="#FBBF24" />
    <text
      x="50"
      y="58"
      textAnchor="middle"
      fill="#1F2937"
      fontSize="24"
      fontWeight="bold"
    >
      G
    </text>
  </svg>
);

export default GertieLogo;

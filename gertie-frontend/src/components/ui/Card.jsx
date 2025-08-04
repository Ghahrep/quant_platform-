import React from "react";

export const Card = ({ children, className = "" }) => (
  <div
    className={`bg-slate-800/50 rounded-xl p-4 sm:p-6 shadow-lg backdrop-blur-sm ${className}`}
  >
    {children}
  </div>
);

export default Card;

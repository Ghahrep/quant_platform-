import React from "react";
import { Card } from "./Card";

export const ChartCard = ({ title, children, className = "" }) => (
  <Card className={className}>
    <h3 className="text-slate-300 text-lg font-semibold mb-4">{title}</h3>
    <div className="h-60">{children}</div>
  </Card>
);

export default ChartCard;

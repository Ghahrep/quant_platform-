import React from "react";
import { Card } from "./Card";

export const MetricCard = ({ title, value, subValue, change }) => (
  <Card>
    <div className="flex justify-between items-start">
      <h3 className="text-slate-400 text-sm sm:text-base font-medium">
        {title}
      </h3>
      {change && (
        <span
          className={`text-xs font-semibold ${change > 0 ? "text-green-400" : "text-red-400"}`}
        >
          {change > 0 ? "+" : ""}
          {(change * 100).toFixed(1)}%
        </span>
      )}
    </div>
    <p className="text-2xl sm:text-3xl font-bold text-white mt-2">{value}</p>
    {subValue && <p className="text-slate-400 text-sm mt-1">{subValue}</p>}
  </Card>
);

export default MetricCard;

// src/components/charts/PortfolioPerformanceChart.tsx
import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { formatCurrency, formatPercent } from '../../services/api/portfolioApi';

interface PerformanceDataPoint {
  date: string;
  value: number;
  dailyReturn: number;
  benchmark?: number;
}

interface PortfolioPerformanceChartProps {
  data: PerformanceDataPoint[];
  height?: number;
  showBenchmark?: boolean;
  timeframe?: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';
  className?: string;
}

// Sample data generator for demonstration
const generateSampleData = (days: number): PerformanceDataPoint[] => {
  const data: PerformanceDataPoint[] = [];
  let currentValue = 847293; // Starting portfolio value
  let currentBenchmark = 100; // Starting benchmark at 100
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    
    // Simulate daily returns with some volatility
    const dailyReturn = (Math.random() - 0.5) * 0.04; // ±2% daily volatility
    const benchmarkReturn = (Math.random() - 0.5) * 0.02; // ±1% benchmark volatility
    
    currentValue *= (1 + dailyReturn);
    currentBenchmark *= (1 + benchmarkReturn);
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(currentValue),
      dailyReturn: dailyReturn * 100,
      benchmark: Math.round(currentBenchmark * 10) / 10, // Scale benchmark to percentage
    });
  }
  
  return data;
};

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-48">
        <p className="text-sm font-medium text-gray-900 mb-2">
          {new Date(label).toLocaleDateString('en-US', { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })}
        </p>
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Portfolio Value:</span>
            <span className="text-sm font-semibold text-blue-600">
              {formatCurrency(data.value)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Daily Return:</span>
            <span className={`text-sm font-semibold ${
              data.dailyReturn >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatPercent(data.dailyReturn)}
            </span>
          </div>
          {data.benchmark && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Benchmark:</span>
              <span className="text-sm font-semibold text-gray-600">
                {data.benchmark.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const PortfolioPerformanceChart: React.FC<PortfolioPerformanceChartProps> = ({
  data: propData,
  height = 400,
  showBenchmark = false,
  timeframe = '1M',
  className = ''
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  
  // Generate sample data if none provided (for demonstration)
  const sampleData = useMemo(() => {
    const days = {
      '1D': 1,
      '1W': 7,
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 365,
      'ALL': 730
    };
    return generateSampleData(days[selectedTimeframe]);
  }, [selectedTimeframe]);
  
  const data = propData.length > 0 ? propData : sampleData;
  
  const timeframeOptions = [
    { value: '1D', label: '1D' },
    { value: '1W', label: '1W' },
    { value: '1M', label: '1M' },
    { value: '3M', label: '3M' },
    { value: '6M', label: '6M' },
    { value: '1Y', label: '1Y' },
    { value: 'ALL', label: 'ALL' }
  ];
  
  // Calculate performance metrics
  const startValue = data[0]?.value || 0;
  const endValue = data[data.length - 1]?.value || 0;
  const totalReturn = ((endValue - startValue) / startValue * 100);
  const isPositive = totalReturn >= 0;
  
  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Portfolio Performance</h3>
          <div className="flex items-center space-x-4 mt-1">
            <span className="text-2xl font-bold text-gray-900">
              {formatCurrency(endValue)}
            </span>
            <span className={`text-sm font-medium px-2 py-1 rounded-full ${
              isPositive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {isPositive ? '+' : ''}{totalReturn.toFixed(2)}%
            </span>
          </div>
        </div>
        
        {/* Timeframe Selector */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {timeframeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedTimeframe(option.value as any)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 ${
                selectedTimeframe === option.value
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop 
                  offset="5%" 
                  stopColor={isPositive ? "#10b981" : "#ef4444"} 
                  stopOpacity={0.3}
                />
                <stop 
                  offset="95%" 
                  stopColor={isPositive ? "#10b981" : "#ef4444"} 
                  stopOpacity={0.05}
                />
              </linearGradient>
              <linearGradient id="benchmarkGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6b7280" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#6b7280" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => {
                const date = new Date(value);
                if (selectedTimeframe === '1D') return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                if (selectedTimeframe === '1W') return date.toLocaleDateString('en-US', { weekday: 'short' });
                if (selectedTimeframe === '1M') return date.getDate().toString();
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Portfolio Performance Area */}
            <Area
              type="monotone"
              dataKey="value"
              stroke={isPositive ? "#10b981" : "#ef4444"}
              strokeWidth={3}
              fill="url(#portfolioGradient)"
              dot={false}
              activeDot={{ 
                r: 6, 
                stroke: isPositive ? "#10b981" : "#ef4444",
                strokeWidth: 2,
                fill: 'white'
              }}
            />
            
            {/* Benchmark Line (optional) */}
            {showBenchmark && (
              <Line
                type="monotone"
                dataKey="benchmark"
                stroke="#6b7280"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 4, stroke: "#6b7280", strokeWidth: 2, fill: 'white' }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center mt-4 space-x-6">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${
            isPositive ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <span className="text-sm text-gray-600">Portfolio</span>
        </div>
        {showBenchmark && (
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Benchmark</span>
          </div>
        )}
      </div>
    </div>
  );
};
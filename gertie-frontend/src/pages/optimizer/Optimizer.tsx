// src/pages/portfolio/PortfolioOptimizer.tsx
import React, { useState } from 'react';
import { Search, Filter, BarChart3, TrendingUp, Download, RotateCcw } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

interface Asset {
  symbol: string;
  name: string;
  sector: string;
  marketCap: 'Large' | 'Mid' | 'Small';
  expectedReturn: number;
  volatility: number;
  selected: boolean;
}

interface OptimizationResult {
  weights: { symbol: string; weight: number }[];
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
}

export const PortfolioOptimizer: React.FC = () => {
  const [assets] = useState<Asset[]>([
    { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', marketCap: 'Large', expectedReturn: 12.5, volatility: 25.3, selected: false },
    { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', marketCap: 'Large', expectedReturn: 11.8, volatility: 22.1, selected: false },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', marketCap: 'Large', expectedReturn: 13.2, volatility: 28.7, selected: false },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Discretionary', marketCap: 'Large', expectedReturn: 14.1, volatility: 31.2, selected: false },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'Technology', marketCap: 'Large', expectedReturn: 18.9, volatility: 45.6, selected: false },
    { symbol: 'JPM', name: 'JPMorgan Chase', sector: 'Financial Services', marketCap: 'Large', expectedReturn: 9.8, volatility: 28.4, selected: false },
    { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', marketCap: 'Large', expectedReturn: 7.2, volatility: 16.8, selected: false },
    { symbol: 'V', name: 'Visa Inc.', sector: 'Financial Services', marketCap: 'Large', expectedReturn: 10.5, volatility: 24.9, selected: false },
  ]);

  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [objective, setObjective] = useState<'maxSharpe' | 'minVol' | 'maxReturn'>('maxSharpe');
  const [riskFreeRate, setRiskFreeRate] = useState(3.5);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const toggleAsset = (symbol: string) => {
    const newSelected = new Set(selectedAssets);
    if (newSelected.has(symbol)) {
      newSelected.delete(symbol);
    } else {
      newSelected.add(symbol);
    }
    setSelectedAssets(newSelected);
  };

  const runOptimization = async () => {
    if (selectedAssets.size < 2) return;
    
    setIsOptimizing(true);
    
    // Simulate optimization delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock optimization results
    const selectedAssetsList = Array.from(selectedAssets);
    const weights = selectedAssetsList.map((symbol) => ({
      symbol,
      weight: Math.random() * 40 + 5 // Random weights between 5-45%
    }));
    
    // Normalize weights to sum to 100%
    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
    weights.forEach(w => w.weight = (w.weight / totalWeight) * 100);
    
    const result: OptimizationResult = {
      weights: weights.sort((a, b) => b.weight - a.weight),
      expectedReturn: 8.5 + Math.random() * 6, // 8.5-14.5%
      volatility: 12 + Math.random() * 8, // 12-20%
      sharpeRatio: 0.6 + Math.random() * 0.8 // 0.6-1.4
    };
    
    setOptimizationResult(result);
    setIsOptimizing(false);
  };

  const resetOptimization = () => {
    setSelectedAssets(new Set());
    setOptimizationResult(null);
  };

  const selectedCount = selectedAssets.size;

  return (
    <div className="h-full p-6 space-y-6 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Portfolio Optimizer</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Modern Portfolio Theory optimization with efficient frontier analysis
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="ghost" onClick={resetOptimization}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Selection */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Asset Selection ({selectedCount} selected)
              </h2>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm">
                  <Search className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {assets.map((asset) => {
                const isSelected = selectedAssets.has(asset.symbol);
                return (
                  <div
                    key={asset.symbol}
                    onClick={() => toggleAsset(asset.symbol)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded border-gray-300"
                        />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {asset.symbol}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {asset.name}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" size="sm">
                        {asset.sector}
                      </Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Return:</span>
                        <span className="ml-1 font-medium text-green-600">
                          {asset.expectedReturn.toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Vol:</span>
                        <span className="ml-1 font-medium text-orange-600">
                          {asset.volatility.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Optimization Controls */}
        <div className="space-y-4">
          <Card>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Optimization Settings
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Objective Function
                </label>
                <select
                  value={objective}
                  onChange={(e) => setObjective(e.target.value as any)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="maxSharpe">Maximize Sharpe Ratio</option>
                  <option value="minVol">Minimize Volatility</option>
                  <option value="maxReturn">Maximize Return</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Risk-Free Rate: {riskFreeRate.toFixed(1)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="8"
                  step="0.1"
                  value={riskFreeRate}
                  onChange={(e) => setRiskFreeRate(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <Button
                onClick={runOptimization}
                disabled={selectedCount < 2 || isOptimizing}
                className="w-full"
              >
                {isOptimizing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Run Optimization
                  </>
                )}
              </Button>

              {selectedCount < 2 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Select at least 2 assets to optimize
                </p>
              )}
            </div>
          </Card>

          {/* Results */}
          {optimizationResult && (
            <Card>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Optimization Results
              </h3>
              
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                    <div className="text-xs text-green-600 dark:text-green-400">Return</div>
                    <div className="font-semibold text-green-900 dark:text-green-100">
                      {optimizationResult.expectedReturn.toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                    <div className="text-xs text-orange-600 dark:text-orange-400">Risk</div>
                    <div className="font-semibold text-orange-900 dark:text-orange-100">
                      {optimizationResult.volatility.toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <div className="text-xs text-blue-600 dark:text-blue-400">Sharpe</div>
                    <div className="font-semibold text-blue-900 dark:text-blue-100">
                      {optimizationResult.sharpeRatio.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Optimal Weights
                  </h4>
                  <div className="space-y-2">
                    {optimizationResult.weights.map((weight) => (
                      <div key={weight.symbol} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {weight.symbol}
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${weight.weight}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">
                            {weight.weight.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Efficient Frontier Visualization */}
      {optimizationResult && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Efficient Frontier
            </h2>
            <Button variant="ghost" size="sm">
              <BarChart3 className="w-4 h-4 mr-2" />
              Full Chart View
            </Button>
          </div>
          
          <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center">
            <div className="text-center text-gray-600 dark:text-gray-400">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="font-medium">Efficient Frontier Visualization</p>
              <p className="text-sm mt-1">Risk vs Return scatter plot with optimal portfolio highlighted</p>
              <p className="text-xs mt-2">Connected to Recharts for interactive charts</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default PortfolioOptimizer;
// src/pages/analytics/Analytics.tsx
import React, { useState } from 'react';
import { BarChart3, TrendingUp, Calculator, Settings } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

type AnalysisTab = 'fractal' | 'garch' | 'cvar';

export const Analytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AnalysisTab>('fractal');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const tabs = [
    { id: 'fractal' as const, name: 'Fractal Analysis', icon: TrendingUp },
    { id: 'garch' as const, name: 'GARCH Models', icon: BarChart3 },
    { id: 'cvar' as const, name: 'CVaR Analysis', icon: Calculator },
  ];

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsAnalyzing(false);
  };

  const renderFractalAnalysis = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Asset Selection
          </h3>
          <div className="space-y-3">
            <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700">
              <option>AAPL - Apple Inc.</option>
              <option>MSFT - Microsoft Corp.</option>
              <option>GOOGL - Alphabet Inc.</option>
              <option>AMZN - Amazon.com Inc.</option>
            </select>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Analysis Period
              </label>
              <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700">
                <option>3 Months</option>
                <option>6 Months</option>
                <option>1 Year</option>
                <option>2 Years</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Method
              </label>
              <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700">
                <option>DFA - Detrended Fluctuation Analysis</option>
                <option>R/S Analysis</option>
                <option>Multifractal DFA</option>
              </select>
            </div>

            <Button onClick={runAnalysis} disabled={isAnalyzing} className="w-full">
              {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
            </Button>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Hurst Exponent Results
          </h3>
          <div className="space-y-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">0.73</div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Hurst Exponent</div>
              <Badge variant="success" className="mt-2">Persistent</Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
                <span className="ml-2 font-medium">95%</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">P-value:</span>
                <span className="ml-2 font-medium">0.003</span>
              </div>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm">
              <strong>Interpretation:</strong> The asset shows persistent behavior (H &gt; 0.5), 
              indicating that past trends are likely to continue in the near future.
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Multifractal Spectrum
        </h3>
        <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg border flex items-center justify-center">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Multifractal Spectrum Visualization</p>
            <p className="text-sm mt-1">D(h) vs h plot showing fractal dimensions</p>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderGarchAnalysis = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            GARCH Model Configuration
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Model Type
              </label>
              <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700">
                <option>GARCH(1,1)</option>
                <option>EGARCH(1,1)</option>
                <option>GJR-GARCH(1,1)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Forecast Horizon (days)
              </label>
              <input 
                type="number" 
                defaultValue={30} 
                min={1} 
                max={60}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confidence Level: 95%
              </label>
              <input 
                type="range" 
                min="80" 
                max="99" 
                defaultValue={95}
                className="w-full"
              />
            </div>

            <Button onClick={runAnalysis} disabled={isAnalyzing} className="w-full">
              {isAnalyzing ? 'Estimating...' : 'Estimate Model'}
            </Button>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Model Parameters
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
                <div className="text-sm text-purple-600 dark:text-purple-400">ω (omega)</div>
                <div className="font-bold text-purple-900 dark:text-purple-100">0.0001</div>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
                <div className="text-sm text-purple-600 dark:text-purple-400">α (alpha)</div>
                <div className="font-bold text-purple-900 dark:text-purple-100">0.08</div>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
                <div className="text-sm text-purple-600 dark:text-purple-400">β (beta)</div>
                <div className="font-bold text-purple-900 dark:text-purple-100">0.91</div>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
                <div className="text-sm text-purple-600 dark:text-purple-400">Persistence</div>
                <div className="font-bold text-purple-900 dark:text-purple-100">0.99</div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">AIC:</span>
                <span className="font-medium">-2847.3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">BIC:</span>
                <span className="font-medium">-2821.7</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Log-Likelihood:</span>
                <span className="font-medium">1427.6</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Volatility Forecast
        </h3>
        <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg border flex items-center justify-center">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Volatility Forecast Chart</p>
            <p className="text-sm mt-1">Time series with confidence bands</p>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderCvarAnalysis = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            CVaR Configuration
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Portfolio Value ($)
              </label>
              <input 
                type="number" 
                defaultValue={1000000} 
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Time Horizon (days)
              </label>
              <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700">
                <option>1 Day</option>
                <option>5 Days</option>
                <option>10 Days</option>
                <option>22 Days (1 Month)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confidence Levels
              </label>
              <div className="space-y-2">
                {[90, 95, 99, 99.9].map(level => (
                  <label key={level} className="flex items-center">
                    <input type="checkbox" defaultChecked className="mr-2" />
                    <span className="text-sm">{level}%</span>
                  </label>
                ))}
              </div>
            </div>

            <Button onClick={runAnalysis} disabled={isAnalyzing} className="w-full">
              {isAnalyzing ? 'Calculating...' : 'Calculate CVaR'}
            </Button>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Risk Metrics
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded">
                <div className="text-sm text-red-600 dark:text-red-400">VaR (95%)</div>
                <div className="font-bold text-red-900 dark:text-red-100">$47,200</div>
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded">
                <div className="text-sm text-orange-600 dark:text-orange-400">CVaR (95%)</div>
                <div className="font-bold text-orange-900 dark:text-orange-100">$72,100</div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Expected Shortfall:</span>
                <span className="font-medium text-red-600">$72,100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Tail Risk:</span>
                <span className="font-medium">7.21%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Max Expected Loss:</span>
                <span className="font-medium text-red-600">$95,300</span>
              </div>
            </div>

            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                Stress Test Scenarios
              </h4>
              <div className="text-xs space-y-1">
                <div>Market Crash (-20%): $200,000 loss</div>
                <div>Sector Shock (-15%): $150,000 loss</div>
                <div>Liquidity Crisis (-12%): $120,000 loss</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Loss Distribution
        </h3>
        <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg border flex items-center justify-center">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Loss Distribution Histogram</p>
            <p className="text-sm mt-1">Showing VaR and CVaR thresholds</p>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Advanced Analytics
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Fractal analysis, volatility modeling, and risk assessment tools
              </p>
            </div>
            <Button variant="ghost">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'fractal' && renderFractalAnalysis()}
        {activeTab === 'garch' && renderGarchAnalysis()}
        {activeTab === 'cvar' && renderCvarAnalysis()}
      </div>
    </div>
  );
};

export default Analytics;
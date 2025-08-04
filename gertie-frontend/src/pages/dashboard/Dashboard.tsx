// FILE: src/pages/dashboard/Dashboard.tsx - ENHANCED VERSION
import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle,
  PieChart,
  BarChart3,
  Activity,
  Target,
  MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { formatCurrency, formatPercent } from '../../utils/formatting/formatting';
import { getRiskColorClass, getChangeColorClass } from '../../utils/colors';
import { PortfolioPerformanceChart } from '../../components/charts/PortfolioPerformanceChart';

// Mock portfolio data (this will be replaced with real API data later)
const mockPortfolioData = {
  totalValue: 847293,
  dailyChange: 12450,
  dailyChangePercent: 1.49,
  riskLevel: 'Medium',
  var95: 34567,
  sharpeRatio: 1.34,
  beta: 1.12,
  maxDrawdown: -0.084,
  positions: [
    { symbol: 'AAPL', name: 'Apple Inc.', value: 241282, weight: 0.285, dayChange: 0.023, riskLevel: 'Medium' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', value: 214188, weight: 0.253, dayChange: 0.015, riskLevel: 'Low' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', value: 200094, weight: 0.237, dayChange: -0.008, riskLevel: 'Medium' },
    { symbol: 'TSLA', name: 'Tesla Inc.', value: 190729, weight: 0.225, dayChange: 0.045, riskLevel: 'High' },
  ],
  assetAllocation: [
    { name: 'Stocks', value: 65, color: '#3b82f6' },
    { name: 'Bonds', value: 20, color: '#10b981' },
    { name: 'Real Estate', value: 10, color: '#f59e0b' },
    { name: 'Cash', value: 5, color: '#6b7280' },
  ],
};

const Dashboard: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState(false);

  const MetricCard: React.FC<{
    title: string;
    value: string;
    change?: string;
    changeValue?: number;
    icon: React.ReactNode;
    color?: string;
  }> = ({ title, value, change, changeValue, icon, color = 'text-gray-600' }) => (
    <Card className="hover:shadow-xl transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {value}
            </p>
            {change && changeValue !== undefined && (
              <p className={`text-sm mt-1 flex items-center ${getChangeColorClass(changeValue)}`}>
                {changeValue > 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                {change}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-full bg-gray-50 dark:bg-gray-700 ${color}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const HoldingsTable: React.FC = () => (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Top Holdings
        </h3>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Asset
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Weight
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Day Change
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Risk
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {mockPortfolioData.positions.map((position) => (
                <tr key={position.symbol} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {position.symbol}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {position.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatCurrency(position.value)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatPercent(position.weight * 100)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${getChangeColorClass(position.dayChange)}`}>
                    {formatPercent(position.dayChange * 100, { showSign: true })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={
                      position.riskLevel === 'Low' ? 'success' : 
                      position.riskLevel === 'Medium' ? 'warning' : 'danger'
                    }>
                      {position.riskLevel}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Portfolio Dashboard</h1>
          <p className="text-gray-300 mt-2">
            Monitor your portfolio performance and risk metrics in real-time
          </p>
        </div>
        
        {/* API Status */}
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm text-gray-300">API Connected</span>
        </div>
      </div>

      {/* Portfolio Summary Card */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-0">
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-white">
            <div>
              <h3 className="text-sm font-medium opacity-90">Total Portfolio Value</h3>
              <p className="text-4xl font-bold mt-2">
                {formatCurrency(mockPortfolioData.totalValue)}
              </p>
              <p className="text-sm mt-2 flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                {formatCurrency(mockPortfolioData.dailyChange)} ({formatPercent(mockPortfolioData.dailyChangePercent, { showSign: true })}) today
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium opacity-90">Risk Level</h3>
              <p className="text-2xl font-bold mt-2">{mockPortfolioData.riskLevel}</p>
              <p className="text-sm mt-2">VaR (95%): {formatCurrency(mockPortfolioData.var95)}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium opacity-90">Performance Metrics</h3>
              <div className="mt-2 space-y-1">
                <p className="text-sm">Sharpe Ratio: <span className="font-semibold">{mockPortfolioData.sharpeRatio.toFixed(2)}</span></p>
                <p className="text-sm">Beta: <span className="font-semibold">{mockPortfolioData.beta.toFixed(2)}</span></p>
                <p className="text-sm">Max Drawdown: <span className="font-semibold">{formatPercent(mockPortfolioData.maxDrawdown * 100)}</span></p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Value"
          value={formatCurrency(mockPortfolioData.totalValue, { compact: true })}
          change={formatPercent(mockPortfolioData.dailyChangePercent, { showSign: true })}
          changeValue={mockPortfolioData.dailyChangePercent}
          icon={<DollarSign className="h-6 w-6" />}
          color="text-green-600"
        />
        
        <MetricCard
          title="Value at Risk (95%)"
          value={formatCurrency(mockPortfolioData.var95, { compact: true })}
          icon={<AlertTriangle className="h-6 w-6" />}
          color="text-red-600"
        />
        
        <MetricCard
          title="Sharpe Ratio"
          value={mockPortfolioData.sharpeRatio.toFixed(2)}
          icon={<BarChart3 className="h-6 w-6" />}
          color="text-blue-600"
        />
        
        <MetricCard
          title="Beta"
          value={mockPortfolioData.beta.toFixed(2)}
          icon={<Activity className="h-6 w-6" />}
          color="text-purple-600"
        />
      </div>

      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Allocation */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <PieChart className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Asset Allocation
              </h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockPortfolioData.assetAllocation.map((asset, index) => (
                <div key={asset.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: asset.color }}
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {asset.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {asset.value}%
                    </div>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full" 
                        style={{ 
                          backgroundColor: asset.color, 
                          width: `${asset.value}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Market Regime */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Market Regime
              </h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Current Regime</span>
                <Badge variant="success">Bull Market</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Confidence</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">87%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Volatility</span>
                <Badge variant="warning">Moderate</Badge>
              </div>
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  Current market conditions suggest continued upward momentum with moderate volatility levels.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Portfolio Performance Chart - NEW SECTION */}
        <div className="mt-6">
            <PortfolioPerformanceChart 
            data={[]} 
            showBenchmark={true}
            timeframe="1M"
            height={400}
            className="w-full"
        />
        </div>
      </div>

      {/* Holdings Table */}
      <HoldingsTable />

      {/* Recent Activity & Risk Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Activity
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Portfolio rebalanced
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    2 hours ago
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Risk analysis completed
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    4 hours ago
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Market regime change detected
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    1 day ago
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Risk Alerts
              </h3>
              <Badge variant="danger">2 Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    VaR Threshold Exceeded
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                    Current VaR ({formatCurrency(mockPortfolioData.var95)}) exceeds configured threshold
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    High Concentration Risk
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                    AAPL position represents 28.5% of portfolio
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Quick Actions
          </h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button 
              variant="ghost" 
              className="flex flex-col items-center p-6 h-auto"
              icon={<BarChart3 className="h-8 w-8 mb-2" />}
            >
              Run Analysis
            </Button>
            
            <Button 
              variant="ghost" 
              className="flex flex-col items-center p-6 h-auto"
              icon={<Target className="h-8 w-8 mb-2" />}
            >
              Optimize Portfolio
            </Button>
            
            <Button 
              variant="ghost" 
              className="flex flex-col items-center p-6 h-auto"
              icon={<Activity className="h-8 w-8 mb-2" />}
              loading={isLoading}
              onClick={() => {
                setIsLoading(true);
                setTimeout(() => setIsLoading(false), 2000);
              }}
            >
              Generate Report
            </Button>
            
            <Button 
              variant="ghost" 
              className="flex flex-col items-center p-6 h-auto"
              icon={<MessageSquare className="h-8 w-8 mb-2" />}
            >
              Ask AI Assistant
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
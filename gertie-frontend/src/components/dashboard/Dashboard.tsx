// src/pages/dashboard/Dashboard.tsx
import React, { useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Shield, 
  AlertTriangle,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Bell,
  Refresh,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { formatCurrency, formatPercentage } from '../../utils/formatting/formatting';
import { getRiskColor, getChangeColor } from '../../utils/colors';
import { 
  usePortfolioSummary,
  useRiskMetrics,
  useHoldings,
  useMarketRegime,
  useRecentActivity,
  useRiskAlerts,
  useHealthCheck,
  useAcknowledgeAlert,
  invalidatePortfolioData,
  prefetchCriticalData
} from '../../services/queryClient';
import { PortfolioPerformanceChart } from '../../components/charts/PortfolioPerformanceChart';
import { useQueryClient } from '@tanstack/react-query';
// Custom toast system
const toast = {
  error: (message: string) => {
    if (typeof window !== 'undefined' && window.showToast) {
      window.showToast(message, 'error');
    } else {
      console.error(message);
    }
  },
  success: (message: string) => {
    if (typeof window !== 'undefined' && window.showToast) {
      window.showToast(message, 'success');
    } else {
      console.log(message);
    }
  },
};

// Status indicator component
const StatusIndicator: React.FC<{ isHealthy: boolean; isLoading: boolean }> = ({ 
  isHealthy, 
  isLoading 
}) => (
  <div className="flex items-center space-x-2">
    {isLoading ? (
      <LoadingSpinner size="sm" />
    ) : isHealthy ? (
      <Wifi className="h-4 w-4 text-green-500" />
    ) : (
      <WifiOff className="h-4 w-4 text-red-500" />
    )}
    <span className={`text-sm ${isHealthy ? 'text-green-600' : 'text-red-600'}`}>
      {isLoading ? 'Connecting...' : isHealthy ? 'Connected' : 'Disconnected'}
    </span>
  </div>
);

<PortfolioPerformanceChart 
  data={[]} 
  showBenchmark={true}
  timeframe="1M"
/>

// Error boundary component
const ErrorDisplay: React.FC<{ 
  title: string; 
  error: Error | null; 
  onRetry?: () => void 
}> = ({ title, error, onRetry }) => (
  <Card className="p-6 border-red-200 bg-red-50">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <XCircle className="h-5 w-5 text-red-500" />
        <div>
          <h3 className="font-medium text-red-900">{title}</h3>
          <p className="text-sm text-red-700">
            {error?.message || 'Failed to load data'}
          </p>
        </div>
      </div>
      {onRetry && (
        <Button 
          onClick={onRetry} 
          variant="ghost" 
          size="sm"
          className="text-red-700 hover:text-red-900"
        >
          <Refresh className="h-4 w-4 mr-1" />
          Retry
        </Button>
      )}
    </div>
  </Card>
);

const Dashboard: React.FC = () => {
  const queryClient = useQueryClient();

  // API Queries
  const { 
    data: healthData, 
    isLoading: healthLoading, 
    error: healthError 
  } = useHealthCheck();

  const { 
    data: portfolioSummary, 
    isLoading: summaryLoading, 
    error: summaryError,
    refetch: refetchSummary 
  } = usePortfolioSummary();

  const { 
    data: riskMetrics, 
    isLoading: riskLoading, 
    error: riskError,
    refetch: refetchRiskMetrics 
  } = useRiskMetrics();

  const { 
    data: holdings, 
    isLoading: holdingsLoading, 
    error: holdingsError,
    refetch: refetchHoldings 
  } = useHoldings();

  const { 
    data: marketRegime, 
    isLoading: regimeLoading, 
    error: regimeError,
    refetch: refetchMarketRegime 
  } = useMarketRegime();

  const { 
    data: recentActivity, 
    isLoading: activityLoading, 
    error: activityError,
    refetch: refetchActivity 
  } = useRecentActivity();

  const { 
    data: riskAlerts, 
    isLoading: alertsLoading, 
    error: alertsError,
    refetch: refetchAlerts 
  } = useRiskAlerts();

  const acknowledgeAlertMutation = useAcknowledgeAlert();

  // Connection status
  const isConnected = healthData?.status === 'healthy';
  const hasConnectionError = !!healthError;

  // Prefetch data on mount
  useEffect(() => {
    prefetchCriticalData(queryClient);
  }, [queryClient]);

  // Auto-refresh setup
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (!document.hidden && isConnected) {
        invalidatePortfolioData(queryClient);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(refreshInterval);
  }, [queryClient, isConnected]);

  // Handle alert acknowledgment
  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await acknowledgeAlertMutation.mutateAsync(alertId);
      toast.success('Alert acknowledged');
    } catch (error) {
      toast.error('Failed to acknowledge alert');
    }
  };

  // Global refresh handler
  const handleRefreshAll = () => {
    invalidatePortfolioData(queryClient);
    toast.success('Refreshing data...');
  };

  // Loading state for initial load
  const isInitialLoading = summaryLoading && riskLoading && holdingsLoading;

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Portfolio Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time portfolio monitoring and risk analysis</p>
        </div>
        <div className="flex items-center space-x-4">
          <StatusIndicator isHealthy={isConnected} isLoading={healthLoading} />
          <Button 
            onClick={handleRefreshAll}
            variant="ghost"
            size="sm"
            disabled={isInitialLoading}
          >
            <Refresh className={`h-4 w-4 mr-2 ${isInitialLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Connection Error Alert */}
      {hasConnectionError && (
        <Card className="p-4 border-yellow-200 bg-yellow-50">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-900">Connection Issues</p>
              <p className="text-sm text-yellow-700">
                Some data may be outdated. Showing last cached values.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Portfolio Summary */}
      {summaryError ? (
        <ErrorDisplay 
          title="Portfolio Summary Error" 
          error={summaryError as Error}
          onRetry={() => refetchSummary()}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Value</p>
                <p className="text-2xl font-bold text-blue-900">
                  {summaryLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    formatCurrency(portfolioSummary?.total_value || 0)
                  )}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
            {portfolioSummary && (
              <div className="mt-4 flex items-center">
                {portfolioSummary.daily_change >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${getChangeColor(portfolioSummary.daily_change)}`}>
                  {formatCurrency(portfolioSummary.daily_change)} ({formatPercentage(portfolioSummary.daily_change_pct)})
                </span>
              </div>
            )}
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Cash Available</p>
                <p className="text-2xl font-bold text-green-900">
                  {summaryLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    formatCurrency(portfolioSummary?.cash_position || 0)
                  )}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Unrealized P&L</p>
                <p className="text-2xl font-bold text-purple-900">
                  {summaryLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    formatCurrency(portfolioSummary?.unrealized_pnl || 0)
                  )}
                </p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-100 border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600">Invested Amount</p>
                <p className="text-2xl font-bold text-amber-900">
                  {summaryLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    formatCurrency(portfolioSummary?.invested_amount || 0)
                  )}
                </p>
              </div>
              <Shield className="h-8 w-8 text-amber-500" />
            </div>
          </Card>
        </div>
      )}

      {/* Risk Metrics & Market Regime */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Metrics */}
        {riskError ? (
          <ErrorDisplay 
            title="Risk Metrics Error" 
            error={riskError as Error}
            onRetry={() => refetchRiskMetrics()}
          />
        ) : (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Risk Metrics</h3>
              {riskLoading && <LoadingSpinner size="sm" />}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">VaR (95%)</p>
                <p className="text-xl font-bold text-gray-900">
                  {riskLoading ? '...' : formatPercentage(riskMetrics?.var_95 || 0)}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Sharpe Ratio</p>
                <p className="text-xl font-bold text-gray-900">
                  {riskLoading ? '...' : (riskMetrics?.sharpe_ratio || 0).toFixed(2)}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Beta</p>
                <p className="text-xl font-bold text-gray-900">
                  {riskLoading ? '...' : (riskMetrics?.beta || 0).toFixed(2)}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Max Drawdown</p>
                <p className="text-xl font-bold text-gray-900">
                  {riskLoading ? '...' : formatPercentage(riskMetrics?.max_drawdown || 0)}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Market Regime */}
        {regimeError ? (
          <ErrorDisplay 
            title="Market Regime Error" 
            error={regimeError as Error}
            onRetry={() => refetchMarketRegime()}
          />
        ) : (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Market Regime</h3>
              {regimeLoading && <LoadingSpinner size="sm" />}
            </div>
            {marketRegime && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Current Regime:</span>
                  <Badge variant={
                    marketRegime.current_regime === 'Bull' ? 'success' :
                    marketRegime.current_regime === 'Bear' ? 'destructive' :
                    'secondary'
                  }>
                    {marketRegime.current_regime}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Confidence:</span>
                  <span className="font-medium">{formatPercentage(marketRegime.confidence)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{marketRegime.duration_days} days</span>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Holdings Table */}
      {holdingsError ? (
        <ErrorDisplay 
          title="Holdings Error" 
          error={holdingsError as Error}
          onRetry={() => refetchHoldings()}
        />
      ) : (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Holdings</h3>
            {holdingsLoading && <LoadingSpinner size="sm" />}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Symbol</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Quantity</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Market Value</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">P&L</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Weight</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Risk</th>
                </tr>
              </thead>
              <tbody>
                {holdingsLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8">
                      <LoadingSpinner />
                    </td>
                  </tr>
                ) : holdings && holdings.length > 0 ? (
                  holdings.slice(0, 10).map((holding) => (
                    <tr key={holding.symbol} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{holding.symbol}</td>
                      <td className="py-3 px-4 text-gray-600 max-w-[200px] truncate">
                        {holding.name}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900">
                        {holding.quantity.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">
                        {formatCurrency(holding.market_value)}
                      </td>
                      <td className={`py-3 px-4 text-right font-medium ${getChangeColor(holding.unrealized_pnl)}`}>
                        {formatCurrency(holding.unrealized_pnl)} ({formatPercentage(holding.unrealized_pnl_pct)})
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900">
                        {formatPercentage(holding.weight)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={
                          holding.risk_level === 'Low' ? 'secondary' :
                          holding.risk_level === 'Medium' ? 'default' :
                          'destructive'
                        }>
                          {holding.risk_level}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      No holdings data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Recent Activity & Risk Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        {activityError ? (
          <ErrorDisplay 
            title="Activity Error" 
            error={activityError as Error}
            onRetry={() => refetchActivity()}
          />
        ) : (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              {activityLoading && <LoadingSpinner size="sm" />}
            </div>
            <div className="space-y-4">
              {activityLoading ? (
                <div className="text-center py-4">
                  <LoadingSpinner />
                </div>
              ) : recentActivity && recentActivity.length > 0 ? (
                recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`p-2 rounded-full ${
                      activity.type === 'buy' ? 'bg-green-100 text-green-600' :
                      activity.type === 'sell' ? 'bg-red-100 text-red-600' :
                      activity.type === 'dividend' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {activity.type === 'buy' || activity.type === 'sell' ? (
                        <Activity className="h-4 w-4" />
                      ) : activity.type === 'dividend' ? (
                        <DollarSign className="h-4 w-4" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={
                      activity.status === 'completed' ? 'success' :
                      activity.status === 'pending' ? 'default' :
                      'destructive'
                    }>
                      {activity.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-center py-4 text-gray-500">No recent activity</p>
              )}
            </div>
          </Card>
        )}

        {/* Risk Alerts */}
        {alertsError ? (
          <ErrorDisplay 
            title="Risk Alerts Error" 
            error={alertsError as Error}
            onRetry={() => refetchAlerts()}
          />
        ) : (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Risk Alerts</h3>
              {alertsLoading && <LoadingSpinner size="sm" />}
            </div>
            <div className="space-y-4">
              {alertsLoading ? (
                <div className="text-center py-4">
                  <LoadingSpinner />
                </div>
              ) : riskAlerts && riskAlerts.length > 0 ? (
                riskAlerts
                  .filter(alert => !alert.acknowledged)
                  .slice(0, 5)
                  .map((alert) => (
                    <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${
                      alert.severity === 'critical' ? 'bg-red-50 border-red-500' :
                      alert.severity === 'high' ? 'bg-orange-50 border-orange-500' :
                      alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-500' :
                      'bg-blue-50 border-blue-500'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className={`h-4 w-4 ${
                              alert.severity === 'critical' ? 'text-red-500' :
                              alert.severity === 'high' ? 'text-orange-500' :
                              alert.severity === 'medium' ? 'text-yellow-500' :
                              'text-blue-500'
                            }`} />
                            <h4 className="font-medium text-gray-900">{alert.title}</h4>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <Button 
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                          variant="ghost" 
                          size="sm"
                          disabled={acknowledgeAlertMutation.isLoading}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-4">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-gray-500">No active alerts</p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
            <Activity className="h-6 w-6" />
            <span className="text-sm">Rebalance</span>
          </Button>
          <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
            <Shield className="h-6 w-6" />
            <span className="text-sm">Risk Analysis</span>
          </Button>
          <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
            <TrendingUp className="h-6 w-6" />
            <span className="text-sm">Optimize</span>
          </Button>
          <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
            <Bell className="h-6 w-6" />
            <span className="text-sm">Alerts</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
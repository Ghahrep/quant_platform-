// src/components/ai/RichContentRenderer.tsx
import React from 'react';
import { BarChart3, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Info, Download, ExternalLink } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface RichContent {
  type: 'chart' | 'table' | 'analysis' | 'portfolio' | 'risk_metrics';
  data: any;
  title?: string;
  description?: string;
}

interface RichContentRendererProps {
  content: RichContent;
  onExport?: (format: 'png' | 'csv' | 'pdf') => void;
}

export const RichContentRenderer: React.FC<RichContentRendererProps> = ({ 
  content, 
  onExport 
}) => {
  const renderAnalysis = (data: any) => (
    <div className="space-y-4">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Total Value</div>
          <div className="text-lg font-semibold text-blue-900 dark:text-blue-100">
            ${data.totalValue?.toLocaleString() || 'N/A'}
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
          <div className="text-xs text-green-600 dark:text-green-400 font-medium">Sharpe Ratio</div>
          <div className="text-lg font-semibold text-green-900 dark:text-green-100">
            {data.sharpeRatio || 'N/A'}
          </div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
          <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">Risk Score</div>
          <div className="text-lg font-semibold text-orange-900 dark:text-orange-100">
            {data.riskScore || 'N/A'}/10
          </div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
          <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">Beta</div>
          <div className="text-lg font-semibold text-purple-900 dark:text-purple-100">
            {data.beta || 'N/A'}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {data.recommendations && (
        <div>
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Recommendations</h4>
          <div className="space-y-2">
            {data.recommendations.map((rec: string, idx: number) => (
              <div key={idx} className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderRiskMetrics = (data: any) => (
    <div className="space-y-4">
      {/* Risk Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Value at Risk</h4>
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-red-600 dark:text-red-400">VaR (95%)</div>
                <div className="text-xl font-bold text-red-900 dark:text-red-100">
                  ${data.var95?.toLocaleString() || 'N/A'}
                </div>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>
        <div>
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Expected Shortfall</h4>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-orange-600 dark:text-orange-400">CVaR (95%)</div>
                <div className="text-xl font-bold text-orange-900 dark:text-orange-100">
                  ${data.cvar95?.toLocaleString() || 'N/A'}
                </div>
              </div>
              <TrendingDown className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">Volatility</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {data.volatility ? `${data.volatility}%` : 'N/A'}
          </div>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">Beta</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {data.beta || 'N/A'}
          </div>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">Max Drawdown</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {data.maxDrawdown ? `${data.maxDrawdown}%` : 'N/A'}
          </div>
        </div>
      </div>

      {/* Risk Alerts */}
      {data.alerts && data.alerts.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Risk Alerts</h4>
          <div className="space-y-2">
            {data.alerts.map((alert: any, idx: number) => (
              <div
                key={idx}
                className={`flex items-center space-x-2 p-2 rounded border ${
                  alert.type === 'critical'
                    ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
                    : alert.type === 'warning'
                    ? 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-200'
                    : 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200'
                }`}
              >
                {alert.type === 'critical' ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : (
                  <Info className="w-4 h-4" />
                )}
                <span className="text-sm">{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderPortfolio = (data: any) => (
    <div className="space-y-4">
      {/* Portfolio Summary */}
      {data.summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-sm text-green-600 dark:text-green-400">Total Return</div>
            <div className="text-lg font-semibold text-green-900 dark:text-green-100">
              {data.summary.totalReturn ? `${data.summary.totalReturn}%` : 'N/A'}
            </div>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-sm text-blue-600 dark:text-blue-400">Benchmark</div>
            <div className="text-lg font-semibold text-blue-900 dark:text-blue-100">
              {data.summary.benchmarkReturn ? `${data.summary.benchmarkReturn}%` : 'N/A'}
            </div>
          </div>
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-sm text-purple-600 dark:text-purple-400">Alpha</div>
            <div className="text-lg font-semibold text-purple-900 dark:text-purple-100">
              {data.summary.alpha ? `${data.summary.alpha}%` : 'N/A'}
            </div>
          </div>
          <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="text-sm text-orange-600 dark:text-orange-400">Tracking Error</div>
            <div className="text-lg font-semibold text-orange-900 dark:text-orange-100">
              {data.summary.trackingError ? `${data.summary.trackingError}%` : 'N/A'}
            </div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">Info Ratio</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {data.summary.informationRatio || 'N/A'}
            </div>
          </div>
        </div>
      )}

      {/* Holdings Table */}
      {data.holdings && (
        <div>
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Top Holdings Performance</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 font-medium text-gray-700 dark:text-gray-300">Symbol</th>
                  <th className="text-right py-2 font-medium text-gray-700 dark:text-gray-300">Weight</th>
                  <th className="text-right py-2 font-medium text-gray-700 dark:text-gray-300">Return</th>
                  <th className="text-right py-2 font-medium text-gray-700 dark:text-gray-300">Contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {data.holdings.map((holding: any, idx: number) => (
                  <tr key={idx}>
                    <td className="py-2 font-medium text-gray-900 dark:text-gray-100">
                      {holding.symbol}
                    </td>
                    <td className="py-2 text-right text-gray-700 dark:text-gray-300">
                      {holding.weight ? `${holding.weight}%` : 'N/A'}
                    </td>
                    <td className={`py-2 text-right font-medium ${
                      holding.return >= 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {holding.return ? `${holding.return > 0 ? '+' : ''}${holding.return}%` : 'N/A'}
                    </td>
                    <td className={`py-2 text-right font-medium ${
                      holding.contribution >= 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {holding.contribution ? `${holding.contribution > 0 ? '+' : ''}${holding.contribution}%` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderTable = (data: any) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800">
            {data.headers?.map((header: string, idx: number) => (
              <th key={idx} className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {data.rows?.map((row: string[], idx: number) => (
            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              {row.map((cell: string, cellIdx: number) => (
                <td key={cellIdx} className="px-4 py-2 text-gray-900 dark:text-gray-100">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderChart = (data: any) => (
    <div className="space-y-4">
      {/* Chart Placeholder - Connect to Recharts */}
      <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="font-medium">{content.title || 'Chart Visualization'}</p>
          <p className="text-xs mt-1">
            {data.type === 'line' ? 'Line Chart' : 
             data.type === 'bar' ? 'Bar Chart' :
             data.type === 'pie' ? 'Pie Chart' : 'Chart'} - Connected to Recharts
          </p>
          {data.series && (
            <div className="mt-2 text-xs">
              {data.series.map((series: any, idx: number) => (
                <span key={idx} className="inline-block mr-2">
                  <span 
                    className="inline-block w-2 h-2 rounded-full mr-1"
                    style={{ backgroundColor: series.color || '#3b82f6' }}
                  ></span>
                  {series.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Chart Data Summary */}
      {data.series && (
        <div className="text-xs text-gray-600 dark:text-gray-400">
          <p>Data points: {data.series[0]?.data?.length || 0}</p>
          <p>Series: {data.series.length}</p>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (content.type) {
      case 'analysis':
        return renderAnalysis(content.data);
      case 'risk_metrics':
        return renderRiskMetrics(content.data);
      case 'portfolio':
        return renderPortfolio(content.data);
      case 'table':
        return renderTable(content.data);
      case 'chart':
        return renderChart(content.data);
      default:
        return <div>Unsupported content type: {content.type}</div>;
    }
  };

  return (
    <Card className="mt-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
        <h4 className="font-medium text-gray-900 dark:text-gray-100">
          {content.title || 'Analysis Result'}
        </h4>
        {onExport && (
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onExport('png')}
              className="text-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              PNG
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onExport('csv')}
              className="text-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              CSV
            </Button>
          </div>
        )}
      </div>

      {/* Description */}
      {content.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 mb-4">
          {content.description}
        </p>
      )}

      {/* Content */}
      <div className="pt-3">
        {renderContent()}
      </div>
    </Card>
  );
};
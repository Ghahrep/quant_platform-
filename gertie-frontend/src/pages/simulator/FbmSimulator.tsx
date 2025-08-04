import React from 'react';
import { Download, RotateCcw, Info, TrendingUp, TrendingDown, Activity, Settings, AlertTriangle, X, ChevronDown } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';

// TypeScript interfaces for the simulator
interface FbmParameters {
  hurst: number;
  numPoints: number;
  timeLength: number;
}

interface PathData {
  time: number;
  path1: number;
  path2: number;
  path3: number;
}

interface PathStatistics {
  finalValue: number;
  maxValue: number;
  minValue: number;
  range: number;
  avgVariation: number;
}

interface SimulationState {
  parameters: FbmParameters;
  pathData: PathData[];
  statistics: PathStatistics[];
  isGenerating: boolean;
  error: string | null;
  lastGenerated: number;
  advancedOptionsOpen: boolean;
  randomSeed: number | null;
  exportFormat: 'png' | 'svg' | 'pdf' | 'csv';
  memoryOptimization: boolean;
}

interface ValidationError {
  field: string;
  message: string;
}

const FbmSimulatorPage: React.FC = () => {
  // Component state management
  const [state, setState] = useState<SimulationState>({
    parameters: {
      hurst: 0.5,
      numPoints: 512,
      timeLength: 2.0
    },
    pathData: [],
    statistics: [],
    isGenerating: false,
    error: null,
    lastGenerated: 0,
    advancedOptionsOpen: false,
    randomSeed: null,
    exportFormat: 'png',
    memoryOptimization: true
  });

  // Refs for performance optimization
  const generationTimeoutRef = useRef<NodeJS.Timeout>();
  const gaussianSpareRef = useRef<number | undefined>();
  const generationIdRef = useRef<number>(0);
  const debouncedGenerate = useRef<NodeJS.Timeout>();

  // Parameter validation
  const validateParameters = useCallback((params: FbmParameters): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    if (params.hurst < 0.1 || params.hurst > 0.9) {
      errors.push({ field: 'hurst', message: 'Hurst exponent must be between 0.1 and 0.9' });
    }
    
    if (params.numPoints < 128 || params.numPoints > 4096) {
      errors.push({ field: 'numPoints', message: 'Number of points must be between 128 and 4096' });
    }
    
    if (params.timeLength <= 0 || params.timeLength > 20) {
      errors.push({ field: 'timeLength', message: 'Time length must be between 0.1 and 20' });
    }
    
    return errors;
  }, []);

  // Enhanced parameter update with validation
  const updateParameter = useCallback((key: keyof FbmParameters, value: number) => {
    setState(prev => {
      const newParams = { ...prev.parameters, [key]: value };
      const errors = validateParameters(newParams);
      
      return {
        ...prev,
        parameters: newParams,
        error: errors.length > 0 ? errors[0].message : null
      };
    });
  }, [validateParameters]);

  // Box-Muller Gaussian random number generator
  const gaussianRandom = useCallback((): number => {
    if (gaussianSpareRef.current !== undefined) {
      const temp = gaussianSpareRef.current;
      gaussianSpareRef.current = undefined;
      return temp;
    }

    const u = Math.random();
    const v = Math.random();
    const mag = Math.sqrt(-2 * Math.log(u));
    gaussianSpareRef.current = mag * Math.cos(2 * Math.PI * v);
    return mag * Math.sin(2 * Math.PI * v);
  }, []);

  // Generate fractional Brownian motion using simplified method
  const generateFBM = useCallback((H: number, n: number, T: number): number[] => {
    const dt = T / n;
    const dW = new Array(n);
    
    // Generate independent Gaussian increments
    for (let i = 0; i < n; i++) {
      dW[i] = gaussianRandom() * Math.sqrt(dt);
    }

    // Apply simple fractional scaling for H ≠ 0.5
    if (Math.abs(H - 0.5) > 0.01) {
      const scale = Math.pow(dt, H);
      for (let i = 0; i < n; i++) {
        dW[i] *= scale;
      }
    }
    
    return dW;
  }, [gaussianRandom]);

  // Calculate path statistics
  const calculateStatistics = useCallback((path: number[]): PathStatistics => {
    const finalValue = path[path.length - 1];
    const maxValue = Math.max(...path);
    const minValue = Math.min(...path);
    const range = maxValue - minValue;
    
    // Calculate average variation
    let variation = 0;
    for (let i = 1; i < path.length; i++) {
      variation += Math.abs(path[i] - path[i-1]);
    }
    variation /= path.length - 1;

    return { finalValue, maxValue, minValue, range, avgVariation: variation };
  }, []);

  // Enhanced path generation
  const generatePaths = useCallback(() => {
    const currentGenerationId = ++generationIdRef.current;
    
    // Validate parameters before generation
    const errors = validateParameters(state.parameters);
    if (errors.length > 0) {
      setState(prev => ({ ...prev, error: errors[0].message }));
      return;
    }

    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    // Clear any existing timeout
    if (generationTimeoutRef.current) {
      clearTimeout(generationTimeoutRef.current);
    }

    generationTimeoutRef.current = setTimeout(() => {
      try {
        // Check if this generation is still current
        if (currentGenerationId !== generationIdRef.current) return;

        const { hurst, numPoints, timeLength } = state.parameters;
        const paths: number[][] = [];
        const newStatistics: PathStatistics[] = [];

        // Generate 3 sample paths
        for (let pathIndex = 0; pathIndex < 3; pathIndex++) {
          const increments = generateFBM(hurst, numPoints, timeLength);
          const path = new Array(numPoints + 1);
          
          // Cumulative sum to get the path
          path[0] = 0;
          for (let i = 1; i <= numPoints; i++) {
            path[i] = path[i-1] + increments[i-1];
          }
          
          paths.push(path);
          newStatistics.push(calculateStatistics(path));
        }

        // Convert to chart data format
        const chartData: PathData[] = [];
        for (let i = 0; i <= numPoints; i++) {
          const time = (i * timeLength / numPoints);
          chartData.push({
            time: Number(time.toFixed(4)),
            path1: Number(paths[0][i].toFixed(6)),
            path2: Number(paths[1][i].toFixed(6)),
            path3: Number(paths[2][i].toFixed(6))
          });
        }

        // Only update if this is still the current generation
        if (currentGenerationId === generationIdRef.current) {
          setState(prev => ({
            ...prev,
            pathData: chartData,
            statistics: newStatistics,
            isGenerating: false,
            lastGenerated: Date.now()
          }));
        }
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          isGenerating: false 
        }));
      }
    }, 150);
  }, [state.parameters, generateFBM, calculateStatistics, validateParameters]);

  // Get interpretation based on Hurst exponent with safety check
  const getHurstInterpretation = useCallback(() => {
    // Safety check to prevent initialization errors
    if (!state.parameters || typeof state.parameters.hurst !== 'number') {
      return {
        type: 'Random Walk',
        color: 'blue',
        description: 'Loading...',
        characteristics: ['Initializing parameters...']
      };
    }

    const { hurst } = state.parameters;
    
    if (hurst < 0.5) {
      return {
        type: 'Anti-Persistent',
        color: 'red',
        description: 'Mean-reverting behavior with frequent direction changes',
        characteristics: [
          'Trends tend to reverse quickly',
          'High volatility with oscillations',
          'Market corrections and mean reversion'
        ]
      };
    } else if (hurst > 0.5) {
      return {
        type: 'Persistent',
        color: 'green',
        description: 'Trending behavior with momentum effects',
        characteristics: [
          'Strong trends that persist over time',
          'Momentum effects and long memory',
          'Trending markets and bubble formation'
        ]
      };
    } else {
      return {
        type: 'Random Walk',
        color: 'blue',
        description: 'Standard Brownian motion with no predictable patterns',
        characteristics: [
          'No predictable patterns',
          'Efficient market hypothesis',
          'Geometric Brownian motion'
        ]
      };
    }
  }, [state.parameters]);
  
  const interpretation = state.parameters ? getHurstInterpretation() : {
    type: 'Random Walk',
    color: 'blue',
    description: 'Standard Brownian motion with no predictable patterns',
    characteristics: ['No predictable patterns', 'Efficient market hypothesis', 'Geometric Brownian motion']
  };

  // Export functionality (simplified for artifact)
  const exportChart = useCallback(async () => {
    try {
      if (!state.parameters || !state.pathData || state.pathData.length === 0) {
        setState(prev => ({ ...prev, error: 'No data to export. Please generate paths first.' }));
        return;
      }

      // Create CSV content
      const timestamp = new Date().toISOString();
      const csvContent = [
        '# Fractional Brownian Motion Simulation Data',
        `# Generated: ${timestamp}`,
        `# Hurst Exponent: ${state.parameters.hurst}`,
        `# Number of Points: ${state.parameters.numPoints}`,
        `# Time Length: ${state.parameters.timeLength}`,
        'time,path1,path2,path3',
        ...state.pathData.map(d => `${d.time},${d.path1},${d.path2},${d.path3}`)
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fBm_H${state.parameters.hurst.toFixed(2)}_${new Date().toISOString().slice(0,10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      
      setState(prev => ({ ...prev, error: null }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }));
    }
  }, [state.pathData, state.parameters]);

  // Reset simulation
  const resetSimulation = useCallback(() => {
    setState(prev => ({
      ...prev,
      pathData: [],
      statistics: [],
      error: null,
      isGenerating: false
    }));
  }, []);

  // Custom SVG Chart Component
  const CustomChart: React.FC<{ data: PathData[] }> = ({ data }) => {
    const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; data: PathData } | null>(null);
    const [selectedPath, setSelectedPath] = useState<'all' | 'path1' | 'path2' | 'path3'>('all');
    
    if (data.length === 0) return null;

    const width = 900;
    const height = 400;
    const margin = { top: 30, right: 40, bottom: 60, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Calculate scales
    const xScale = (value: number) => (value / state.parameters.timeLength) * chartWidth;
    
    const allValues = data.flatMap(d => [d.path1, d.path2, d.path3]);
    const yMin = Math.min(...allValues);
    const yMax = Math.max(...allValues);
    const yRange = yMax - yMin || 1;
    const yPadding = yRange * 0.1;
    const yScale = (value: number) => chartHeight - ((value - (yMin - yPadding)) / (yRange + 2 * yPadding)) * chartHeight;

    // Generate path strings
    const createPath = (pathKey: 'path1' | 'path2' | 'path3') => {
      return data.map((d, i) => 
        `${i === 0 ? 'M' : 'L'} ${xScale(d.time)} ${yScale(d[pathKey])}`
      ).join(' ');
    };

    return (
      <div className="w-full h-full">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">
            fBm Sample Paths (H = {state.parameters.hurst.toFixed(3)})
          </h3>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-600">Show:</span>
            {(['all', 'path1', 'path2', 'path3'] as const).map((path) => (
              <button
                key={path}
                onClick={() => setSelectedPath(path)}
                className={`px-2 py-1 text-xs rounded transition-colors duration-200 ${
                  selectedPath === path
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {path === 'all' ? 'All' : path.charAt(0).toUpperCase() + path.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="relative">
          <svg 
            id="fbm-chart-svg"
            width={width} 
            height={height} 
            className="border border-slate-200 rounded-lg bg-white shadow-lg"
          >
            <defs>
              <pattern id="grid" width="50" height="40" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1" opacity="0.3"/>
              </pattern>
            </defs>
            
            <rect width={chartWidth} height={chartHeight} x={margin.left} y={margin.top} fill="url(#grid)" />
            
            <g transform={`translate(${margin.left}, ${margin.top})`}>
              {/* Axes */}
              <line x1="0" y1="0" x2="0" y2={chartHeight} stroke="#64748b" strokeWidth="2"/>
              <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#64748b" strokeWidth="2"/>
              
              {/* Y-axis ticks */}
              {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                const y = chartHeight * ratio;
                const value = (yMax + yPadding) - ((yMax + yPadding) - (yMin - yPadding)) * ratio;
                return (
                  <g key={ratio}>
                    <line x1="-8" y1={y} x2="0" y2={y} stroke="#64748b" strokeWidth="1"/>
                    <text x="-12" y={y + 4} textAnchor="end" fontSize="11" fill="#64748b">
                      {value.toFixed(2)}
                    </text>
                  </g>
                );
              })}
              
              {/* X-axis ticks */}
              {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                const x = chartWidth * ratio;
                const value = state.parameters.timeLength * ratio;
                return (
                  <g key={ratio}>
                    <line x1={x} y1={chartHeight} x2={x} y2={chartHeight + 8} stroke="#64748b" strokeWidth="1"/>
                    <text x={x} y={chartHeight + 22} textAnchor="middle" fontSize="11" fill="#64748b">
                      {value.toFixed(1)}
                    </text>
                  </g>
                );
              })}
              
              {/* Path lines */}
              {(selectedPath === 'all' || selectedPath === 'path1') && (
                <path d={createPath('path1')} fill="none" stroke="#3b82f6" strokeWidth="2.5" opacity="0.8"/>
              )}
              {(selectedPath === 'all' || selectedPath === 'path2') && (
                <path d={createPath('path2')} fill="none" stroke="#ef4444" strokeWidth="2.5" opacity="0.8"/>
              )}
              {(selectedPath === 'all' || selectedPath === 'path3') && (
                <path d={createPath('path3')} fill="none" stroke="#10b981" strokeWidth="2.5" opacity="0.8"/>
              )}
            </g>
            
            {/* Axis labels */}
            <text x={width / 2} y={height - 10} textAnchor="middle" fontSize="14" fill="#64748b">Time (t)</text>
            <text x="20" y={height / 2} textAnchor="middle" fontSize="14" fill="#64748b" transform={`rotate(-90, 20, ${height / 2})`}>Value X(t)</text>
            
            {/* Legend */}
            <g transform={`translate(${width - 140}, 40)`}>
              <rect width="130" height="85" fill="rgba(255,255,255,0.95)" stroke="#e2e8f0" rx="6"/>
              <text x="65" y="15" textAnchor="middle" fontSize="12" fill="#64748b" fontWeight="600">Sample Paths</text>
              
              {selectedPath === 'all' && (
                <>
                  <line x1="15" y1="25" x2="35" y2="25" stroke="#3b82f6" strokeWidth="2.5"/>
                  <text x="40" y="29" fontSize="11" fill="#64748b">Path 1</text>
                  <line x1="15" y1="40" x2="35" y2="40" stroke="#ef4444" strokeWidth="2.5"/>
                  <text x="40" y="44" fontSize="11" fill="#64748b">Path 2</text>
                  <line x1="15" y1="55" x2="35" y2="55" stroke="#10b981" strokeWidth="2.5"/>
                  <text x="40" y="59" fontSize="11" fill="#64748b">Path 3</text>
                </>
              )}
            </g>
          </svg>
        </div>
      </div>
    );
  };

  // Only regenerate when parameters actually change (not on every render)
  useEffect(() => {
    if (debouncedGenerate.current) {
      clearTimeout(debouncedGenerate.current);
    }
    
    const errors = validateParameters(state.parameters);
    if (errors.length > 0) return;
    
    // Only regenerate if parameters changed and enough time has passed
    debouncedGenerate.current = setTimeout(() => {
      // Only generate if we don't have any data yet or if significant time has passed
      if (state.pathData.length === 0 || Date.now() - state.lastGenerated > 2000) {
        generatePaths();
      }
    }, 500);
    
    return () => {
      if (debouncedGenerate.current) {
        clearTimeout(debouncedGenerate.current);
      }
    };
  }, [state.parameters.hurst, state.parameters.numPoints, state.parameters.timeLength]); // Only depend on actual parameter values

  // Generate initial paths on component mount ONLY
  useEffect(() => {
    // Only generate if we don't have data yet
    if (state.pathData.length === 0) {
      generatePaths();
    }
  }, []); // Empty dependency array - only runs once on mount

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (generationTimeoutRef.current) {
        clearTimeout(generationTimeoutRef.current);
      }
      if (debouncedGenerate.current) {
        clearTimeout(debouncedGenerate.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Fractional Brownian Motion Simulator
          </h1>
          <p className="text-slate-600 text-lg">
            Interactive fBm Path Generation with Variable Hurst Exponent
          </p>
        </div>

        {/* Error Display */}
        {state.error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Simulation Error
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  {state.error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          {/* Left Panel - Controls */}
          <div className="xl:col-span-4 space-y-6">
            
            {/* Parameter Controls Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
              <h2 className="text-xl font-semibold mb-4 text-slate-800 flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Simulation Parameters
              </h2>
              
              {/* Hurst Exponent Slider */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Hurst Exponent (H): {state.parameters.hurst.toFixed(3)}
                </label>
                
                <div className="relative mb-4">
                  <input
                    type="range"
                    min="0.1"
                    max="0.9"
                    step="0.001"
                    value={state.parameters.hurst}
                    onChange={(e) => updateParameter('hurst', parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="flex justify-between text-xs text-slate-500 mb-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                    <span>Anti-persistent</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-400 rounded-full mr-2"></div>
                    <span>Random Walk</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                    <span>Persistent</span>
                  </div>
                </div>

                {/* Real-time Interpretation Box */}
                <div className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                  interpretation.color === 'red' 
                    ? 'bg-red-50 border-red-200' 
                    : interpretation.color === 'green'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-center mb-2">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      interpretation.color === 'red' ? 'bg-red-500' :
                      interpretation.color === 'green' ? 'bg-green-500' : 'bg-blue-500'
                    }`}></div>
                    <span className={`font-semibold ${
                      interpretation.color === 'red' ? 'text-red-700' :
                      interpretation.color === 'green' ? 'text-green-700' :
                      'text-blue-700'
                    }`}>
                      {interpretation.type} (H = {state.parameters.hurst.toFixed(3)})
                    </span>
                  </div>
                  <p className={`text-sm ${
                    interpretation.color === 'red' ? 'text-red-600' :
                    interpretation.color === 'green' ? 'text-green-600' :
                    'text-blue-600'
                  }`}>
                    {interpretation.description}
                  </p>
                </div>

                {/* Quick Preset Buttons */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => updateParameter('hurst', 0.3)}
                    className="px-3 py-2 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors duration-200"
                  >
                    Mean Reverting (0.3)
                  </button>
                  <button
                    onClick={() => updateParameter('hurst', 0.5)}
                    className="px-3 py-2 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors duration-200"
                  >
                    Random Walk (0.5)
                  </button>
                  <button
                    onClick={() => updateParameter('hurst', 0.7)}
                    className="px-3 py-2 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors duration-200"
                  >
                    Trending (0.7)
                  </button>
                </div>
              </div>

              {/* Number of Points */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Number of Time Steps
                </label>
                
                <select
                  value={state.parameters.numPoints}
                  onChange={(e) => updateParameter('numPoints', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={128}>128 points (Very Fast)</option>
                  <option value={256}>256 points (Fast)</option>
                  <option value={512}>512 points (Optimal)</option>
                  <option value={1024}>1024 points (Detailed)</option>
                  <option value={2048}>2048 points (High Detail)</option>
                </select>
              </div>

              {/* Time Length */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Total Time Length (T)
                </label>
                
                <div className="relative">
                  <input
                    type="number"
                    min="0.1"
                    max="20"
                    step="0.1"
                    value={state.parameters.timeLength}
                    onChange={(e) => updateParameter('timeLength', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 pr-16 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="2.0"
                  />
                  <span className="absolute right-3 top-2 text-sm text-slate-500">
                    units
                  </span>
                </div>
                
                {/* Quick Time Presets */}
                <div className="grid grid-cols-4 gap-1 mt-2">
                  {[0.5, 1.0, 2.0, 5.0].map((time) => (
                    <button
                      key={time}
                      onClick={() => updateParameter('timeLength', time)}
                      className={`px-2 py-1 text-xs rounded transition-colors duration-200 ${
                        Math.abs(state.parameters.timeLength - time) < 0.01
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={generatePaths}
                  disabled={state.isGenerating || !!state.error}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-500 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none"
                >
                  {state.isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                      <span>Generating Paths...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="mr-2 h-5 w-5" />
                      <span>Generate New Paths</span>
                    </>
                  )}
                </button>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={exportChart}
                    disabled={state.pathData.length === 0 || state.isGenerating}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-green-400 disabled:to-green-500 text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center text-sm shadow-md hover:shadow-lg transform hover:scale-[1.02] disabled:transform-none"
                  >
                    <Download className="mr-1.5 h-4 w-4" />
                    <span>Export CSV</span>
                  </button>
                  
                  <button
                    onClick={resetSimulation}
                    disabled={state.isGenerating}
                    className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 disabled:from-slate-400 disabled:to-slate-500 text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center text-sm shadow-md hover:shadow-lg transform hover:scale-[1.02] disabled:transform-none"
                  >
                    <X className="mr-1.5 h-4 w-4" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Enhanced Hurst Analysis Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
              <h3 className="text-lg font-semibold mb-4 text-slate-800 flex items-center">
                <Info className="mr-2 h-5 w-5" />
                Market Behavior Analysis
              </h3>
              
              <div className="space-y-4">
                {/* Current Regime Display */}
                <div className={`p-3 rounded-lg ${
                  interpretation.color === 'red' 
                    ? 'bg-red-50' 
                    : interpretation.color === 'green'
                    ? 'bg-green-50'
                    : 'bg-blue-50'
                }`}>
                  <div className="flex items-center mb-2">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      interpretation.color === 'red' ? 'bg-red-500' :
                      interpretation.color === 'green' ? 'bg-green-500' : 'bg-blue-500'
                    }`}></div>
                    <span className={`font-semibold text-sm ${
                      interpretation.color === 'red' ? 'text-red-700' :
                      interpretation.color === 'green' ? 'text-green-700' :
                      'text-blue-700'
                    }`}>
                      Current Regime: {interpretation.type}
                    </span>
                  </div>
                </div>

                {/* Key Characteristics */}
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">
                    Key Characteristics:
                  </h4>
                  <ul className="text-xs text-slate-600 space-y-1">
                    {interpretation.characteristics.map((char, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2 text-slate-400">•</span>
                        <span>{char}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Mathematical Properties */}
                <div className="border-t border-slate-200 pt-3">
                  <h4 className="text-sm font-medium text-slate-700 mb-2">
                    Mathematical Properties:
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-slate-600">
                      <span className="font-medium">H = </span>
                      <span className="font-mono">{state.parameters.hurst.toFixed(3)}</span>
                    </div>
                    <div className="text-slate-600">
                      <span className="font-medium">α = </span>
                      <span className="font-mono">{(2 * state.parameters.hurst).toFixed(3)}</span>
                    </div>
                    <div className="text-slate-600">
                      <span className="font-medium">β = </span>
                      <span className="font-mono">{(2 * state.parameters.hurst + 1).toFixed(3)}</span>
                    </div>
                    <div className="text-slate-600">
                      <span className="font-medium">d = </span>
                      <span className="font-mono">{(state.parameters.hurst - 0.5).toFixed(3)}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    α: scaling exponent, β: spectral exponent, d: fractional differencing
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Panel - Visualization */}
          <div className="xl:col-span-8 space-y-6">
            
            {/* Chart Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
              <h2 className="text-xl font-semibold mb-4 text-slate-800 flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                fBm Sample Paths
              </h2>
              
              <div className="h-96 w-full">
                {state.pathData.length > 0 ? (
                  <CustomChart data={state.pathData} />
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 border border-slate-200 rounded-lg bg-slate-50">
                    <div className="text-center">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Click "Generate New Paths" to start simulation</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Statistics Cards */}
            {state.statistics.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {state.statistics.map((stats, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                    <h3 className="text-lg font-semibold mb-4 text-slate-800">
                      Path {index + 1} Statistics
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Final Value:</span>
                        <span className="font-medium text-slate-800">
                          {stats.finalValue.toFixed(3)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Range:</span>
                        <span className="font-medium text-slate-800">
                          {stats.range.toFixed(3)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Avg Variation:</span>
                        <span className="font-medium text-slate-800">
                          {stats.avgVariation.toFixed(4)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Max Value:</span>
                        <span className="font-medium text-green-600">
                          {stats.maxValue.toFixed(3)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Min Value:</span>
                        <span className="font-medium text-red-600">
                          {stats.minValue.toFixed(3)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default FbmSimulatorPage;
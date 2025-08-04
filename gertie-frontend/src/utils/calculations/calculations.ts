export const calculateReturns = (prices: number[]): number[] => {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  return returns;
};

export const calculateVolatility = (returns: number[], annualize: boolean = true): number => {
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
  const volatility = Math.sqrt(variance);
  
  return annualize ? volatility * Math.sqrt(252) : volatility; // 252 trading days
};

export const calculateSharpeRatio = (
  returns: number[],
  riskFreeRate: number = 0.02
): number => {
  const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const annualizedReturn = meanReturn * 252;
  const volatility = calculateVolatility(returns);
  
  return (annualizedReturn - riskFreeRate) / volatility;
};
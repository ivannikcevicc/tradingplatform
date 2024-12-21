import { MarketData } from "@/types/trading";

// src/lib/strategy/probability.ts
export function calculateProbability(
  data: MarketData[],
  index: number,
  type: "BUY" | "SELL",
  lookbackPeriod: number = 20
): number {
  if (index < lookbackPeriod) return 50; // Not enough historical data

  const currentPrice = data[index].close;
  const priceChanges: number[] = [];
  const successfulMoves: number[] = [];

  // Calculate historical price changes and success rate
  for (let i = index - lookbackPeriod; i < index; i++) {
    const priceChange =
      ((data[i + 1].close - data[i].close) / data[i].close) * 100;
    priceChanges.push(priceChange);

    // For buy signals, we consider it successful if price went up
    // For sell signals, we consider it successful if price went down
    if (type === "BUY") {
      successfulMoves.push(priceChange > 0 ? 1 : 0);
    } else {
      successfulMoves.push(priceChange < 0 ? 1 : 0);
    }
  }

  // Calculate volatility
  const volatility = calculateVolatility(priceChanges);

  // Calculate trend strength
  const trendStrength = calculateTrendStrength(
    data.slice(index - lookbackPeriod, index)
  );

  // Calculate historical success rate
  const successRate =
    (successfulMoves.reduce((a, b) => a + b, 0) / lookbackPeriod) * 100;

  // Combine factors for final probability
  let probability = successRate;

  // Adjust based on trend strength
  probability *= 1 + trendStrength;

  // Adjust based on volatility
  probability *= 1 - volatility * 0.5; // Reduce probability in high volatility

  // Normalize between 0 and 100
  probability = Math.min(Math.max(probability, 0), 100);

  return Number(probability.toFixed(2));
}

// Helper functions for probability calculation
function calculateVolatility(priceChanges: number[]): number {
  const mean = priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length;
  const variance =
    priceChanges.reduce((a, b) => a + Math.pow(b - mean, 2), 0) /
    priceChanges.length;
  return Math.sqrt(variance) / 100; // Normalized volatility
}

function calculateTrendStrength(data: MarketData[]): number {
  const closes = data.map((d) => d.close);
  const firstPrice = closes[0];
  const lastPrice = closes[closes.length - 1];
  const priceChange = (lastPrice - firstPrice) / firstPrice;

  // Calculate R-squared of the trend
  const xValues = Array.from({ length: closes.length }, (_, i) => i);
  const regression = linearRegression(xValues, closes);

  return Math.abs(regression.r2); // Return absolute R-squared as trend strength
}

// Linear regression helper
function linearRegression(x: number[], y: number[]) {
  const n = x.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  let sumYY = 0;

  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumXX += x[i] * x[i];
    sumYY += y[i] * y[i];
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared
  const yMean = sumY / n;
  const ssRes = y.reduce((acc, yi, i) => {
    const yPred = slope * x[i] + intercept;
    return acc + Math.pow(yi - yPred, 2);
  }, 0);
  const ssTot = y.reduce((acc, yi) => acc + Math.pow(yi - yMean, 2), 0);
  const r2 = 1 - ssRes / ssTot;

  return { slope, intercept, r2 };
}

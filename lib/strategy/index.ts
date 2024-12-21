import { MarketData, TradingParameters, TradingSignal } from "@/types/trading";
import { calculateEMA } from "../indicators/ema";
import { calculateRSI } from "../indicators/rsi";
import { calculateSMA } from "../indicators/sma";

// src/lib/strategy/index.ts
export class TradingStrategy {
  private parameters: TradingParameters;

  constructor(parameters: TradingParameters) {
    this.parameters = parameters;
  }

  public analyze(marketData: MarketData[]): TradingSignal[] {
    const closes = marketData.map((d) => d.close);
    const signals: TradingSignal[] = [];

    // Calculate indicators
    const sma = calculateSMA(closes, this.parameters.smaLength);
    const ema = calculateEMA(closes, this.parameters.emaLength);
    const rsi = calculateRSI(closes, this.parameters.rsiLength);

    // Generate signals
    for (let i = this.parameters.smaLength; i < closes.length; i++) {
      // Bullish condition
      if (closes[i] > sma[i] && rsi[i] < 70 && closes[i] > ema[i]) {
        signals.push({
          timestamp: marketData[i].timestamp,
          type: "BUY",
          price: closes[i],
          probability: this.calculateProbability(marketData, i, "BUY"),
          risk: this.calculateRisk(marketData, i),
        });
      }

      // Bearish condition
      if (closes[i] < sma[i] && rsi[i] > 30 && closes[i] < ema[i]) {
        signals.push({
          timestamp: marketData[i].timestamp,
          type: "SELL",
          price: closes[i],
          probability: this.calculateProbability(marketData, i, "SELL"),
          risk: this.calculateRisk(marketData, i),
        });
      }
    }

    return signals;
  }

  private calculateProbability(
    data: MarketData[],
    index: number,
    type: "BUY" | "SELL"
  ): number {
    // Implement probability calculation based on historical patterns
    return 0.75; // Placeholder
  }

  private calculateRisk(data: MarketData[], index: number): number {
    const atr = this.calculateATR(
      data.slice(Math.max(0, index - 14), index + 1)
    );
    return atr * this.parameters.riskPercentage;
  }

  private calculateATR(data: MarketData[]): number {
    // Simple ATR calculation
    const ranges = data.map((d) =>
      Math.max(
        d.high - d.low,
        Math.abs(d.high - d.close),
        Math.abs(d.low - d.close)
      )
    );
    return ranges.reduce((a, b) => a + b, 0) / ranges.length;
  }
}

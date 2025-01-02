import { MarketData, TradingParameters, TradingSignal } from "@/types/trading";

// trading-strategy.ts
export class TradingStrategy {
  generateSignals(
    data: MarketData[],
    params: TradingParameters
  ): TradingSignal[] {
    const signals: TradingSignal[] = [];
    const sma = this.calculateSMA(data, params.smaLength);
    const rsi = this.calculateRSI(data, params.rsiLength);

    for (let i = params.smaLength; i < data.length; i++) {
      const price = data[i].close;
      const smaValue = sma[i];
      const rsiValue = rsi[i];

      if (rsiValue < 30 && price > smaValue) {
        signals.push({
          timestamp: data[i].timestamp,
          type: "BUY",
          price: price,
          probability: 70 + (30 - rsiValue),
          risk: price * (params.riskPercentage / 100),
        });
      } else if (rsiValue > 70 && price < smaValue) {
        signals.push({
          timestamp: data[i].timestamp,
          type: "SELL",
          price: price,
          probability: 70 + (rsiValue - 70),
          risk: price * (params.riskPercentage / 100),
        });
      }
    }
    return signals;
  }

  private calculateSMA(data: MarketData[], length: number): number[] {
    const sma = new Array(data.length).fill(0);
    for (let i = length - 1; i < data.length; i++) {
      const sum = data
        .slice(i - length + 1, i + 1)
        .reduce((acc, val) => acc + val.close, 0);
      sma[i] = sum / length;
    }
    return sma;
  }

  private calculateRSI(data: MarketData[], length: number): number[] {
    const rsi = new Array(data.length).fill(0);
    let gains = 0;
    let losses = 0;

    for (let i = 1; i < data.length; i++) {
      const change = data[i].close - data[i - 1].close;
      if (change >= 0) {
        gains += change;
      } else {
        losses -= change;
      }

      if (i >= length) {
        const avgGain = gains / length;
        const avgLoss = losses / length;
        const rs = avgGain / avgLoss;
        rsi[i] = 100 - 100 / (1 + rs);

        const oldChange = data[i - length + 1].close - data[i - length].close;
        if (oldChange >= 0) {
          gains -= oldChange;
        } else {
          losses += oldChange;
        }
      }
    }
    return rsi;
  }
}

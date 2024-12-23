export interface MarketData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ChartState {
  barSpacing?: number;
  logicalRange?: {
    from: number;
    to: number;
  };
}

export interface TradingParameters {
  smaLength: number;
  emaLength: number;
  rsiLength: number;
  macdShort: number;
  macdLong: number;
  macdSignal: number;
  bollingerLength: number;
  bollingerMult: number;
  forecastLength: number;
  riskPercentage: number;
}

export interface TradingSignal {
  timestamp: number;
  type: "BUY" | "SELL";
  price: number;
  probability: number;
  risk: number;
}

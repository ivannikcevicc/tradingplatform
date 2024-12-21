export interface MarketData {
  timestamp: number; // Unix timestamp in milliseconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
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

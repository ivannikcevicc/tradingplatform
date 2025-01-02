import { NextRequest, NextResponse } from "next/server";
import { fetchWithRetry, getIntervalMilliseconds } from "@/lib/utils";

const BINANCE_BASE_URL = "https://data-api.binance.vision/api/v3";

// Time spans for different intervals
const INTERVAL_CONFIG = {
  "1m": { days: 30 }, // 1 month for 1 minute candlesticks
  "5m": { days: 60 }, // 2 months for 5 minute candlesticks
  "15m": { days: 90 }, // 3 months for 15 minute candlesticks
  "1h": { days: 180 }, // 6 months for 1 hour candlesticks
  "4h": { days: 365 }, // 1 year for 4 hour candlesticks
  "1d": { days: 1460 }, // 4 years for 1 day candlesticks
} as const;

async function fetchKlines(
  symbol: string,
  interval: string,
  startTime: number,
  endTime: number
): Promise<any[]> {
  const url = `${BINANCE_BASE_URL}/klines?symbol=${symbol}&interval=${interval}&limit=1000&startTime=${startTime}&endTime=${endTime}`;
  const response = await fetchWithRetry(url);
  if (!response.ok) throw new Error(`Binance API error: ${response.status}`);
  const data = await response.json();

  if (data.length === 1000) {
    const lastTimestamp = data[data.length - 1][0];
    const nextBatch = await fetchKlines(
      symbol,
      interval,
      lastTimestamp + 1,
      endTime
    );
    return [...data, ...nextBatch];
  }

  return data;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = (searchParams.get("symbol") || "BTCUSDT").toUpperCase();
    const interval = searchParams.get("interval") || "1h";

    const endTime = Date.now();
    const intervalMs = getIntervalMilliseconds(interval);
    const timeConfig = INTERVAL_CONFIG[
      interval as keyof typeof INTERVAL_CONFIG
    ] || { days: 30 };
    const startTime = endTime - timeConfig.days * 24 * 60 * 60 * 1000;

    const data = await fetchKlines(symbol, interval, startTime, endTime);

    // Merge partial candlesticks if current period isn't complete
    const formattedData = data.map((kline: any[], index: number) => {
      const timestamp = kline[0];
      const isLastCandle = index === data.length - 1;
      const currentPeriodStart =
        Math.floor(Date.now() / intervalMs) * intervalMs;

      // If this is the current period's candle, adjust the close time to period end
      if (isLastCandle && timestamp >= currentPeriodStart) {
        return {
          timestamp,
          open: parseFloat(kline[1]),
          high: parseFloat(kline[2]),
          low: parseFloat(kline[3]),
          close: parseFloat(kline[4]),
          volume: parseFloat(kline[5]),
          isCurrentPeriod: true,
        };
      }

      return {
        timestamp,
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5]),
        isCurrentPeriod: false,
      };
    });

    return NextResponse.json(formattedData, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error: any) {
    console.error("Market data error:", error);
    return NextResponse.json(
      { error: "Failed to fetch market data", details: error.message },
      { status: 500 }
    );
  }
}

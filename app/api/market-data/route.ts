import { NextResponse } from "next/server";
import { fetchWithRetry } from "@/lib/utils";

const BINANCE_BASE_URL = "https://data-api.binance.vision/api/v3";

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

  // If we got 1000 results, there might be more data to fetch
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

async function getBinanceHistoricalData(symbol: string, interval: string) {
  const endTime = Date.now();
  const startTime = endTime - 365 * 24 * 60 * 60 * 1000; // 1 year ago

  const klines = await fetchKlines(symbol, interval, startTime, endTime);

  return klines
    .map((kline: any[]) => ({
      timestamp: kline[0],
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[5]),
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = (searchParams.get("symbol") || "BTCUSDT").toUpperCase();
    const interval = searchParams.get("interval") || "1m";

    const data = await getBinanceHistoricalData(symbol, interval);
    return NextResponse.json(data, {
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

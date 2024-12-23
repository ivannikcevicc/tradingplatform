// /api/market-data/route.ts
import { NextResponse } from "next/server";

const ALPACA_BASE_URL = "https://paper-api.alpaca.markets/v2";
const ALPACA_API_KEY = process.env.ALPACA_API_KEY_ID;
const ALPACA_SECRET_KEY = process.env.ALPACA_SECRET_KEY;

async function getAlpacaHistoricalData(symbol: string, timeframe: string) {
  const url = `${ALPACA_BASE_URL}/stocks/${symbol}/bars?timeframe=${timeframe}&limit=1000`;

  const headers = {
    "APCA-API-KEY-ID": ALPACA_API_KEY!,
    "APCA-API-SECRET-KEY": ALPACA_SECRET_KEY!,
  };

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`Alpaca API error: ${response.status}`);
  }

  const data = await response.json();
  return data.bars.map((bar: any) => ({
    timestamp: new Date(bar.t).getTime(),
    open: bar.o,
    high: bar.h,
    low: bar.l,
    close: bar.c,
    volume: bar.v,
  }));
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get("symbol")?.toUpperCase() || "AAPL";
    const timeframe = searchParams.get("timeframe") || "1Min";

    const data = await getAlpacaHistoricalData(symbol, timeframe);
    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Market data error:", error);
    return NextResponse.json(
      { error: "Failed to fetch market data", details: error.message },
      { status: 500 }
    );
  }
}

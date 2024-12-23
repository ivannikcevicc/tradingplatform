// app/api/market-data/route.ts
import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// Using Binance spot testnet API instead of main API
const BINANCE_API = "https://testnet.binance.vision/api/v3";

async function getTestnetData(symbol: string, interval: string) {
  const timestamp = Date.now();
  const recvWindow = 5000;

  // Get your testnet API key and secret from Binance Testnet website
  const apiKey = process.env.BINANCE_TESTNET_API_KEY;

  const headers = {
    "X-MBX-APIKEY": apiKey!,
    "Content-Type": "application/json",
  };

  const response = await fetch(
    `${BINANCE_API}/klines?symbol=${symbol}&interval=${interval}&limit=1000`,
    { headers }
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get("symbol")?.toUpperCase() || "BTCUSDT";
    const interval = searchParams.get("interval") || "1h";

    const data = await getTestnetData(symbol, interval);

    if (!Array.isArray(data)) {
      throw new Error("Invalid data received from Binance");
    }

    const formattedData = data.map((d: any[]) => ({
      timestamp: Number(d[0]),
      open: parseFloat(d[1]),
      high: parseFloat(d[2]),
      low: parseFloat(d[3]),
      close: parseFloat(d[4]),
      volume: parseFloat(d[5]),
    }));

    return new NextResponse(JSON.stringify(formattedData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Market data error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch market data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

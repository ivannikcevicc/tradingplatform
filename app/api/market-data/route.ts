import { fetchWithRetry } from "@/lib/utils";
import { NextResponse } from "next/server";

const BINANCE_API = "https://api.binance.com/api/v3";

export const runtime = "edge"; // Add edge runtime
export const dynamic = "force-dynamic"; // Disable caching

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get("symbol") || "BTCUSDT";
    const interval = searchParams.get("interval") || "1h";

    // Add headers to prevent rate limiting
    const response = await fetchWithRetry(
      `${BINANCE_API}/klines?symbol=${symbol}&interval=${interval}&limit=1000`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0",
        },
        retries: 3,
        retryDelay: 1000,
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Binance API Error:", errorData);
      return NextResponse.json(
        { error: `Binance API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Validate data structure
    if (!Array.isArray(data)) {
      console.error("Invalid data structure received:", data);
      return NextResponse.json(
        { error: "Invalid data received from Binance" },
        { status: 500 }
      );
    }

    // Transform Binance data to our format with validation
    const formattedData = data.map((d: any[]) => {
      if (!Array.isArray(d) || d.length < 6) {
        throw new Error("Invalid kline data structure");
      }

      return {
        timestamp: Number(d[0]),
        open: parseFloat(d[1]),
        high: parseFloat(d[2]),
        low: parseFloat(d[3]),
        close: parseFloat(d[4]),
        volume: parseFloat(d[5]),
      };
    });

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

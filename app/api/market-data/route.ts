import { fetchWithRetry } from "@/lib/utils";
import { NextResponse } from "next/server";

const BINANCE_API = "https://api.binance.com/api/v3";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// Add proxy endpoints as fallbacks
const PROXY_ENDPOINTS = [
  "https://api.binance.com",
  "https://api1.binance.com",
  "https://api2.binance.com",
  "https://api3.binance.com",
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get("symbol") || "BTCUSDT";
    const interval = searchParams.get("interval") || "1h";

    // Enhanced headers to better mimic a browser request
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Origin: "https://tradingplatform-liard.vercel.app",
      Referer: "https://tradingplatform-liard.vercel.app/",
    };

    // Try each endpoint until successful
    let lastError = null;
    for (const baseUrl of PROXY_ENDPOINTS) {
      try {
        const response = await fetchWithRetry(
          `${baseUrl}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=1000`,
          {
            headers,
            retries: 2,
            retryDelay: 1000,
          }
        );

        if (response.ok) {
          const data = await response.json();

          // Validate data structure
          if (!Array.isArray(data)) {
            console.error("Invalid data structure received:", data);
            continue;
          }

          // Transform Binance data
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
              "Access-Control-Allow-Origin": "*",
            },
          });
        }

        lastError = `API error: ${response.status}`;
      } catch (error) {
        lastError = error instanceof Error ? error.message : "Unknown error";
        continue;
      }
    }

    // If we get here, all endpoints failed
    throw new Error(`All endpoints failed. Last error: ${lastError}`);
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

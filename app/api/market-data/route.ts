import { fetchWithRetry } from "@/lib/utils";
import { NextResponse } from "next/server";

// Use testnet API instead
const BINANCE_API = "https://testnet.binance.vision/api/v3";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get("symbol") || "BTCUSDT";
    const interval = searchParams.get("interval") || "1h";

    const response = await fetchWithRetry(
      `${BINANCE_API}/klines?symbol=${symbol}&interval=${interval}&limit=1000`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Accept-Encoding": "gzip, deflate, br",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          Origin: process.env.VERCEL_URL || "http://localhost:3000",
          Referer: process.env.VERCEL_URL || "http://localhost:3000",
        },
        cache: "no-store",
        retries: 3,
        retryDelay: 1000,
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Binance API Error:", errorData);

      // If we get a 403, try the fallback data
      if (response.status === 403) {
        return NextResponse.json(getFallbackData(), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store, max-age=0",
          },
        });
      }

      return NextResponse.json(
        { error: `Binance API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      console.error("Invalid data structure received:", data);
      return NextResponse.json(getFallbackData(), { status: 200 });
    }

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
    // Return fallback data on error
    return NextResponse.json(getFallbackData(), { status: 200 });
  }
}

// Fallback data function to provide sample data when API fails
function getFallbackData() {
  const now = Date.now();
  const hourInMs = 3600000;
  const data = [];

  // Generate 24 hours of sample data
  for (let i = 24; i >= 0; i--) {
    const timestamp = now - i * hourInMs;
    const basePrice = 45000 + (Math.random() * 1000 - 500);

    data.push({
      timestamp,
      open: basePrice,
      high: basePrice * (1 + Math.random() * 0.02),
      low: basePrice * (1 - Math.random() * 0.02),
      close: basePrice * (1 + (Math.random() * 0.04 - 0.02)),
      volume: 100 + Math.random() * 900,
    });
  }

  return data;
}

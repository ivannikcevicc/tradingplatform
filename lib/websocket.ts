import { useEffect, useRef, useState } from "react";
import { MarketData } from "@/types/trading";

const ALPACA_WS_URL = "wss://stream.data.alpaca.markets/v2/sip";
const ALPACA_API_KEY = process.env.NEXT_PUBLIC_ALPACA_API_KEY_ID;
const ALPACA_SECRET_KEY = process.env.NEXT_PUBLIC_ALPACA_SECRET_KEY;

export function useAlpacaWebSocket(
  symbols: string[],
  onMessage: (data: MarketData) => void
) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const connect = () => {
      wsRef.current = new WebSocket(ALPACA_WS_URL);

      wsRef.current.onopen = () => {
        console.log("Connected to Alpaca WebSocket");
        setIsConnected(true);

        // Authenticate
        wsRef.current?.send(
          JSON.stringify({
            action: "auth",
            key: ALPACA_API_KEY,
            secret: ALPACA_SECRET_KEY,
          })
        );

        // Subscribe to stock data
        wsRef.current?.send(
          JSON.stringify({
            action: "subscribe",
            trades: symbols,
            bars: symbols,
          })
        );
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        // Process market data
        if (data && data.bars) {
          data.bars.forEach((bar: any) => {
            onMessage({
              timestamp: new Date(bar.t).getTime(),
              open: bar.o,
              high: bar.h,
              low: bar.l,
              close: bar.c,
              volume: bar.v,
            });
          });
        }
      };

      wsRef.current.onclose = () => {
        console.log("WebSocket closed, reconnecting...");
        setIsConnected(false);
        setTimeout(connect, 1000);
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
        wsRef.current?.close();
      };
    };

    connect();

    return () => {
      wsRef.current?.close();
      setIsConnected(false);
    };
  }, [symbols, onMessage]);

  return { isConnected };
}

import { useEffect, useRef, useState } from "react";
import { MarketData } from "@/types/trading";

const BINANCE_WS_URL = "wss://data-stream.binance.vision:443/ws";

export function useBinanceWebSocket(
  symbol: string,
  onMessage: (data: MarketData) => void
) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(true); // Default to true to avoid flash
  const prevSymbolRef = useRef(symbol);

  useEffect(() => {
    if (prevSymbolRef.current !== symbol) {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const unsubMessage = {
          method: "UNSUBSCRIBE",
          params: [`${prevSymbolRef.current.toLowerCase()}@kline_1m`],
          id: 1,
        };
        wsRef.current.send(JSON.stringify(unsubMessage));
      }
      prevSymbolRef.current = symbol;
    }

    const ws = new WebSocket(BINANCE_WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      const subMessage = {
        method: "SUBSCRIBE",
        params: [`${symbol.toLowerCase()}@kline_1m`],
        id: 1,
      };
      ws.send(JSON.stringify(subMessage));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.k) {
        const kline = data.k;
        onMessage({
          timestamp: kline.t,
          open: parseFloat(kline.o),
          high: parseFloat(kline.h),
          low: parseFloat(kline.l),
          close: parseFloat(kline.c),
          volume: parseFloat(kline.v),
        });
      }
    };

    ws.onerror = () => {
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [symbol, onMessage]);

  return { isConnected };
}

// lib/hooks/websocket.ts
import { useEffect, useRef, useState } from "react";

export function useWebSocket(onMessage: (data: any) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Using testnet WebSocket endpoint
    const socket = new WebSocket(
      "wss://testnet.binance.vision/ws/btcusdt@kline_1m"
    );

    socket.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (err) {
        console.error("WebSocket message error:", err);
      }
    };

    socket.onerror = (event) => {
      setError("WebSocket error occurred");
      console.error("WebSocket error:", event);
    };

    socket.onclose = () => {
      setIsConnected(false);
      setError("WebSocket disconnected");

      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (ws.current?.readyState === WebSocket.CLOSED) {
          ws.current = new WebSocket(
            "wss://testnet.binance.vision/ws/btcusdt@kline_1m"
          );
        }
      }, 5000);
    };

    ws.current = socket;

    return () => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
    };
  }, [onMessage]);

  return { isConnected, error };
}

import { useState, useEffect, useCallback, useRef } from "react";

interface WebSocketHook {
  isConnected: boolean;
  error: Error | null;
  sendMessage: (message: string) => void;
}

export const useWebSocket = (
  url: string,
  onMessage: (event: MessageEvent) => void,
  reconnectInterval: number = 5000
): WebSocketHook => {
  // Explicitly initialize state values
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Attempt to reconnect
        reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval);
      };

      ws.onerror = () => {
        setError(new Error("WebSocket error occurred"));
        ws.close();
      };

      ws.onmessage = onMessage;
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to connect to WebSocket")
      );
    }
  }, [url, onMessage, reconnectInterval]);

  const sendMessage = useCallback((message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(message);
    } else {
      setError(new Error("WebSocket is not connected"));
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return { isConnected, error, sendMessage };
};

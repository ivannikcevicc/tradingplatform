// src/lib/websocket.ts
export function createWebSocket(onMessage: (data: any) => void) {
  const ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@kline_1h");

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };

  return ws;
}

// src/app/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { TradingParameters, MarketData, TradingSignal } from "@/types/trading";
import { TradingStrategy } from "@/lib/strategy";
import dynamic from "next/dynamic";
import { ParametersForm } from "@/components/ParametersForm";
import { SignalsList } from "@/components/SignalsList";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Chart = dynamic(() => import("@/components/Chart"), { ssr: false });

export default function TradingDashboard() {
  const [parameters, setParameters] = useState<TradingParameters>({
    smaLength: 200,
    emaLength: 50,
    rsiLength: 14,
    macdShort: 12,
    macdLong: 26,
    macdSignal: 9,
    bollingerLength: 20,
    bollingerMult: 2.0,
    forecastLength: 10,
    riskPercentage: 2,
  });

  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [signals, setSignals] = useState<TradingSignal[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch("/api/market-data");
      const data = await response.json();
      setMarketData(data);
    };

    fetchData();
    const ws = new WebSocket("wss://your-websocket-endpoint");

    ws.onmessage = (event) => {
      const newData = JSON.parse(event.data);
      setMarketData((current) => [...current, newData]);
    };

    return () => ws.close();
  }, []);

  useEffect(() => {
    if (marketData.length > 0) {
      const strategy = new TradingStrategy(parameters);
      const newSignals = strategy.analyze(marketData);
      setSignals(newSignals);
    }
  }, [marketData, parameters]);

  const handleWebSocketMessage = useCallback(
    (message: WebSocket.MessageEvent) => {
      try {
        const data = JSON.parse(message.data);
        // Format Binance WebSocket data to match our MarketData type
        const newData: MarketData = {
          timestamp: data.k.t,
          open: parseFloat(data.k.o),
          high: parseFloat(data.k.h),
          low: parseFloat(data.k.l),
          close: parseFloat(data.k.c),
          volume: parseFloat(data.k.v),
        };

        setMarketData((current) => {
          const updated = [...current];
          // Update last candle if it's the same timestamp, otherwise add new
          const lastIndex = updated.length - 1;
          if (
            lastIndex >= 0 &&
            updated[lastIndex].timestamp === newData.timestamp
          ) {
            updated[lastIndex] = newData;
          } else {
            updated.push(newData);
          }
          return updated;
        });
      } catch (error) {
        console.error("Error processing websocket message:", error);
      }
    },
    []
  );

  const { isConnected, error } = useWebSocket(
    "wss://stream.binance.com:9443/ws/btcusdt@kline_1m",
    handleWebSocketMessage
  );

  return (
    <div className="flex flex-col min-h-screen p-4">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Crypto Trading Dashboard</h1>
        {!isConnected && (
          <Alert variant="destructive" className="mt-2">
            <AlertDescription>
              WebSocket disconnected. Attempting to reconnect...
            </AlertDescription>
          </Alert>
        )}
      </header>

      <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Chart data={marketData} signals={signals} />
        </div>

        <div>
          <ParametersForm parameters={parameters} onChange={setParameters} />
          <SignalsList signals={signals} />
        </div>
      </main>
    </div>
  );
}

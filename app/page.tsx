"use client";

import { useState, useEffect, useCallback } from "react";
import { TradingParameters, MarketData, TradingSignal } from "@/types/trading";
import { TradingStrategy } from "@/lib/strategy";
import dynamic from "next/dynamic";
import { ParametersForm } from "@/components/ParametersForm";
import { SignalsList } from "@/components/SignalsList";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { useWebSocket } from "@/lib/hooks/websocket";

const Chart = dynamic(() => import("@/components/Chart"), { ssr: false });

const DEFAULT_PARAMETERS: TradingParameters = {
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
};

export default function TradingDashboard() {
  const [parameters, setParameters] =
    useState<TradingParameters>(DEFAULT_PARAMETERS);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      if (!data.k) return; // Ensure we have kline data

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
        const lastIndex = updated.length - 1;

        if (
          lastIndex >= 0 &&
          updated[lastIndex].timestamp === newData.timestamp
        ) {
          updated[lastIndex] = newData;
        } else {
          // Keep only the last 1000 data points
          if (updated.length >= 1000) {
            updated.shift();
          }
          updated.push(newData);
        }
        return updated;
      });
    } catch (error) {
      console.error("Error processing websocket message:", error);
    }
  }, []);

  const { isConnected, error } = useWebSocket(
    "wss://stream.binance.com:9443/ws/btcusdt@kline_1m",
    handleWebSocketMessage
  );

  // Fetch initial historical data
  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/market-data");
        const data = await response.json();
        setMarketData(data);
      } catch (error) {
        console.error("Error fetching historical data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistoricalData();
  }, []);

  // Update signals when market data or parameters change
  useEffect(() => {
    if (marketData.length > 0) {
      const strategy = new TradingStrategy(parameters);
      const newSignals = strategy.analyze(marketData);
      setSignals(newSignals);
    }
  }, [marketData, parameters]);

  return (
    <div className="flex flex-col min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
      <header className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Crypto Trading Dashboard</h1>
        {!isConnected && (
          <Alert variant="destructive">
            <AlertDescription>
              WebSocket disconnected. Attempting to reconnect...
            </AlertDescription>
          </Alert>
        )}
      </header>

      <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-4">
              {isLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <p>Loading chart data...</p>
                </div>
              ) : (
                <Chart data={marketData} signals={signals} />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <h2 className="text-xl font-semibold mb-4">Trading Parameters</h2>
              <ParametersForm
                parameters={parameters}
                onChange={setParameters}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h2 className="text-xl font-semibold mb-4">Trading Signals</h2>
              <SignalsList signals={signals} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

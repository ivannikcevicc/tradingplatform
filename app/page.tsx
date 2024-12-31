"use client";

import { useState, useEffect, useCallback } from "react";
import { TradingParameters, MarketData, TradingSignal } from "@/types/trading";
import { TradingStrategy } from "@/lib/strategy";
import dynamic from "next/dynamic";
import { ParametersForm } from "@/components/ParametersForm";
import { SignalsList } from "@/components/SignalsList";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { useBinanceWebSocket } from "@/lib/hooks/websocket";

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
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [parameters, setParameters] =
    useState<TradingParameters>(DEFAULT_PARAMETERS);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleWebSocketMessage = useCallback((newData: MarketData) => {
    setMarketData((current) => {
      const updated = [...current];
      const existingIndex = updated.findIndex(
        (d) => d.timestamp === newData.timestamp
      );

      if (existingIndex >= 0) {
        updated[existingIndex] = newData;
      } else {
        updated.push(newData);
        updated.sort((a, b) => a.timestamp - b.timestamp);
        if (updated.length > 1000) {
          updated.shift();
        }
      }
      return updated;
    });
  }, []);

  const { isConnected } = useBinanceWebSocket(symbol, handleWebSocketMessage);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(
          `/api/market-data?symbol=${symbol}&interval=1h`
        );
        if (!response.ok) throw new Error("Failed to fetch historical data");
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        setMarketData(data);
      } catch (error: any) {
        setError(error.message);
        console.error("Error fetching historical data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistoricalData();
  }, [symbol]);

  // Rest of the component remains the same...
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
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </header>
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-4">
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="mb-4 p-2 border rounded"
              >
                <option value="BTCUSDT">BTC/USDT</option>
                <option value="ETHUSDT">ETH/USDT</option>
                <option value="BNBUSDT">BNB/USDT</option>
              </select>
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

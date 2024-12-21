// src/app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { TradingParameters, MarketData, TradingSignal } from "@/types/trading";
import { TradingStrategy } from "@/lib/strategy";
import dynamic from "next/dynamic";
import { ParametersForm } from "@/components/ParametersForm";
import { SignalsList } from "@/components/SignalsList";

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

  return (
    <div className="flex flex-col min-h-screen p-4">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Crypto Trading Dashboard</h1>
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

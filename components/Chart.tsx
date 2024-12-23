import { useEffect, useRef, useCallback } from "react";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  SeriesMarker,
  Time,
  CandlestickData,
  ColorType,
} from "lightweight-charts";
import { MarketData, TradingSignal } from "@/types/trading";

interface ChartProps {
  data: MarketData[];
  signals: TradingSignal[];
}

export default function Chart({ data, signals }: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lastDataRef = useRef<string>("");

  const initChart = useCallback(() => {
    if (!chartContainerRef.current || chartRef.current) return;

    chartRef.current = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: {
        background: { type: ColorType.Solid, color: "#ffffff" },
        textColor: "#333",
      },
      grid: {
        vertLines: { color: "rgba(240, 240, 240, 0.8)" },
        horzLines: { color: "rgba(240, 240, 240, 0.8)" },
      },
      crosshair: {
        mode: 0,
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: "#D1D5DB",
      },
      rightPriceScale: {
        borderColor: "#D1D5DB",
        autoScale: true,
      },
    });

    seriesRef.current = chartRef.current.addCandlestickSeries({
      upColor: "#4CAF50",
      downColor: "#FF5252",
      borderUpColor: "#4CAF50",
      borderDownColor: "#FF5252",
      wickUpColor: "#4CAF50",
      wickDownColor: "#FF5252",
    });

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const cleanup = initChart();
    return () => {
      cleanup?.();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, [initChart]);

  useEffect(() => {
    if (!seriesRef.current || !data.length) return;

    const chartData: CandlestickData[] = data.map((d) => ({
      time: (d.timestamp / 1000) as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    const markers: SeriesMarker<Time>[] = signals.map((signal) => ({
      time: (signal.timestamp / 1000) as Time,
      position: signal.type === "BUY" ? "belowBar" : "aboveBar",
      color: signal.type === "BUY" ? "#4CAF50" : "#FF5252",
      shape: signal.type === "BUY" ? "arrowUp" : "arrowDown",
      text: `${signal.type} (${signal.probability.toFixed(2)}%)`,
      size: 2,
    }));

    seriesRef.current.setData(chartData);
    seriesRef.current.setMarkers(markers);
    lastDataRef.current = JSON.stringify(data);
  }, [data, signals]);

  return <div ref={chartContainerRef} className="h-[500px] w-full" />;
}

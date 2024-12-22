import { useEffect, useRef, useCallback } from "react";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  SeriesMarker,
  Time,
  SeriesMarkerPosition,
  CandlestickData,
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

  // Initialize chart only once
  const initChart = useCallback(() => {
    if (!chartContainerRef.current || chartRef.current) return;

    chartRef.current = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: {
        background: { color: "#ffffff" },
        textColor: "#333",
      },
      grid: {
        vertLines: { color: "#f0f0f0" },
        horzLines: { color: "#f0f0f0" },
      },
      crosshair: {
        mode: 0,
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    seriesRef.current = chartRef.current.addCandlestickSeries();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, []);

  // Initialize chart once
  useEffect(() => {
    const cleanup = initChart();
    return () => {
      cleanup?.();
    };
  }, [initChart]);

  // Update data without recreating chart
  useEffect(() => {
    if (!seriesRef.current) return;

    // Convert data for chart
    const chartData: CandlestickData<Time>[] = data.map((d) => ({
      time: Math.floor(d.timestamp / 1000) as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    // Convert signals to markers
    const markers: SeriesMarker<Time>[] = signals.map((signal) => ({
      time: Math.floor(signal.timestamp / 1000) as Time,
      position:
        signal.type === "BUY"
          ? ("belowBar" as SeriesMarkerPosition)
          : ("aboveBar" as SeriesMarkerPosition),
      color: signal.type === "BUY" ? "#4CAF50" : "#FF5252",
      shape: signal.type === "BUY" ? "arrowUp" : "arrowDown",
      text: `${signal.type} (${signal.probability.toFixed(2)}%)`,
      size: 2,
    }));

    // Update data and markers
    seriesRef.current.setData(chartData);
    seriesRef.current.setMarkers(markers);
  }, [data, signals]);

  return <div ref={chartContainerRef} className="h-[500px] w-full" />;
}

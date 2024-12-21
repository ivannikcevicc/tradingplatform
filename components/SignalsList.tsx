// src/components/SignalsList.tsx
import { TradingSignal } from "@/types/trading";

interface SignalsListProps {
  signals: TradingSignal[];
}

export function SignalsList({ signals }: SignalsListProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow mt-4">
      <h2 className="text-lg font-semibold mb-4">Trading Signals</h2>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {signals.length === 0 ? (
          <p className="text-gray-500">No signals generated yet</p>
        ) : (
          signals.map((signal, index) => (
            <div
              key={`${signal.timestamp}-${index}`}
              className={`p-3 rounded-lg border ${
                signal.type === "BUY"
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex justify-between items-center">
                <span
                  className={`font-semibold ${
                    signal.type === "BUY" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {signal.type}
                </span>
                <span className="text-sm text-gray-600">
                  {new Date(signal.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="mt-1 text-sm">
                <div>Price: ${signal.price.toFixed(2)}</div>
                <div>Probability: {signal.probability.toFixed(2)}%</div>
                <div>Risk: ${signal.risk.toFixed(2)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

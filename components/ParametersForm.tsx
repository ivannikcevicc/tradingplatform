// src/components/ParametersForm.tsx
import { TradingParameters } from "@/types/trading";

interface ParametersFormProps {
  parameters: TradingParameters;
  onChange: (params: TradingParameters) => void;
}

export function ParametersForm({ parameters, onChange }: ParametersFormProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Trading Parameters</h2>

      <div className="space-y-4">
        {Object.entries(parameters).map(([key, value]) => (
          <div key={key} className="flex flex-col">
            <label className="text-sm text-gray-600">
              {key
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (str) => str.toUpperCase())}
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) =>
                onChange({
                  ...parameters,
                  [key]: parseFloat(e.target.value),
                })
              }
              className="mt-1 px-3 py-2 border rounded"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

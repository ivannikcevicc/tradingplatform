// src/components/ParametersForm.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TradingParameters } from "@/types/trading";

interface ParametersFormProps {
  parameters: TradingParameters;
  onChange: (params: TradingParameters) => void;
}

export function ParametersForm({ parameters, onChange }: ParametersFormProps) {
  const handleChange = (key: keyof TradingParameters, value: string) => {
    const numValue = value === "" ? 0 : Number(value);
    onChange({
      ...parameters,
      [key]: numValue,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trading Parameters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(parameters).map(([key, value]) => (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>
              {key
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (str) => str.toUpperCase())}
            </Label>
            <Input
              id={key}
              type="number"
              value={value || ""}
              onChange={(e) =>
                handleChange(key as keyof TradingParameters, e.target.value)
              }
              min={0}
              step={
                key === "bollingerMult" || key === "riskPercentage" ? 0.1 : 1
              }
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

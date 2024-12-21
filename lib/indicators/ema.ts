// src/lib/indicators/ema.ts
export function calculateEMA(data: number[], length: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (length + 1);

  // First EMA uses SMA as starting point
  ema[0] = data.slice(0, length).reduce((a, b) => a + b, 0) / length;

  for (let i = 1; i < data.length; i++) {
    ema[i] = (data[i] - ema[i - 1]) * multiplier + ema[i - 1];
  }

  return ema;
}

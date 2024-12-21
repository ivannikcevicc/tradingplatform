// src/lib/indicators/sma.ts
export function calculateSMA(data: number[], length: number): number[] {
  const sma: number[] = [];
  for (let i = length - 1; i < data.length; i++) {
    const sum = data.slice(i - length + 1, i + 1).reduce((a, b) => a + b, 0);
    sma.push(sum / length);
  }
  return sma;
}

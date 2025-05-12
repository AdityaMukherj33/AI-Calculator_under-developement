export interface CalculatorState {
  input: string;
  result: string;
  history: string[];
  isLoading: boolean;
  error: string | null;
}

export interface DifferentialEquationPoint {
  x: number;
  y: number;
}

export interface GraphDataPoint {
  x: number;
  y: number | null;
}

export interface MathFunction {
  (x: number, y?: number): number;
}

export interface IntegralResult {
  part: string;
  result: number;
  order: number;
}
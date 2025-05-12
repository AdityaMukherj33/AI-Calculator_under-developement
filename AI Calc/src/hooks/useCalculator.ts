import { useState, useCallback } from 'react';
import { CalculatorState, DifferentialEquationPoint } from '../types';
import { evaluateExpression, numericalIntegration, parseIntegral } from '../utils/mathUtils';

const initialState: CalculatorState = {
  input: '',
  result: '',
  history: [],
  isLoading: false,
  error: null
};

export const useCalculator = () => {
  const [state, setState] = useState<CalculatorState>(initialState);

  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const handleInputChange = useCallback((input: string) => {
    setState(prev => ({ ...prev, input, error: null }));
  }, []);

  const solveDifferentialEquation = useCallback((equation: string, returnPoints: boolean = false): DifferentialEquationPoint[] => {
    try {
      const h = 0.1;
      const steps = 100;
      const results: DifferentialEquationPoint[] = [];
      let x = 0;
      let y = 1;

      const equationFunc = (x: number, y: number): number => {
        const expr = equation
          .replace('dy/dx', '')
          .replace('=', '')
          .trim();
        return evaluateExpression(expr, { x, y });
      };

      for (let i = 0; i <= steps; i++) {
        results.push({ x, y });
        const dy = equationFunc(x, y);
        y += h * dy;
        x += h;
      }

      return results;
    } catch (error) {
      throw new Error(`Error solving differential equation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  const solve = useCallback(async () => {
    if (!state.input.trim()) {
      setError('Please enter an equation');
      return;
    }

    setLoading(true);
    try {
      let result: string;
      if (state.input.includes('∫')) {
        const { expr, vars } = parseIntegral(state.input);
        const integralResult = numericalIntegration(
          x => evaluateExpression(expr, { x }),
          0,
          1
        );
        result = integralResult.toFixed(6);
      } else if (state.input.toLowerCase().includes('dy/dx')) {
        const points = solveDifferentialEquation(state.input);
        result = JSON.stringify(points, null, 2);
      } else {
        const evalResult = evaluateExpression(state.input, {});
        result = evalResult.toString();
      }

      setState(prev => ({
        ...prev,
        result,
        history: [...prev.history, `${state.input} = ${result}`],
        error: null
      }));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [state.input, setError, setLoading]);

  return {
    state,
    handleInputChange,
    solve,
    solveDifferentialEquation
  };
};
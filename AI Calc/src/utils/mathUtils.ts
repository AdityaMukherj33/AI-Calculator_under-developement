import * as math from 'mathjs';
import { MathFunction, IntegralResult } from '../types';

export const evaluateExpression = (expr: string, variables: Record<string, number>): number => {
  try {
    return math.evaluate(expr, { ...variables, e: math.e, pi: math.pi });
  } catch (err) {
    throw new Error(`Invalid expression: ${expr}`);
  }
};

export const numericalIntegration = (f: MathFunction, a: number, b: number, precision: number = 1000): number => {
  const h = (b - a) / precision;
  let sum = f(a) + f(b);
  
  for (let i = 1; i < precision; i++) {
    const x = a + i * h;
    sum += 2 * f(x);
  }
  for (let i = 1; i < precision; i++) {
    const x = a + (i - 0.5) * h;
    sum += 4 * f(x);
  }
  return (h / 6) * sum;
};

export const parseIntegral = (equation: string): { expr: string; vars: string[] } => {
  const integralRegex = /∫\s*([^d]*)\s*d([a-z])/gi;
  const matches = Array.from(equation.matchAll(integralRegex));
  
  if (matches.length === 0) {
    throw new Error('No valid integral found');
  }

  const expr = matches[0][1].trim();
  const variable = matches[0][2].toLowerCase();
  const remainingExpr = equation.replace(matches[0][0], expr);

  if (matches.length > 1) {
    const { expr: nestedExpr, vars: nestedVars } = parseIntegral(remainingExpr);
    return { expr: nestedExpr, vars: [variable, ...nestedVars] };
  }

  return { expr, vars: [variable] };
};
import React, { useState, useRef, useEffect } from 'react';
import { Container, Form, Button, Card, Row, Col, Spinner } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import * as math from 'mathjs';
import { SymbolKeyboard } from './SymbolKeyboard';
import { SolutionSteps } from './SolutionSteps';
import { useCalculationHistory } from '../hooks/useCalculationHistory';
import { validateExpression, sanitizeInput } from '../utils/validation';
import { debounce } from '../utils/debounce';
import './Calculator.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface DifferentialEquationPoint {
  x: number;
  y: number;
}

interface CalculatorState {
  input: string;
  result: string;
  solutionSteps: Array<{ description: string; result: string }>;
  error?: string;
  isLoading: boolean;
}

// Then export Calculator
// Move CalculatorErrorBoundary to the top level
class CalculatorErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Calculator Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary p-4 text-center">
          <h3>Something went wrong</h3>
          <Button onClick={() => this.setState({ hasError: false })}>
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Define CalculatorContent component
const CalculatorContent: React.FC = () => {
  const [state, setState] = useState<CalculatorState>({
    input: '',
    result: '',
    solutionSteps: [],
    error: undefined,
    isLoading: false
  });
  
  const { history, addToHistory } = useCalculationHistory();
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced graph update
  const debouncedGraphUpdate = debounce(() => {
    if (state.input) {
      generateGraphData();
    }
  }, 500);

  useEffect(() => {
    debouncedGraphUpdate();
  }, [state.input]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const sanitizedInput = sanitizeInput(event.target.value);
    setState(prev => ({
      ...prev,
      input: sanitizedInput,
      error: undefined
    }));
  };

  const addSolutionStep = (description: string, result: string) => {
    setState(prev => ({
      ...prev,
      solutionSteps: [...prev.solutionSteps, { description, result }]
    }));
  };

  const handleSolve = async () => {
    const { isValid, error } = validateExpression(state.input);
    if (!isValid) {
      setState(prev => ({ ...prev, error }));
      return;
    }
  
    setState(prev => ({ 
      ...prev, 
      isLoading: true,
      solutionSteps: [],
      error: undefined 
    }));
  
    try {
      if (state.input.includes('∫')) {
        const result = await solveIntegral(state.input);
      } else if (state.input.toLowerCase().includes('dy/dx')) {
        const solveResult = await solveDifferentialEquation(state.input);
        const result = typeof solveResult === 'string' ? solveResult : JSON.stringify(solveResult, null, 2);
      } else {
        const evalResult = evaluateExpression(state.input, {});
const result = Math.abs(evalResult) < 1e-10 ? '0' : evalResult.toString();
      }
      
      addToHistory(state.input, evalResult.toString());
      setState(prev => ({
        ...prev,
        result,
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        result: `Error: ${error instanceof Error ? error.message : 'Invalid expression'}`,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Invalid expression'
      }));
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSolve();
    }
  };

  const evaluateExpression = (expr: string, variables: Record<string, number>): number => {
    try {
      return math.evaluate(expr, { ...variables, e: math.e, pi: math.pi });
    } catch (err) {
      throw new Error(`Invalid expression: ${expr}`);
    }
  };

  const numericalIntegration = (f: (x: number) => number, a: number, b: number): number => {
    const n = 1000; // number of intervals
    const h = (b - a) / n;
    
    let sum = f(a) + f(b);
    for (let i = 1; i < n; i++) {
      const x = a + i * h;
      sum += 2 * f(x);
    }
    for (let i = 1; i < n; i++) {
      const x = a + (i - 0.5) * h;
      sum += 4 * f(x);
    }
    return (h / 6) * sum;
  };

  const parseIntegral = (equation: string): { expr: string, vars: string[] } => {
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
      return {
        expr: nestedExpr,
        vars: [variable, ...nestedVars]
      };
    }

    return { expr, vars: [variable] };
  };

  const solveNestedIntegral = (expr: string, vars: string[], depth: number = 0): number => {
    if (depth >= vars.length) {
      return evaluateExpression(expr, {});
    }

    const currentVar = vars[depth];
    const a = 0; // lower bound
    const b = 1; // upper bound

    const f = (x: number) => {
      const result = solveNestedIntegral(expr, vars, depth + 1);
      return evaluateExpression(expr, { [currentVar]: x });
    };

    return numericalIntegration(f, a, b);
  };

  const solveIntegral = async (equation: string): Promise<string> => {
    try {
      const parts = equation.split('*').map(part => part.trim());
      const results = parts.map(part => {
        const { expr, vars } = parseIntegral(part);
        const result = solveNestedIntegral(expr, vars);
        return { part, result, order: vars.length };
      });
  
      const finalResult = results.reduce((acc, curr) => acc * curr.result, 1);
      return `Result = ${finalResult.toFixed(6)}\n\nDetails:\n${results.map(({ part, result, order }) => 
        `${part} (${order}-fold integral) = ${result.toFixed(6)}`
      ).join('\n')}`;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Invalid integral format');
    }
  };

  const solveDifferentialEquation = async (equation: string, returnPoints: boolean = false): Promise<string | DifferentialEquationPoint[]> => {
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
        const result = math.evaluate(expr, { x, y });
        return typeof result === 'number' ? result : 0;
      };
  
      for (let i = 0; i <= steps; i++) {
        results.push({ x, y });
        const dy = equationFunc(x, y);
        y += h * dy;
        x += h;
      }
  
      if (returnPoints) {
        return results;
      }
  
      return JSON.stringify(results, null, 2);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Invalid equation format');
    }
  };


  const handleSolve = () => {
    if (!state.input.trim()) {
      setState(prev => ({
        ...prev,
        error: 'Error: Please enter an equation'
      }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isLoading: true,
      solutionSteps: [],
      error: undefined 
    }));

    try {
      if (state.input.includes('∫')) {
        solveIntegral(state.input);
      } else if (state.input.toLowerCase().includes('dy/dx')) {
        solveDifferentialEquation(state.input);
      } else {
        const result = math.evaluate(state.input);
        const formattedResult = Math.abs(result) < 1e-10 ? 0 : result;
        setState(prev => ({
          ...prev,
          result: formattedResult.toString(),
          history: [...prev.history, `${state.input} = ${formattedResult}`],
          isLoading: false
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        result: `Error: ${error instanceof Error ? error.message : 'Invalid expression'}`,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Invalid expression'
      }));
    }
  };

  const handleSymbolClick = (symbol: string) => {
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const newValue = state.input.substring(0, start) + symbol + state.input.substring(end);
      setState(prev => ({
        ...prev,
        input: newValue
      }));
      setTimeout(() => {
        const newPosition = start + symbol.length;
        input.setSelectionRange(newPosition, newPosition);
        input.focus();
      }, 0);
    }
  };

  // Add memoization for expensive calculations
  const generateGraphData = React.useCallback(async () => {
    if (!state.input) return null;
    
    try {
      const xValues: number[] = [];
      const yValues: (number | null)[] = [];
      
      // Generate more points for smoother curves
      for (let x = -10; x <= 10; x += 0.1) {
        xValues.push(x);
        let y: number | null = null;
        
        try {
          if (state.input.includes('∫')) {
            const { expr } = parseIntegral(state.input);
            y = evaluateExpression(expr, { x });
          } else if (state.input.toLowerCase().includes('dy/dx')) {
            const results = await solveDifferentialEquation(state.input, true) as DifferentialEquationPoint[];
            const point = results.find((p: DifferentialEquationPoint) => Math.abs(p.x - x) < 0.1);
            y = point ? point.y : null;
          } else {
            const processedInput = processInput(state.input);
            y = math.evaluate(processedInput, { x, math });
          }
          
          if (y !== null && !isNaN(y) && isFinite(y)) {
            yValues.push(y);
          } else {
            yValues.push(null);
          }
        } catch {
          yValues.push(null);
        }
      }
  
      return {
        labels: xValues,
        datasets: [{
          label: state.input,
          data: yValues.map((y, i) => ({ x: xValues[i], y })),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
          pointRadius: 0,
          spanGaps: true
        }]
      };
    } catch {
      return null;
    }
  }, [state.input]);
  
  // Extract input processing logic
  const processInput = (input: string): string => {
    return input
      .replace(/sin\(/g, 'math.sin(')
      .replace(/cos\(/g, 'math.cos(')
      .replace(/tan\(/g, 'math.tan(')
      .replace(/cot\(/g, 'math.cot(')
      .replace(/sec\(/g, 'math.sec(')
      .replace(/csc\(/g, 'math.csc(')
      .replace(/pi/g, 'math.pi')
      .replace(/e(?![a-zA-Z])/g, 'math.e');
  };
  
  // Add error boundary
  class CalculatorErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { hasError: false };
    }
  
    static getDerivedStateFromError() {
      return { hasError: true };
    }
  
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      console.error('Calculator Error:', error, errorInfo);
    }
  
    render() {
      if (this.state.hasError) {
        return (
          <div className="error-boundary p-4 text-center">
            <h3>Something went wrong</h3>
            <Button onClick={() => this.setState({ hasError: false })}>
              Try Again
            </Button>
          </div>
        );
      }
  
      return this.props.children;
    }
  }
  
  // Wrap the calculator component with error boundary
  export const Calculator: React.FC = () => (
    <CalculatorErrorBoundary>
      <CalculatorContent />
    </CalculatorErrorBoundary>
  );
  
  // Main calculator content
  const CalculatorContent: React.FC = () => {
    // Add keyboard shortcuts
    useEffect(() => {
      const handleKeyboardShortcut = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.key === 'Enter') {
          e.preventDefault();
          handleSolve();
        }
      };

      window.addEventListener('keydown', handleKeyboardShortcut);
      return () => window.removeEventListener('keydown', handleKeyboardShortcut);
    }, [handleSolve]);

    // Add loading state for graph
    const [isGraphLoading, setIsGraphLoading] = useState(false);

    // Update graph data with loading state
    useEffect(() => {
      if (!state.input) return;

      setIsGraphLoading(true);
      const timer = setTimeout(async () => {
        await generateGraphData();
        setIsGraphLoading(false);
      }, 500);

      return () => clearTimeout(timer);
    }, [state.input, generateGraphData]);

    return (
      <Container fluid className="vh-100 p-3 d-flex bg-light">
        <Row className="g-4 flex-grow-1 justify-content-center align-items-center" style={{ maxWidth: '200vh' }}>
          <Col md={6} className="aspect-ratio-1x1">
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="d-flex flex-column p-4">
                <Form className="flex-grow-1 d-flex flex-column gap-4" onSubmit={e => { e.preventDefault(); handleSolve(); }}>
                  <Form.Group>
                    <Form.Control
                      type="text"
                      placeholder="Enter mathematical expression"
                      value={state.input}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      ref={inputRef}
                      className="calculator-input"
                      isInvalid={!!state.error}
                      aria-label="Mathematical expression input"
                    />
                    {state.error && (
                      <div className="error-feedback" role="alert">{state.error}</div>
                    )}
                  </Form.Group>

                  <div className="symbol-keyboard">
                    <SymbolKeyboard onSymbolClick={symbol => {
                      if (inputRef.current) {
                        const start = inputRef.current.selectionStart || 0;
                        const end = inputRef.current.selectionEnd || 0;
                        const newValue = state.input.substring(0, start) + symbol + state.input.substring(end);
                        setState(prev => ({ ...prev, input: newValue }));
                        setTimeout(() => {
                          if (inputRef.current) {
                            const newPosition = start + symbol.length;
                            inputRef.current.setSelectionRange(newPosition, newPosition);
                            inputRef.current.focus();
                          }
                        }, 0);
                      }
                    }} />
                  </div>

                  <div className="d-grid">
                    <Button
                      variant="primary"
                      onClick={handleSolve}
                      disabled={state.isLoading}
                      className="calculator-button"
                      aria-label={state.isLoading ? 'Calculating...' : 'Solve'}
                    >
                      {state.isLoading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Calculating...
                        </>
                      ) : (
                        'Solve'
                      )}
                    </Button>
                  </div>

                  {state.solutionSteps.length > 0 && (
                    <SolutionSteps steps={state.solutionSteps} />
                  )}

                  <Form.Group className="flex-grow-1">
                    <div 
                      className="result-area h-100" 
                      role="region" 
                      aria-label="Calculation result"
                    >
                      {state.result}
                    </div>
                  </Form.Group>
                </Form>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} className="aspect-ratio-1x1">
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="p-4">
                <div 
                  className="graph-container h-100"
                  role="region"
                  aria-label="Function graph"
                >
                  {isGraphLoading ? (
                    <div className="d-flex justify-content-center align-items-center h-100">
                      <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading graph...</span>
                      </Spinner>
                    </div>
                  ) : state.input && (
                    <Line
                      data={generateGraphData() || { labels: [], datasets: [] }}
                      options={graphOptions}
                    />
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  };
};

// Add chart options configuration
const graphOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      type: 'linear' as const,
      display: true,
      title: {
        display: true,
        text: 'x'
      }
    },
    y: {
      display: true,
      title: {
        display: true,
        text: 'y'
      }
    }
  },
  plugins: {
    legend: {
      position: 'top' as const
    },
    title: {
      display: true,
      text: 'Function Graph'
    }
  }
};
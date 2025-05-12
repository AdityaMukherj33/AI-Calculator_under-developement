import * as tf from '@tensorflow/tfjs';
import * as math from 'mathjs';

export interface AIResponse {
  result: string;
  error?: string;
  graph?: boolean;
}

export class AIService {
  private static instance: AIService;
  private readonly maxIterations = 1000;
  private readonly precision = 1e-10;
  private model: tf.LayersModel | null = null;
  private readonly commonEquations = [
    'dy/dx = y',
    'dy/dx = x^2',
    'dy/dx = sin(x)',
    'd^2y/dx^2 + y = 0',
    'dy/dx + 2y = x'
  ];

  private constructor() {
    this.initModel();
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private async initModel(): Promise<void> {
    // Create a simple model for equation prediction
    this.model = tf.sequential({
      layers: [
        tf.layers.dense({ units: 128, activation: 'relu', inputShape: [50] }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dense({ units: this.commonEquations.length, activation: 'softmax' })
      ]
    });

    await this.model.compile({
      optimizer: 'adam',
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });
  }

  public async processExpression(expression: string): Promise<AIResponse> {
    try {
      if (!expression.trim()) {
        return { result: '', error: 'Expression cannot be empty' };
      }

      // Handle different types of expressions
      if (expression.includes('∫')) {
        return this.handleIntegral(expression);
      } else if (expression.toLowerCase().includes('dy/dx')) {
        return this.handleDifferentialEquation(expression);
      } else {
        return this.evaluateExpression(expression);
      }
    } catch (error) {
      return {
        result: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private evaluateExpression(expression: string): AIResponse {
    try {
      const result = math.evaluate(expression);
      const formattedResult = Math.abs(result) < this.precision ? 0 : result;
      return {
        result: formattedResult.toString(),
        graph: this.isGraphable(expression)
      };
    } catch (error) {
      return {
        result: '',
        error: 'Invalid expression',
        graph: false
      };
    }
  }

  private handleIntegral(expression: string): AIResponse {
    try {
      // Placeholder for integral calculation
      return {
        result: 'Integral processing will be implemented',
        graph: true
      };
    } catch (error) {
      return {
        result: '',
        error: 'Error processing integral',
        graph: false
      };
    }
  }

  private handleDifferentialEquation(expression: string): AIResponse {
    try {
      // Placeholder for differential equation solving
      return {
        result: 'Differential equation processing will be implemented',
        graph: true
      };
    } catch (error) {
      return {
        result: '',
        error: 'Error processing differential equation',
        graph: false
      };
    }
  }

  private isGraphable(expression: string): boolean {
    try {
      // Check if expression contains variables
      const containsVariables = /[xy]/.test(expression);
      if (!containsVariables) return false;

      // Test if expression can be evaluated with a sample value
      const testValue = 1;
      math.evaluate(expression, { x: testValue, y: testValue });
      return true;
    } catch {
      return false;
    }
  }

  public getSuggestions(partialEquation: string): string[] {
    if (!partialEquation) return [];
    
    // Simple pattern matching for now
    return this.commonEquations.filter(eq =>
      eq.toLowerCase().includes(partialEquation.toLowerCase())
    );
  }
}

export const aiService = AIService.getInstance();
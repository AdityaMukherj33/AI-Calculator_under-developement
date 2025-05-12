export const validateExpression = (expr: string): { isValid: boolean; error?: string } => {
  if (!expr.trim()) {
    return { isValid: false, error: 'Expression cannot be empty' };
  }

  // Check for balanced parentheses
  const stack: string[] = [];
  for (const char of expr) {
    if (char === '(') {
      stack.push(char);
    } else if (char === ')') {
      if (stack.length === 0) {
        return { isValid: false, error: 'Unmatched closing parenthesis' };
      }
      stack.pop();
    }
  }
  if (stack.length > 0) {
    return { isValid: false, error: 'Unmatched opening parenthesis' };
  }

  // Check for invalid operators
  const operators = ['++', '--', '**', '//', '=='];
  for (const op of operators) {
    if (expr.includes(op)) {
      return { isValid: false, error: `Invalid operator: ${op}` };
    }
  }

  // Check for invalid mathematical expressions
  try {
    // Simple syntax check
    Function('return ' + expr);
    return { isValid: true };
  } catch (e) {
    return { isValid: false, error: 'Invalid mathematical expression' };
  }
};

export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML/XML tags
    .replace(/[\u2028\u2029]/g, '\n') // Replace line separators
    .trim();
};
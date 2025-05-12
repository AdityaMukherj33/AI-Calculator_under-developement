import React from 'react';
import { Button, Grid, Paper, Tooltip, useMediaQuery, useTheme } from '@mui/material';

interface SymbolKeyboardProps {
  onSymbolClick: (symbol: string) => void;
}

export const SymbolKeyboard: React.FC<SymbolKeyboardProps> = ({ onSymbolClick }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const symbols = [
    { label: 'dy/dx', value: 'dy/dx = ', description: 'First derivative with respect to x' },
    { label: 'd²y/dx²', value: 'd²y/dx² = ', description: 'Second derivative with respect to x' },
    { label: '∫', value: '∫', description: 'Integral' },
    { label: '∂', value: '∂', description: 'Partial derivative' },
    { label: 'sin', value: 'sin(', description: 'Sine function' },
    { label: 'cos', value: 'cos(', description: 'Cosine function' },
    { label: 'e^', value: 'e^(', description: 'Exponential function' },
    { label: 'ln', value: 'ln(', description: 'Natural logarithm' },
    { label: '√', value: 'sqrt(', description: 'Square root' },
    { label: 'x', value: 'x', description: 'Variable x' },
    { label: 'y', value: 'y', description: 'Variable y' },
    { label: '=', value: ' = ', description: 'Equals' },
    { label: '+', value: ' + ', description: 'Addition' },
    { label: '-', value: ' - ', description: 'Subtraction' },
    { label: '×', value: ' * ', description: 'Multiplication' },
    { label: '÷', value: ' / ', description: 'Division' },
    { label: '(', value: '(', description: 'Open parenthesis' },
    { label: ')', value: ')', description: 'Close parenthesis' },
    { label: '^', value: '^', description: 'Power' },
    { label: 'π', value: 'pi', description: 'Pi constant' },
  ];

  const handleKeyDown = (event: React.KeyboardEvent, symbol: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      onSymbolClick(symbol);
    }
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 1, 
        mt: 2,
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      <Grid container spacing={1}>
        {symbols.map((symbol, index) => (
          <Grid item xs={3} sm={2} key={index}>
            <Tooltip title={symbol.description} arrow placement="top">
              <Button
                variant="outlined"
                fullWidth
                onClick={() => onSymbolClick(symbol.value)}
                onKeyDown={(e) => handleKeyDown(e, symbol.value)}
                aria-label={`Insert ${symbol.description}`}
                tabIndex={0}
                sx={{
                  minWidth: 0,
                  p: isMobile ? 0.5 : 1,
                  fontFamily: 'math',
                  fontSize: isMobile ? '0.875rem' : '1rem',
                  touchAction: 'manipulation',
                  '&:focus-visible': {
                    outline: `2px solid ${theme.palette.primary.main}`,
                    outlineOffset: 2
                  }
                }}
              >
                {symbol.label}
              </Button>
            </Tooltip>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};
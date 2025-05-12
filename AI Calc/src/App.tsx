import React from 'react';
import { Container, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { Calculator } from './components/Calculator';

const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="sm">
        <Calculator />
      </Container>
    </ThemeProvider>
  );
};

export default App;
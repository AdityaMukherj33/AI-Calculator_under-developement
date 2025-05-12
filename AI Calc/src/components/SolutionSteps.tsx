import React from 'react';
import { Paper, Typography, Stepper, Step, StepLabel, StepContent } from '@mui/material';

interface SolutionStep {
  description: string;
  result: string;
}

interface SolutionStepsProps {
  steps: SolutionStep[];
}

export const SolutionSteps: React.FC<SolutionStepsProps> = ({ steps }) => {
  return (
    <Paper elevation={1} sx={{ p: 2, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Solution Steps
      </Typography>
      <Stepper orientation="vertical">
        {steps.map((step, index) => (
          <Step key={index} active={true}>
            <StepLabel>
              <Typography variant="subtitle2">{step.description}</Typography>
            </StepLabel>
            <StepContent>
              <Typography variant="body2" color="text.secondary">
                {step.result}
              </Typography>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </Paper>
  );
};
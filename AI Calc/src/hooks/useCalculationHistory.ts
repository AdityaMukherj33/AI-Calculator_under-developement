import { useState, useCallback } from 'react';

interface CalculationHistoryEntry {
  input: string;
  result: string;
  timestamp: number;
}

export const useCalculationHistory = () => {
  const [history, setHistory] = useState<CalculationHistoryEntry[]>(() => {
    const saved = localStorage.getItem('calculationHistory');
    return saved ? JSON.parse(saved) : [];
  });

  const addToHistory = useCallback((input: string, result: string) => {
    const newEntry = {
      input,
      result,
      timestamp: Date.now()
    };
    setHistory(prev => {
      const updated = [newEntry, ...prev].slice(0, 50); // Keep last 50 entries
      localStorage.setItem('calculationHistory', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem('calculationHistory');
  }, []);

  return { history, addToHistory, clearHistory };
};
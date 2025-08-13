// src/components/LineContext.tsx
import React from 'react';

export type LineMap = Record<string, string>;

export type LineContextValue = {
  /** Update or seed latex for a line */
  setLine: (id: string, latex: string) => void;
  /** Read-only snapshot of all lines */
  getAll: () => LineMap;
};

export const LineContext = React.createContext<LineContextValue | null>(null);

export const useLineContext = () => {
  const ctx = React.useContext(LineContext);
  if (!ctx) {
    throw new Error(
      'useLineContext must be used within <LineContext.Provider>'
    );
  }
  return ctx;
};

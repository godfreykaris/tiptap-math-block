// src/hooks/useMathModalBridge.ts
import { useEffect, useMemo, useState } from 'react';

type MatrixRec = {
  id: string;
  label: string; // M1, M2, ...
  rows: number;
  cols: number;
  cells: string[][];
};

type OnSavePayload = {
  latex: string;
  matrices: Record<string, MatrixRec>;
};

type BridgeState = {
  isOpen: boolean;
  latex: string;
  id: string;
  matrices: Record<string, MatrixRec>;
  onSave: (payload: OnSavePayload) => void;
  mode: 'inline' | 'block';
};

export default function useMathModalBridge() {
  const [state, setState] = useState<BridgeState>({
    isOpen: false,
    latex: '',
    id: '',
    matrices: {},
    onSave: () => {},
    mode: 'block',
  });

  useEffect(() => {
    const handleOpenModal = (event: Event) => {
      const { latex, id, matrices, onSave, mode } = (
        event as CustomEvent<{
          latex: string;
          id: string;
          matrices?: Record<string, MatrixRec>;
          onSave: (payload: OnSavePayload) => void;
          mode?: 'inline' | 'block';
        }>
      ).detail;

      setState({
        isOpen: true,
        latex,
        id,
        matrices: matrices ?? {},
        onSave,
        mode: mode ?? 'block',
      });
    };

    window.addEventListener('openMathModal', handleOpenModal);
    return () => window.removeEventListener('openMathModal', handleOpenModal);
  }, []);

  const close = () =>
    setState({
      isOpen: false,
      latex: '',
      id: '',
      matrices: {},
      onSave: () => {},
      mode: 'block',
    });

  const modalProps = useMemo(
    () => ({
      isOpen: state.isOpen,
      onClose: close,
      initialLatex: state.latex,
      initialMatrices: state.matrices,
      onSave: (payload: OnSavePayload) => state.onSave(payload),
      id: state.id,
      mode: state.mode as 'inline' | 'block',
    }),
    [state]
  );

  return { modalProps, openState: state, close };
}

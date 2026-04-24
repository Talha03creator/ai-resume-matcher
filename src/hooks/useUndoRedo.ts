import { useState, useCallback, useRef, useEffect } from 'react';

export function useUndoRedo<T>(initialState: T, debounceMs: number = 500) {
  const [state, setState] = useState<T>(initialState);
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentIndexRef = useRef(0);
  currentIndexRef.current = currentIndex;

  const set = useCallback((newState: T) => {
    setState(newState);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setHistory((prev) => {
        const currentIdx = currentIndexRef.current;
        if (prev[currentIdx] === newState) return prev;
        
        const newHistory = prev.slice(0, currentIdx + 1);
        newHistory.push(newState);
        return newHistory;
      });
      setCurrentIndex((prev) => prev + 1);
    }, debounceMs);
  }, [debounceMs]);

  const undo = useCallback(() => {
    if (currentIndexRef.current > 0) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const newIndex = currentIndexRef.current - 1;
      setCurrentIndex(newIndex);
      setState(history[newIndex]);
    }
  }, [history]);

  const redo = useCallback(() => {
    if (currentIndexRef.current < history.length - 1) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const newIndex = currentIndexRef.current + 1;
      setCurrentIndex(newIndex);
      setState(history[newIndex]);
    }
  }, [history]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return {
    state,
    set,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}

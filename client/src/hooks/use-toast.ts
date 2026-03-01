import { useState, useCallback } from "react";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

let toastCount = 0;
let listeners: Array<(toasts: Toast[]) => void> = [];
let memoryState: Toast[] = [];

function dispatch(toasts: Toast[]) {
  memoryState = toasts;
  listeners.forEach((listener) => listener(toasts));
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(memoryState);

  useState(() => {
    listeners.push(setToasts);
    return () => {
      listeners = listeners.filter((l) => l !== setToasts);
    };
  });

  const toast = useCallback(({ title, description, variant = "default" }: Omit<Toast, "id">) => {
    const id = String(toastCount++);
    const newToast: Toast = { id, title, description, variant };
    dispatch([...memoryState, newToast]);
    setTimeout(() => {
      dispatch(memoryState.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    dispatch(memoryState.filter((t) => t.id !== id));
  }, []);

  return { toasts, toast, dismiss };
}

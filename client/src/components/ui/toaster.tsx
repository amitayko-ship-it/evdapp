import { useToast } from "../../hooks/use-toast";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 max-w-md">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`rounded-lg shadow-lg border p-4 ${
              toast.variant === "destructive"
                ? "bg-red-50 border-red-200 text-red-900"
                : "bg-white border-gray-200 text-gray-900"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="font-medium text-sm">{toast.title}</p>
                {toast.description && (
                  <p className="text-xs mt-1 opacity-80">{toast.description}</p>
                )}
              </div>
              <button onClick={() => dismiss(toast.id)} className="opacity-50 hover:opacity-100">
                <X size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

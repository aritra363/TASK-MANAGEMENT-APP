import React, { createContext, useContext } from "react";
import toast from "react-hot-toast";

interface ToastContextValue {
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
  warning: (msg: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToastContext = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("ToastContext not found");
  return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const value: ToastContextValue = {
    success: (msg) => toast.success(msg, { duration: 3000 }),
    error: (msg) => toast.error(msg, { duration: 3000 }),
    info: (msg) => toast(msg, { duration: 3000, icon: "ℹ️" }),
    warning: (msg) => toast(msg, { duration: 3000, icon: "⚠️" })
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

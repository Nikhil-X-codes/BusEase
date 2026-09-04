import { createContext, useContext, useEffect, useState } from "react";

const ToastContext = createContext({ push: () => {} });

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = (toast) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current.slice(-2), { id, ...toast }]);
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 5000);
  };
  useEffect(() => {
    const handleToast = (event) => push(event.detail);
    window.addEventListener("app:toast", handleToast);
    return () => window.removeEventListener("app:toast", handleToast);
  }, []);
  return <ToastContext.Provider value={{ push }}>{children}<div className="fixed right-4 top-4 z-50 grid gap-2" aria-live="polite">{toasts.map((toast) => <div key={toast.id} className="max-w-sm rounded-lg border border-white/20 bg-slate-900 px-4 py-3 text-sm text-white shadow-xl">{toast.message}<button onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))} className="ml-3 text-slate-400" aria-label="Close notification">×</button></div>)}</div></ToastContext.Provider>;
}

export const useToast = () => useContext(ToastContext);

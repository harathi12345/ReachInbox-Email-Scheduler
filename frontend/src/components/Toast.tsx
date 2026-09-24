import { useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, X } from "lucide-react";
import { ToastContext } from "./ToastContext";

export const ToastProvider = ({ children }: { children: ReactNode }) => {
	const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);

	const showToast = (message: string) => {
		const id = Date.now() + Math.random();
		setToasts((current) => [...current, { id, message }]);
		window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3200);
	};

	const value = useMemo(() => ({ showToast }), []);
	return <ToastContext.Provider value={value}>{children}<div className="toast-stack" aria-live="polite"><AnimatePresence initial={false}>{toasts.map((toast) => <motion.div key={toast.id} className="toast" initial={{ opacity: 0, x: 24, scale: 0.97 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 16, scale: 0.97 }} transition={{ duration: 0.24, ease: "easeOut" }}><CheckCircle2 size={17} className="text-emerald-400" /><span>{toast.message}</span><button className="toast-close" aria-label="Dismiss notification" onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}><X size={14} /></button></motion.div>)}</AnimatePresence></div></ToastContext.Provider>;
};

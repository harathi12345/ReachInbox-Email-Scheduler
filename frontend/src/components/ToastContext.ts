import { createContext, useContext } from "react";

export type ToastContextValue = { showToast: (message: string) => void };
export const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
	const context = useContext(ToastContext);
	if (!context) throw new Error("useToast must be used inside ToastProvider");
	return context;
};
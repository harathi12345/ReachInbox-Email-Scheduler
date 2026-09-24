import type { Variants } from "framer-motion";

export const pageVariants: Variants = {
	initial: { opacity: 0, y: 8 },
	animate: { opacity: 1, y: 0, transition: { duration: 0.32, ease: "easeOut" } },
	exit: { opacity: 0, y: -5, transition: { duration: 0.2, ease: "easeIn" } },
};

export const sectionVariants: Variants = {
	initial: { opacity: 0, y: 14 },
	animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export const staggerVariants: Variants = {
	initial: {},
	animate: { transition: { staggerChildren: 0.07 } },
};

export const itemVariants: Variants = {
	initial: { opacity: 0, y: 10 },
	animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};
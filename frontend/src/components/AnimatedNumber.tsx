import { useEffect, useState } from "react";

type AnimatedNumberProps = { value: string; duration?: number };

const AnimatedNumber = ({ value, duration = 650 }: AnimatedNumberProps) => {
	const numericValue = Number(value.replace(/[^\d.]/g, ""));
	const suffix = value.includes("%") ? "%" : "";
	const decimalPlaces = value.includes(".") ? value.split(".")[1].replace(/\D/g, "").length : 0;
	const [displayValue, setDisplayValue] = useState(0);

	useEffect(() => {
		let frame = 0;
		const startedAt = performance.now();
		const tick = (now: number) => {
			const progress = Math.min((now - startedAt) / duration, 1);
			const easedProgress = 1 - Math.pow(1 - progress, 3);
			setDisplayValue(numericValue * easedProgress);
			if (progress < 1) frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	}, [duration, numericValue]);

	return <>{displayValue.toLocaleString(undefined, { maximumFractionDigits: decimalPlaces, minimumFractionDigits: decimalPlaces })}{suffix}</>;
};

export default AnimatedNumber;
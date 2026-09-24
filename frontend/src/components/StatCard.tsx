import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import AnimatedNumber from "./AnimatedNumber";
import { itemVariants } from "./motion";

type StatCardProps = { label: string; value: string; change?: string; positive?: boolean; icon: LucideIcon; color: "blue" | "purple" | "amber" | "rose"; index: number };

const StatCard = ({ label, value, change, positive, icon: Icon, color, index }: StatCardProps) => (
	<motion.article className="stat-card" variants={itemVariants} initial="initial" animate="animate" transition={{ delay: index * 0.08 }} whileHover={{ y: -4 }}>
		<div className={`stat-icon stat-icon-${color}`}><Icon size={18} /></div>
		<div className="mt-5 flex items-end justify-between gap-2">
			<div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold tracking-[-0.04em] text-white"><AnimatedNumber value={value} /></p></div>
			{change && <span className={`trend ${positive ? "trend-positive" : "trend-negative"}`}>{positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{change}</span>}
		</div>
	</motion.article>
);

export default StatCard;

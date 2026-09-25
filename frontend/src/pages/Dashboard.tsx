import { motion } from "framer-motion";
import { Ban, CheckCircle2, Clock3, Layers3, Mail, XCircle, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ActivityChart from "../components/ActivityChart";
import RecentEmails from "../components/RecentEmails";
import StatCard from "../components/StatCard";
import { fetchDashboardStats, fetchEmails, fetchRecentEmails } from "../lib/api";
import type { DashboardStats, EmailRecord } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

const Dashboard = () => {
	const navigate = useNavigate();
	const { user } = useAuth();
	const [stats, setStats] = useState<DashboardStats>({ total: 0, sent: 0, scheduled: 0, pending: 0, failed: 0, cancelled: 0 });
	const [recentEmails, setRecentEmails] = useState<EmailRecord[]>([]);
	const [allEmails, setAllEmails] = useState<EmailRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		const loadDashboard = async () => {
			try {
				const [statsResponse, recentResponse, emailsResponse] = await Promise.all([
					fetchDashboardStats(),
					fetchRecentEmails(),
					fetchEmails(),
				]);
				setStats(statsResponse);
				setRecentEmails(recentResponse ?? []);
				setAllEmails(emailsResponse ?? []);
			} catch {
				setError("Unable to load dashboard data. Check that the backend is running.");
				setStats({ total: 0, sent: 0, scheduled: 0, pending: 0, failed: 0, cancelled: 0 });
				setRecentEmails([]);
			} finally {
				setLoading(false);
			}
		};

		loadDashboard();
	}, []);

	const statItems = useMemo(() => [
		{ label: "Total Campaigns", value: String(stats.total || 0), icon: Layers3, color: "blue" as const },
		{ label: "Emails Sent", value: String(stats.sent || 0), icon: Mail, color: "blue" as const },
		{ label: "Scheduled", value: String(stats.scheduled || 0), icon: Clock3, color: "purple" as const },
		{ label: "Pending", value: String(stats.pending || 0), icon: CheckCircle2, color: "amber" as const },
		{ label: "Failed", value: String(stats.failed || 0), icon: XCircle, color: "rose" as const },
		{ label: "Cancelled", value: String(stats.cancelled || 0), icon: Ban, color: "rose" as const },
	], [stats]);

	return <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
		<motion.section className="mb-8 flex flex-col justify-between gap-6 sm:flex-row sm:items-end" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
			<div><p className="section-label">{new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p><h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-white sm:text-[30px]">Good evening, {user?.name || "there"} <span className="text-xl sm:text-2xl">👋</span></h2><p className="mt-2 max-w-md text-sm text-slate-500">Manage and monitor your email campaigns from one place.</p></div>
			<motion.button className="primary-button self-start sm:self-auto" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => navigate("/campaigns/create")}><Plus size={17} strokeWidth={2.5} />Create Campaign</motion.button>
		</motion.section>
		{error && <p className="mb-5 rounded-lg border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-xs text-rose-300">{error}</p>}
		<section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">{statItems.map((stat, index) => <StatCard key={stat.label} {...stat} index={index} />)}</section>
		<div className="mt-6"><ActivityChart emails={allEmails} /></div>
		<div className="mt-6"><RecentEmails emails={recentEmails} loading={loading} /></div>
	</div>;
};

export default Dashboard;

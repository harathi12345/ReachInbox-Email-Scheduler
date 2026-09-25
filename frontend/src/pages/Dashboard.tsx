import { motion } from "framer-motion";
import { Ban, CheckCircle2, Clock3, Layers3, Mail, XCircle, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ActivityChart from "../components/ActivityChart";
import RecentEmails from "../components/RecentEmails";
import StatCard from "../components/StatCard";
import { fetchDashboardStats, fetchEmails, fetchRecentEmails, fetchSlackStatus, disconnectSlackApi } from "../lib/api";
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
	
	const [slackConnected, setSlackConnected] = useState(false);
	const [slackLoading, setSlackLoading] = useState(false);

	useEffect(() => {
		const loadDashboard = async () => {
			try {
				const [statsResponse, recentResponse, emailsResponse, slackResponse] = await Promise.all([
					fetchDashboardStats(),
					fetchRecentEmails(),
					fetchEmails(),
					fetchSlackStatus().catch(() => ({ connected: false }))
				]);
				setStats(statsResponse);
				setRecentEmails(recentResponse ?? []);
				setAllEmails(emailsResponse ?? []);
				setSlackConnected(slackResponse.connected);
			} catch (err: any) {
				setError(err?.message || "Unable to load dashboard data.");
				setStats({ total: 0, sent: 0, scheduled: 0, pending: 0, failed: 0, cancelled: 0 });
				setRecentEmails([]);
			} finally {
				setLoading(false);
			}
		};

		loadDashboard();
	}, []);

	const handleSlackConnect = () => {
		const token = localStorage.getItem("reachinbox_token");
		const DEFAULT_BACKEND_URL = import.meta.env.DEV
			? "http://localhost:5000"
			: "https://reachinbox-backend-ncnd.onrender.com";
		const rawBaseUrl = import.meta.env.VITE_API_URL || DEFAULT_BACKEND_URL;
		const backendUrl = rawBaseUrl.replace(/\/$/, "").replace(/\/api$/, "");
		window.location.href = `${backendUrl}/auth/slack?token=${token || ""}`;
	};

	const handleSlackDisconnect = async () => {
		setSlackLoading(true);
		try {
			await disconnectSlackApi();
			setSlackConnected(false);
		} catch (err: any) {
			setError(err.message || "Failed to disconnect Slack");
		} finally {
			setSlackLoading(false);
		}
	};

	const statItems = useMemo(() => [
		{ label: "Total Emails", value: String(stats.total || 0), icon: Layers3, color: "blue" as const },
		{ label: "Emails Sent", value: String(stats.sent || 0), icon: Mail, color: "blue" as const },
		{ label: "Scheduled", value: String(stats.scheduled || 0), icon: Clock3, color: "purple" as const },
		{ label: "Pending", value: String(stats.pending || 0), icon: CheckCircle2, color: "amber" as const },
		{ label: "Failed", value: String(stats.failed || 0), icon: XCircle, color: "rose" as const },
		{ label: "Cancelled", value: String(stats.cancelled || 0), icon: Ban, color: "rose" as const },
	], [stats]);

	return <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
		<motion.section className="mb-8 flex flex-col justify-between gap-6 sm:flex-row sm:items-end" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
			<div>
				<p className="section-label">{new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
				<h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-white sm:text-[30px]">Good evening, {user?.name || "there"} <span className="text-xl sm:text-2xl">👋</span></h2>
				<p className="mt-2 max-w-md text-sm text-slate-500">Manage and monitor your email deliveries from one place.</p>
				<div className="mt-4 flex items-center gap-3">
					{!slackConnected ? (
						<button onClick={handleSlackConnect} className="rounded-lg bg-blue-600/20 px-3 py-1.5 text-xs font-semibold text-blue-400 border border-blue-500/30 transition hover:bg-blue-600/30">Connect Slack</button>
					) : (
						<div className="flex items-center gap-2">
							<span className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30">Slack Connected</span>
							<button onClick={handleSlackDisconnect} disabled={slackLoading} className="rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-400 border border-rose-500/30 transition hover:bg-rose-500/30">{slackLoading ? "Disconnecting..." : "Disconnect"}</button>
						</div>
					)}
				</div>
			</div>
			<motion.button className="primary-button self-start sm:self-auto" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => navigate("/campaigns/create")}><Plus size={17} strokeWidth={2.5} />Compose New Email</motion.button>
		</motion.section>
		{error && <p className="mb-5 rounded-lg border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-xs text-rose-300">{error}</p>}
		<section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">{statItems.map((stat, index) => <StatCard key={stat.label} {...stat} index={index} />)}</section>
		<div className="mt-6"><ActivityChart emails={allEmails} /></div>
		<div className="mt-6"><RecentEmails emails={recentEmails} loading={loading} /></div>
	</div>;
};

export default Dashboard;

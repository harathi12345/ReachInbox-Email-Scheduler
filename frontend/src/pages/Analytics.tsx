import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, Ban, Clock3, Mail, Send, XCircle } from "lucide-react";
import { fetchDashboardStats, fetchEmails, type DashboardStats, type EmailRecord } from "../lib/api";

const emptyStats: DashboardStats = { total: 0, sent: 0, scheduled: 0, pending: 0, failed: 0, cancelled: 0 };
const ranges = [{ label: "7 Days", days: 7 }, { label: "30 Days", days: 30 }, { label: "90 Days", days: 90 }];

const Analytics = () => {
  const [stats, setStats] = useState(emptyStats);
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [range, setRange] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { Promise.all([fetchDashboardStats(), fetchEmails()]).then(([dashboardStats, records]) => { setStats(dashboardStats); setEmails(records); }).catch(() => setError("Unable to load analytics data.")).finally(() => setLoading(false)); }, []);

  const chartData = useMemo(() => Array.from({ length: range }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (range - index - 1));
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    const dayEmails = emails.filter((email) => { const created = new Date(email.createdAt); return created >= date && created < next; });
    return { day: date.toLocaleDateString([], { month: "short", day: "numeric" }), sent: dayEmails.filter((email) => email.status === "SENT").length, scheduled: dayEmails.filter((email) => email.status === "SCHEDULED").length, failed: dayEmails.filter((email) => email.status === "FAILED").length };
  }), [emails, range]);

  const statItems = [
    { label: "Total Emails", value: stats.total, icon: Mail, color: "blue" },
    { label: "Sent Emails", value: stats.sent, icon: Send, color: "green" },
    { label: "Scheduled Emails", value: stats.scheduled, icon: Clock3, color: "purple" },
    { label: "Failed Emails", value: stats.failed, icon: XCircle, color: "rose" },
    { label: "Cancelled Emails", value: stats.cancelled, icon: Ban, color: "amber" },
  ];

  return <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
    <motion.section className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}><div><p className="section-label">Performance overview</p><h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-white sm:text-[30px]">Analytics</h2><p className="mt-2 text-sm text-slate-500">Track real email delivery data.</p></div><div className="flex rounded-lg border border-white/[0.08] bg-white/[0.03] p-1">{ranges.map((item) => <button key={item.days} className={`rounded-md px-3 py-2 text-xs font-semibold transition-colors ${range === item.days ? "bg-blue-500/15 text-blue-300" : "text-slate-500 hover:text-slate-300"}`} onClick={() => setRange(item.days)}>{item.label}</button>)}</div></motion.section>
    {error && <p className="mb-5 rounded-lg border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-xs text-rose-300">{error}</p>}
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">{statItems.map(({ label, value, icon: Icon, color }, index) => <motion.article key={label} className="stat-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .07 }}><div className={`stat-icon stat-icon-${color}`}><Icon size={17} /></div><p className="mt-5 text-xs font-medium text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-white">{loading ? "..." : value}</p></motion.article>)}</section>
    <section className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_1fr]"><motion.section className="surface-card min-w-0 p-5 sm:p-6" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}><p className="section-label">Delivery history</p><h3 className="mt-1 text-base font-bold text-white">Real delivery activity</h3>{emails.length === 0 ? <p className="mt-8 text-sm text-slate-500">No email activity yet.</p> : <div className="mt-6 h-[285px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}><defs><linearGradient id="analyticsSent" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#60a5fa" stopOpacity={.22} /><stop offset="100%" stopColor="#60a5fa" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#ffffff0b" vertical={false} /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} /><Tooltip contentStyle={{ background: "#10182b", border: "1px solid #273452", borderRadius: 10, color: "#e2e8f0", fontSize: 12 }} /><Area type="monotone" dataKey="sent" name="Sent" stroke="#60a5fa" fill="url(#analyticsSent)" strokeWidth={2.5} /><Area type="monotone" dataKey="scheduled" name="Scheduled" stroke="#a78bfa" fill="none" strokeWidth={2} /><Area type="monotone" dataKey="failed" name="Failed" stroke="#fb7185" fill="none" strokeWidth={2} /></AreaChart></ResponsiveContainer></div>}</motion.section><motion.section className="surface-card p-5 sm:p-6" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}><p className="section-label">Tracking</p><h3 className="mt-1 text-base font-bold text-white">Engagement metrics</h3><div className="mt-6 space-y-4">{["Delivery rate", "Open rate", "Click rate"].map((label) => <div key={label} className="flex items-center justify-between border-b border-white/[0.06] pb-4 text-sm"><span className="text-slate-400">{label}</span><span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500"><Activity size={14} />No tracking data</span></div>)}</div><p className="mt-5 text-xs leading-5 text-slate-600">Open and click tracking are not collected by the current mail pipeline.</p></motion.section></section>
  </div>;
};

export default Analytics;

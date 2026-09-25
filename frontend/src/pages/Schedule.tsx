import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Clock3, Mail, Users } from "lucide-react";
import { fetchEmails, type EmailRecord } from "../lib/api";

const statusTone: Record<string, string> = { SCHEDULED: "blue", PROCESSING: "amber", FAILED: "red", SENT: "green", CANCELLED: "purple" };
const dayStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const Schedule = () => {
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEmails().then(setEmails).catch(() => setError("Unable to load scheduled emails.")).finally(() => setLoading(false));
  }, []);

  const groups = useMemo(() => {
    const today = dayStart(new Date());
    const tomorrow = today + 86400000;
    const scheduled = emails.filter((email) => email.status === "SCHEDULED" && email.scheduledAt);
    return [
      { title: "Today", items: scheduled.filter((email) => dayStart(new Date(email.scheduledAt as string)) === today) },
      { title: "Tomorrow", items: scheduled.filter((email) => dayStart(new Date(email.scheduledAt as string)) === tomorrow) },
      { title: "Upcoming", items: scheduled.filter((email) => dayStart(new Date(email.scheduledAt as string)) > tomorrow) },
    ].filter((group) => group.items.length > 0);
  }, [emails]);

  return <div className="mx-auto max-w-[1080px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}><p className="section-label">Delivery calendar</p><h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-white sm:text-[30px]">Schedule</h2><p className="mt-2 text-sm text-slate-500">Manage your upcoming email deliveries.</p></motion.div>
    {error && <p className="mt-6 rounded-lg border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-xs text-rose-300">{error}</p>}
    {loading ? <p className="mt-8 text-sm text-slate-500">Loading scheduled emails...</p> : groups.length === 0 ? <div className="surface-card mt-8 px-6 py-14 text-center"><CalendarDays className="mx-auto text-slate-600" size={24} /><p className="mt-3 text-sm font-semibold text-slate-300">No scheduled emails</p><p className="mt-1 text-xs text-slate-600">New future deliveries will appear here.</p></div> : <div className="mt-8 space-y-8">{groups.map((group, groupIndex) => <motion.section key={group.title} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: groupIndex * 0.1 }}><div className="mb-3 flex items-end justify-between"><h3 className="text-sm font-bold text-white">{group.title}</h3><span className="text-[10px] uppercase tracking-[0.12em] text-slate-600">{group.items.length} {group.items.length === 1 ? "delivery" : "deliveries"}</span></div><div className="relative space-y-3 pl-5 before:absolute before:bottom-5 before:left-[5px] before:top-5 before:w-px before:bg-white/[0.08]">{group.items.map((email, itemIndex) => <motion.article key={email.id} className="surface-card relative p-4 transition-colors hover:border-blue-400/20 sm:p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: itemIndex * 0.05 }}><span className="absolute -left-[23px] top-7 h-2.5 w-2.5 rounded-full border-2 border-[#070b17] bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.6)]" /><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="stat-icon stat-icon-purple"><Mail size={17} /></div><div><h4 className="text-sm font-semibold text-slate-200">{email.subject}</h4><div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500"><span className="inline-flex items-center gap-1"><Users size={12} />1 recipient</span><span className="inline-flex items-center gap-1"><CalendarDays size={12} />{new Date(email.scheduledAt as string).toLocaleDateString()}</span><span>{Intl.DateTimeFormat().resolvedOptions().timeZone}</span></div></div></div><div className="flex items-center justify-between gap-5 sm:justify-end"><span className="inline-flex items-center gap-1.5 text-xs text-slate-400"><Clock3 size={13} />{new Date(email.scheduledAt as string).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span><span className={`status-pill status-${statusTone[email.status]}`}><i />{email.status}</span></div></div></motion.article>)}</div></motion.section>)}</div>}
  </div>;
};

export default Schedule;

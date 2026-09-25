import { motion } from "framer-motion";
import { ArrowUpRight, MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { EmailRecord } from "../lib/api";

type RecentEmailProps = {
    emails?: EmailRecord[];
  loading?: boolean;
};

const statusTone: Record<string, string> = {
  SENT: "green",
  SCHEDULED: "blue",
  PENDING: "amber",
  PROCESSING: "amber",
  FAILED: "red",
  CANCELLED: "purple",
};

const RecentEmails = ({ emails = [], loading = false }: RecentEmailProps) => {
  const navigate = useNavigate();

  return (
  <motion.section className="surface-card overflow-hidden" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}>
    <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-5 sm:px-6"><div><p className="section-label">Your workspace</p><h2 className="mt-1 text-base font-bold text-white">Recent emails</h2></div><button className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 transition-colors hover:text-blue-300" onClick={() => navigate("/campaigns")}>View all <ArrowUpRight size={14} /></button></div>
    <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left"><thead><tr className="border-b border-white/[0.05] text-[10px] uppercase tracking-[0.12em] text-slate-600"><th className="px-5 py-3 font-semibold sm:px-6">Email Subject</th><th className="px-4 py-3 font-semibold">Recipients</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 font-semibold">Scheduled</th><th className="px-4 py-3" /></tr></thead><tbody>{loading ? <tr><td className="px-5 py-4 text-sm text-slate-500" colSpan={5}>Loading recent emails...</td></tr> : emails.length === 0 ? <tr><td className="px-5 py-4 text-sm text-slate-500" colSpan={5}>No emails yet.</td></tr> : emails.map((email, index) => <motion.tr key={email.id} className="group border-b border-white/[0.05] last:border-0 transition-colors hover:bg-white/[0.025]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 + index * 0.07 }}><td className="px-5 py-4 sm:px-6"><span className="text-sm font-medium text-slate-200">{email.subject}</span></td><td className="px-4 py-4 text-sm text-slate-400">{email.to}</td><td className="px-4 py-4"><span className={`status-pill status-${statusTone[email.status] || "blue"}`}><i />{email.status}</span></td><td className="px-4 py-4 text-xs text-slate-500">{email.scheduledAt ? new Date(email.scheduledAt).toLocaleString() : "Immediately"}</td><td className="px-4 py-4 text-right"><button className="icon-button opacity-0 transition-opacity group-hover:opacity-100" aria-label={`More actions for ${email.subject}`}><MoreHorizontal size={17} /></button></td></motion.tr>)}</tbody></table></div>
  </motion.section>
  );
};

export default RecentEmails;

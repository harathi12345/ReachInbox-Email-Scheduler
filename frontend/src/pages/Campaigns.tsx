import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Ban, Edit3, Eye, Filter, MoreHorizontal, Plus, Search, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cancelEmail, deleteEmail, fetchEmails } from "../lib/api";
import { useToast } from "../components/ToastContext";

type Status = "SENT" | "SCHEDULED" | "PENDING" | "PROCESSING" | "FAILED" | "CANCELLED";
type EmailItem = { id: string; subject: string; to: string; body: string; status: Status; scheduledAt?: string; tone: string };

const statusTone: Record<string, string> = {
	SENT: "green",
	SCHEDULED: "blue",
	PENDING: "amber",
	PROCESSING: "amber",
	FAILED: "red",
	CANCELLED: "purple",
};

const Campaigns = () => {
	const navigate = useNavigate();
	const [query, setQuery] = useState("");
	const [status, setStatus] = useState("All statuses");
	const [emailsList, setEmailsList] = useState<EmailItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [actionId, setActionId] = useState("");
	const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null);
	const { showToast } = useToast();

	useEffect(() => {
		const loadEmails = async () => {
			try {
				const emails = await fetchEmails();
				setEmailsList((emails ?? []).map((email) => ({
					id: email.id,
					subject: email.subject,
					to: email.to,
					body: email.body,
					status: email.status,
					scheduledAt: email.scheduledAt ?? undefined,
					tone: statusTone[email.status] || "blue",
				})));
			} catch {
				setError("Unable to load emails. Check that the backend is running.");
			} finally {
				setLoading(false);
			}
		};

		loadEmails();
	}, []);

	const filteredEmails = useMemo(() => emailsList.filter((item) => item.subject.toLowerCase().includes(query.toLowerCase()) && (status === "All statuses" || item.status === status)), [emailsList, query, status]);

	const handleCancel = async (id: string) => {
		setActionId(id);
		try {
			const updatedEmail = await cancelEmail(id);
			setEmailsList((current) => current.map((item) => item.id === id ? { ...item, status: updatedEmail.status, tone: statusTone[updatedEmail.status] || "purple" } : item));
			showToast("Email delivery cancelled");
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : "Unable to cancel email.");
		} finally {
			setActionId("");
		}
	};

	const handleDelete = async (id: string) => {
		setActionId(id);
		try {
			await deleteEmail(id);
			setEmailsList((current) => current.filter((item) => item.id !== id));
			showToast("Email deleted");
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : "Unable to delete email.");
		} finally {
			setActionId("");
		}
	};

	return <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
		<motion.section className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
			<div><p className="section-label">Workspace</p><h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-white sm:text-[30px]">Emails</h2><p className="mt-2 text-sm text-slate-500">Manage and monitor your scheduled and sent emails.</p></div>
			<button className="primary-button self-start sm:self-auto" onClick={() => navigate("/campaigns/create")}><Plus size={17} strokeWidth={2.5} />Compose New Email</button>
		</motion.section>
		{error && <p className="mb-5 rounded-lg border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-xs text-rose-300">{error}</p>}
		<motion.section className="surface-card overflow-hidden" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
			<div className="flex flex-col gap-3 border-b border-white/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div className="relative max-w-sm flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" /><input className="field-input pl-9" placeholder="Search emails" value={query} onChange={(event) => setQuery(event.target.value)} /></div><div className="flex items-center gap-2"><Filter size={15} className="text-slate-600" /><select className="field-input w-full sm:w-40" value={status} onChange={(event) => setStatus(event.target.value)}><option>All statuses</option><option>SENT</option><option>SCHEDULED</option><option>PENDING</option><option>PROCESSING</option><option>FAILED</option><option>CANCELLED</option></select></div></div>
			<div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead><tr className="border-b border-white/[0.05] text-[10px] uppercase tracking-[0.12em] text-slate-600"><th className="px-5 py-3 font-semibold">Email Subject</th><th className="px-4 py-3 font-semibold">Recipients</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 font-semibold">Scheduled</th><th className="px-4 py-3" /></tr></thead><tbody>{loading ? <tr><td className="px-6 py-12 text-center text-sm text-slate-500" colSpan={5}>Loading emails...</td></tr> : filteredEmails.map((item, index) => <motion.tr key={item.id} className="group border-b border-white/[0.05] last:border-0 transition-colors hover:bg-white/[0.025]" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}><td className="px-5 py-4"><span className="text-sm font-medium text-slate-200">{item.subject}</span></td><td className="px-4 py-4 text-sm text-slate-400">{item.to}</td><td className="px-4 py-4"><span className={`status-pill status-${item.tone}`}><i />{item.status}</span></td><td className="px-4 py-4 text-xs text-slate-500">{item.scheduledAt ? new Date(item.scheduledAt).toLocaleString() : "Not scheduled"}</td><td className="px-4 py-4 text-right"><div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100"><button className="icon-button" aria-label={`View ${item.subject}`} title="View email" onClick={() => setSelectedEmail(item)}><Eye size={15} /></button><button className="icon-button" aria-label={`Edit ${item.subject}`} title="Edit email"><Edit3 size={15} /></button>{item.status === "SCHEDULED" && <button className="icon-button text-amber-300" aria-label={`Cancel ${item.subject}`} title="Cancel email" disabled={actionId === item.id} onClick={() => handleCancel(item.id)}><Ban size={15} /></button>}<button className="icon-button text-rose-400" aria-label={`Delete ${item.subject}`} title="Delete email" disabled={actionId === item.id} onClick={() => handleDelete(item.id)}><Trash2 size={15} /></button></div><button className="icon-button group-hover:hidden" aria-label={`More actions for ${item.subject}`}><MoreHorizontal size={17} /></button></td></motion.tr>)}</tbody></table></div>
			{filteredEmails.length === 0 && <p className="px-6 py-12 text-center text-sm text-slate-500">No emails match your search.</p>}
		</motion.section>
		{selectedEmail && <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/75 p-5" role="dialog" aria-modal="true" aria-label="Email details"><article className="surface-card w-full max-w-lg p-6"><div className="flex items-start justify-between gap-4"><div><p className="section-label">Email details</p><h3 className="mt-2 text-lg font-bold text-white">{selectedEmail.subject}</h3></div><button className="icon-button" aria-label="Close email details" onClick={() => setSelectedEmail(null)}><X size={17} /></button></div><dl className="mt-6 space-y-4 text-sm"><div><dt className="text-xs text-slate-600">Recipient</dt><dd className="mt-1 text-slate-300">{selectedEmail.to}</dd></div><div><dt className="text-xs text-slate-600">Status</dt><dd className="mt-1"><span className={`status-pill status-${selectedEmail.tone}`}><i />{selectedEmail.status}</span></dd></div><div><dt className="text-xs text-slate-600">Message</dt><dd className="mt-1 whitespace-pre-wrap text-slate-300">{selectedEmail.body}</dd></div></dl></article></div>}
	</div>;
};

export default Campaigns;
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Ban, Edit3, Eye, Filter, MoreHorizontal, Plus, Search, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cancelEmail, deleteEmail, fetchEmails } from "../lib/api";
import { useToast } from "../components/ToastContext";

type Status = "SENT" | "SCHEDULED" | "PENDING" | "PROCESSING" | "FAILED" | "CANCELLED";
type Campaign = { id: string; subject: string; to: string; body: string; status: Status; scheduledAt?: string; tone: string };

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
	const [campaigns, setCampaigns] = useState<Campaign[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [actionId, setActionId] = useState("");
	const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
	const { showToast } = useToast();

	useEffect(() => {
		const loadCampaigns = async () => {
			try {
				const emails = await fetchEmails();
				setCampaigns((emails ?? []).map((email) => ({
					id: email.id,
					subject: email.subject,
					to: email.to,
					body: email.body,
					status: email.status,
					scheduledAt: email.scheduledAt ?? undefined,
					tone: statusTone[email.status] || "blue",
				})));
			} catch {
				setError("Unable to load campaigns. Check that the backend is running.");
			} finally {
				setLoading(false);
			}
		};

		loadCampaigns();
	}, []);

	const filteredCampaigns = useMemo(() => campaigns.filter((campaign) => campaign.subject.toLowerCase().includes(query.toLowerCase()) && (status === "All statuses" || campaign.status === status)), [campaigns, query, status]);

	const handleCancel = async (id: string) => {
		setActionId(id);
		try {
			const updatedEmail = await cancelEmail(id);
			setCampaigns((current) => current.map((campaign) => campaign.id === id ? { ...campaign, status: updatedEmail.status, tone: statusTone[updatedEmail.status] || "purple" } : campaign));
			showToast("Campaign cancelled");
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : "Unable to cancel campaign.");
		} finally {
			setActionId("");
		}
	};

	const handleDelete = async (id: string) => {
		setActionId(id);
		try {
			await deleteEmail(id);
			setCampaigns((current) => current.filter((campaign) => campaign.id !== id));
			showToast("Campaign deleted");
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : "Unable to cancel campaign.");
		} finally {
			setActionId("");
		}
	};

	return <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
		<motion.section className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
			<div><p className="section-label">Workspace</p><h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-white sm:text-[30px]">Campaigns</h2><p className="mt-2 text-sm text-slate-500">Manage and monitor your email campaigns.</p></div>
			<button className="primary-button self-start sm:self-auto" onClick={() => navigate("/campaigns/create")}><Plus size={17} strokeWidth={2.5} />New Campaign</button>
		</motion.section>
		{error && <p className="mb-5 rounded-lg border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-xs text-rose-300">{error}</p>}
		<motion.section className="surface-card overflow-hidden" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
			<div className="flex flex-col gap-3 border-b border-white/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div className="relative max-w-sm flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" /><input className="field-input pl-9" placeholder="Search campaigns" value={query} onChange={(event) => setQuery(event.target.value)} /></div><div className="flex items-center gap-2"><Filter size={15} className="text-slate-600" /><select className="field-input w-full sm:w-40" value={status} onChange={(event) => setStatus(event.target.value)}><option>All statuses</option><option>SENT</option><option>SCHEDULED</option><option>PENDING</option><option>PROCESSING</option><option>FAILED</option><option>CANCELLED</option></select></div></div>
			<div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead><tr className="border-b border-white/[0.05] text-[10px] uppercase tracking-[0.12em] text-slate-600"><th className="px-5 py-3 font-semibold">Campaign</th><th className="px-4 py-3 font-semibold">Recipients</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 font-semibold">Scheduled</th><th className="px-4 py-3" /></tr></thead><tbody>{loading ? <tr><td className="px-6 py-12 text-center text-sm text-slate-500" colSpan={5}>Loading campaigns...</td></tr> : filteredCampaigns.map((campaign, index) => <motion.tr key={campaign.id} className="group border-b border-white/[0.05] last:border-0 transition-colors hover:bg-white/[0.025]" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}><td className="px-5 py-4"><span className="text-sm font-medium text-slate-200">{campaign.subject}</span></td><td className="px-4 py-4 text-sm text-slate-400">{campaign.to}</td><td className="px-4 py-4"><span className={`status-pill status-${campaign.tone}`}><i />{campaign.status}</span></td><td className="px-4 py-4 text-xs text-slate-500">{campaign.scheduledAt ? new Date(campaign.scheduledAt).toLocaleString() : "Not scheduled"}</td><td className="px-4 py-4 text-right"><div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100"><button className="icon-button" aria-label={`View ${campaign.subject}`} title="View campaign" onClick={() => setSelectedCampaign(campaign)}><Eye size={15} /></button><button className="icon-button" aria-label={`Edit ${campaign.subject}`} title="Edit campaign"><Edit3 size={15} /></button>{campaign.status === "SCHEDULED" && <button className="icon-button text-amber-300" aria-label={`Cancel ${campaign.subject}`} title="Cancel campaign" disabled={actionId === campaign.id} onClick={() => handleCancel(campaign.id)}><Ban size={15} /></button>}<button className="icon-button text-rose-400" aria-label={`Delete ${campaign.subject}`} title="Delete campaign" disabled={actionId === campaign.id} onClick={() => handleDelete(campaign.id)}><Trash2 size={15} /></button></div><button className="icon-button group-hover:hidden" aria-label={`More actions for ${campaign.subject}`}><MoreHorizontal size={17} /></button></td></motion.tr>)}</tbody></table></div>
			{filteredCampaigns.length === 0 && <p className="px-6 py-12 text-center text-sm text-slate-500">No campaigns match your search.</p>}
		</motion.section>
		{selectedCampaign && <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/75 p-5" role="dialog" aria-modal="true" aria-label="Campaign details"><article className="surface-card w-full max-w-lg p-6"><div className="flex items-start justify-between gap-4"><div><p className="section-label">Campaign details</p><h3 className="mt-2 text-lg font-bold text-white">{selectedCampaign.subject}</h3></div><button className="icon-button" aria-label="Close campaign details" onClick={() => setSelectedCampaign(null)}><X size={17} /></button></div><dl className="mt-6 space-y-4 text-sm"><div><dt className="text-xs text-slate-600">Recipient</dt><dd className="mt-1 text-slate-300">{selectedCampaign.to}</dd></div><div><dt className="text-xs text-slate-600">Status</dt><dd className="mt-1"><span className={`status-pill status-${selectedCampaign.tone}`}><i />{selectedCampaign.status}</span></dd></div><div><dt className="text-xs text-slate-600">Message</dt><dd className="mt-1 whitespace-pre-wrap text-slate-300">{selectedCampaign.body}</dd></div></dl></article></div>}
	</div>;
};

export default Campaigns;
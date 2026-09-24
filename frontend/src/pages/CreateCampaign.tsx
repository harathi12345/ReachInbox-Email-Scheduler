import { useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarDays, Check, Clock3, FileUp, Mail, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ToastContext";
import { createEmail } from "../lib/api";

const CreateCampaign = () => {
	const navigate = useNavigate();
	const { showToast } = useToast();
	const [name, setName] = useState("");
	const [recipientInput, setRecipientInput] = useState("");
	const [subject, setSubject] = useState("");
	const [body, setBody] = useState("");
	const [recipients, setRecipients] = useState(0);
	const [sendMode, setSendMode] = useState("later");
	const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
	const [time, setTime] = useState("09:00");
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;
		const content = await file.text();
		const addresses = content.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
		setRecipientInput(addresses.join(", "));
		setRecipients(addresses.length);
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const emailAddresses = recipientInput.split(",").map((email) => email.trim()).filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
		if (!name.trim() || !subject.trim() || !body.trim() || emailAddresses.length === 0) {
			setError("Add a campaign name, recipients, subject, and email body before continuing.");
			return;
		}
		const requestedDate = sendMode === "now" ? new Date() : new Date(`${date}T${time}`);
		if (Number.isNaN(requestedDate.getTime())) {
			setError("Choose a valid delivery date and time.");
			return;
		}
		if (sendMode === "later" && requestedDate.getTime() < Date.now()) {
			setError("Choose a delivery time in the future.");
			return;
		}
		const scheduledAt = requestedDate.toISOString();
		setError("");
		setIsSubmitting(true);
		try {
			await Promise.all(emailAddresses.map((to) => createEmail({ to, subject, body, scheduledAt })));
			showToast(sendMode === "now" ? "Campaign sent to the delivery queue" : "Campaign scheduled");
			navigate("/campaigns");
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : "Unable to schedule campaign.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return <div className="mx-auto max-w-[1020px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
		<motion.button className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-200" onClick={() => navigate("/campaigns")} initial={{ opacity: 0 }} animate={{ opacity: 1 }}><ArrowLeft size={15} />Back to campaigns</motion.button>
		<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}><p className="section-label">Campaign builder</p><h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-white sm:text-[30px]">Create Campaign</h2><p className="mt-2 text-sm text-slate-500">Set up your message, audience, and delivery preferences.</p></motion.div>
		<form className="mt-8 space-y-5" onSubmit={handleSubmit}>
			<CampaignSection icon={Mail} title="Campaign Details"><label className="field-label" htmlFor="campaign-name">Campaign Name</label><input id="campaign-name" className="field-input mt-2" placeholder="e.g. October product update" value={name} onChange={(event) => setName(event.target.value)} /></CampaignSection>
			<CampaignSection icon={Users} title="Recipients"><div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end"><div><label className="field-label" htmlFor="recipient-list">Add recipients</label><textarea id="recipient-list" className="field-input mt-2 min-h-24 resize-none" placeholder="Paste email addresses, separated by commas" value={recipientInput} onChange={(event) => { setRecipientInput(event.target.value); setRecipients(event.target.value.split(",").map((email) => email.trim()).filter(Boolean).length); }} /></div><label className="upload-control"><FileUp size={16} />Upload CSV<input type="file" accept=".csv" className="sr-only" onChange={handleFile} /></label></div><div className="mt-3 flex items-center gap-2 text-xs text-slate-500"><Check size={14} className="text-emerald-400" />{recipients} recipients ready</div></CampaignSection>
			<CampaignSection icon={Mail} title="Email Content"><label className="field-label" htmlFor="subject">Subject</label><input id="subject" className="field-input mt-2" placeholder="Write a clear subject line" value={subject} onChange={(event) => setSubject(event.target.value)} /><label className="field-label mt-5 block" htmlFor="body">Email body</label><textarea id="body" className="field-input mt-2 min-h-40 resize-y" placeholder="Write your email here... Use {{firstName}} to personalize the message." value={body} onChange={(event) => setBody(event.target.value)} /><p className="mt-2 text-xs text-slate-600">Available variable: <span className="text-blue-400">{"{{firstName}}"}</span></p></CampaignSection>
			<CampaignSection icon={CalendarDays} title="Schedule"><div className="grid gap-4 sm:grid-cols-3"><div><label className="field-label" htmlFor="date">Date</label><input id="date" type="date" className="field-input mt-2" value={date} onChange={(event) => setDate(event.target.value)} /></div><div><label className="field-label" htmlFor="time">Time</label><input id="time" type="time" className="field-input mt-2" value={time} onChange={(event) => setTime(event.target.value)} /></div><div><label className="field-label" htmlFor="timezone">Timezone</label><select id="timezone" className="field-input mt-2"><option>Asia/Kolkata (IST)</option><option>UTC</option><option>America/New_York (ET)</option></select></div></div></CampaignSection>
			<CampaignSection icon={Clock3} title="Sending Options"><div className="grid gap-3 sm:grid-cols-2"><label className={`choice-card ${sendMode === "now" ? "choice-card-active" : ""}`}><input type="radio" name="sendMode" value="now" checked={sendMode === "now"} onChange={() => setSendMode("now")} /><span><strong>Send immediately</strong><small>Start delivery as soon as the campaign is ready.</small></span></label><label className={`choice-card ${sendMode === "later" ? "choice-card-active" : ""}`}><input type="radio" name="sendMode" value="later" checked={sendMode === "later"} onChange={() => setSendMode("later")} /><span><strong>Schedule for later</strong><small>Deliver at the date and time selected above.</small></span></label></div></CampaignSection>
			{error && <p className="rounded-lg border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-xs text-rose-300">{error}</p>}
			<div className="flex flex-col-reverse justify-end gap-3 border-t border-white/[0.07] pt-5 sm:flex-row"><button type="button" className="secondary-button" onClick={() => navigate("/campaigns")}>Save Draft</button><button type="submit" className="primary-button justify-center" disabled={isSubmitting}>{isSubmitting ? "Saving..." : sendMode === "now" ? "Send Campaign" : "Schedule Campaign"}</button></div>
		</form>
	</div>;
};

type CampaignSectionProps = { icon: typeof Mail; title: string; children: ReactNode };
const CampaignSection = ({ icon: Icon, title, children }: CampaignSectionProps) => <motion.section className="surface-card p-5 sm:p-6" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}><div className="mb-5 flex items-center gap-3"><div className="stat-icon stat-icon-blue"><Icon size={17} /></div><h3 className="text-sm font-bold text-white">{title}</h3></div>{children}</motion.section>;

export default CreateCampaign;
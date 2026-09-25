import { useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, FileUp, Mail, Send, Sliders } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ToastContext";
import { createEmail } from "../lib/api";

const formatDefaultStartTime = () => {
	const now = new Date(Date.now() + 60_000); // 1 minute in future
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	const hours = String(now.getHours()).padStart(2, "0");
	const minutes = String(now.getMinutes()).padStart(2, "0");
	return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const CreateCampaign = () => {
	const navigate = useNavigate();
	const { showToast } = useToast();
	const [recipientInput, setRecipientInput] = useState("");
	const [subject, setSubject] = useState("");
	const [body, setBody] = useState("");
	const [startTime, setStartTime] = useState(formatDefaultStartTime);
	const [delaySeconds, setDelaySeconds] = useState(2);
	const [hourlyLimit, setHourlyLimit] = useState(200);
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const parseEmails = (text: string) => {
		const addresses = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
		return Array.from(new Set(addresses.map((a) => a.toLowerCase())));
	};

	const detectedEmails = parseEmails(recipientInput);

	const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;
		const content = await file.text();
		const extracted = parseEmails(content);
		if (extracted.length > 0) {
			const existing = parseEmails(recipientInput);
			const combined = Array.from(new Set([...existing, ...extracted]));
			setRecipientInput(combined.join(", "));
		}
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const emailAddresses = detectedEmails;
		if (emailAddresses.length === 0) {
			setError("Please add at least one valid recipient email address.");
			return;
		}
		if (!subject.trim()) {
			setError("Subject is required.");
			return;
		}
		if (!body.trim()) {
			setError("Email body is required.");
			return;
		}

		const scheduledDate = new Date(startTime);
		if (Number.isNaN(scheduledDate.getTime())) {
			setError("Please select a valid start date and time.");
			return;
		}

		const scheduledAt = scheduledDate.toISOString();
		const delayBetweenEmailsMs = Math.max(0, Number(delaySeconds) * 1000);
		const limitPerHour = Math.max(1, Number(hourlyLimit));

		setError("");
		setIsSubmitting(true);

		try {
			await Promise.all(
				emailAddresses.map((to) =>
					createEmail({
						to,
						subject: subject.trim(),
						body: body.trim(),
						scheduledAt,
						delayBetweenEmails: delayBetweenEmailsMs,
						hourlyLimit: limitPerHour,
					})
				)
			);
			showToast(`${emailAddresses.length} email${emailAddresses.length === 1 ? "" : "s"} scheduled successfully`);
			navigate("/campaigns");
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : "Unable to schedule emails.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="mx-auto max-w-[1020px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
			<motion.button
				className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-200"
				onClick={() => navigate("/campaigns")}
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
			>
				<ArrowLeft size={15} />
				Back to emails
			</motion.button>

			<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
				<p className="section-label">Email composer</p>
				<h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-white sm:text-[30px]">Compose New Email</h2>
				<p className="mt-2 text-sm text-slate-500">Set up your message, recipients, and schedule settings.</p>
			</motion.div>

			<form className="mt-8 space-y-6" onSubmit={handleSubmit}>
				<ComposeSection icon={Mail} title="1. EMAIL CONTENT & RECIPIENTS">
					<div className="space-y-5">
						<div>
							<label className="field-label block">Upload CSV or TXT File</label>
							<div className="mt-2 flex items-center gap-3">
								<label className="upload-control cursor-pointer">
									<FileUp size={16} />
									Click to browse or drag CSV / TXT file
									<input type="file" accept=".csv,.txt" className="sr-only" onChange={handleFile} />
								</label>
							</div>
							<p className="mt-2 text-xs font-medium text-emerald-400">
								{detectedEmails.length} email{detectedEmails.length === 1 ? "" : "s"} detected
							</p>
						</div>

						<div>
							<label className="field-label block" htmlFor="additional-recipients">
								Additional Recipients
							</label>
							<textarea
								id="additional-recipients"
								className="field-input mt-2 min-h-24 resize-none"
								placeholder="Enter email addresses separated by commas or new lines"
								value={recipientInput}
								onChange={(event) => setRecipientInput(event.target.value)}
							/>
						</div>

						<div>
							<label className="field-label block" htmlFor="subject">
								Subject
							</label>
							<input
								id="subject"
								className="field-input mt-2"
								placeholder="Enter email subject"
								value={subject}
								onChange={(event) => setSubject(event.target.value)}
								required
							/>
						</div>

						<div>
							<label className="field-label block" htmlFor="body">
								Email Body
							</label>
							<textarea
								id="body"
								className="field-input mt-2 min-h-40 resize-y"
								placeholder="Write your email message..."
								value={body}
								onChange={(event) => setBody(event.target.value)}
								required
							/>
						</div>
					</div>
				</ComposeSection>

				<ComposeSection icon={Sliders} title="2. SCHEDULE & QUEUE SETTINGS">
					<div className="grid gap-5 sm:grid-cols-3">
						<div>
							<label className="field-label block" htmlFor="start-time">
								Start Time
							</label>
							<input
								id="start-time"
								type="datetime-local"
								className="field-input mt-2"
								value={startTime}
								onChange={(event) => setStartTime(event.target.value)}
								required
							/>
						</div>

						<div>
							<label className="field-label block" htmlFor="send-delay">
								Send Delay (seconds)
							</label>
							<input
								id="send-delay"
								type="number"
								min="0"
								step="1"
								className="field-input mt-2"
								value={delaySeconds}
								onChange={(event) => setDelaySeconds(Number(event.target.value))}
								required
							/>
						</div>

						<div>
							<label className="field-label block" htmlFor="hourly-limit">
								Hourly Limit / Sender
							</label>
							<input
								id="hourly-limit"
								type="number"
								min="1"
								step="1"
								className="field-input mt-2"
								value={hourlyLimit}
								onChange={(event) => setHourlyLimit(Number(event.target.value))}
								required
							/>
						</div>
					</div>
				</ComposeSection>

				{error && (
					<p className="rounded-lg border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-xs text-rose-300">{error}</p>
				)}

				<div className="flex items-center justify-end gap-3 border-t border-white/[0.07] pt-5">
					<button type="button" className="secondary-button" onClick={() => navigate("/campaigns")}>
						Cancel
					</button>
					<button type="submit" className="primary-button justify-center" disabled={isSubmitting}>
						<Send size={15} />
						{isSubmitting
							? "Scheduling..."
							: detectedEmails.length > 0
							? `Schedule ${detectedEmails.length} Email${detectedEmails.length === 1 ? "" : "s"}`
							: "Schedule Emails"}
					</button>
				</div>
			</form>
		</div>
	);
};

type ComposeSectionProps = { icon: typeof Mail; title: string; children: ReactNode };
const ComposeSection = ({ icon: Icon, title, children }: ComposeSectionProps) => (
	<motion.section
		className="surface-card p-5 sm:p-6"
		initial={{ opacity: 0, y: 14 }}
		animate={{ opacity: 1, y: 0 }}
		transition={{ duration: 0.35 }}
	>
		<div className="mb-5 flex items-center gap-3">
			<div className="stat-icon stat-icon-blue">
				<Icon size={17} />
			</div>
			<h3 className="text-sm font-bold text-white">{title}</h3>
		</div>
		{children}
	</motion.section>
);

export default CreateCampaign;
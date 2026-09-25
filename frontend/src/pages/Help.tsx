import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, ChevronDown, LifeBuoy, Mail, Search, MessageCircleQuestion } from "lucide-react";

const faqs = [
	{ question: "How do I compose an email?", answer: "Open Emails from the sidebar, select Compose New Email, then add your recipients, subject, email body, and delivery preferences. Schedule it when you are ready." },
	{ question: "How do I schedule an email?", answer: "Choose your start time, send delay, and hourly limit under Schedule & Queue Settings before scheduling." },
	{ question: "How do I upload recipients?", answer: "In the Compose form, choose Upload CSV or TXT File. Your file should include the email address for each recipient." },
	{ question: "How do I view analytics?", answer: "Select Analytics from the sidebar to review delivery, open, click, and failure trends across the selected reporting period." },
];

const Help = () => {
	const [query, setQuery] = useState("");
	const [openQuestion, setOpenQuestion] = useState<string | null>(null);
	const visibleFaqs = faqs.filter(({ question }) => question.toLowerCase().includes(query.toLowerCase()));

	return <div className="mx-auto max-w-[900px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
		<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}><p className="section-label">Support center</p><h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-white sm:text-[30px]">Help & Support</h2><p className="mt-2 text-sm text-slate-500">Find answers or get help with ReachInbox.</p></motion.div>
		<motion.div className="relative mt-8" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1 }}><Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" /><input className="field-input py-3 pl-11" placeholder="Search Help" value={query} onChange={(event) => setQuery(event.target.value)} /></motion.div>
		<motion.section className="mt-8" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .18 }}><div className="mb-4 flex items-center gap-2"><MessageCircleQuestion size={17} className="text-blue-400" /><h3 className="text-base font-bold text-white">Frequently Asked Questions</h3></div><div className="surface-card divide-y divide-white/[0.07] overflow-hidden">{visibleFaqs.map((faq) => { const isOpen = openQuestion === faq.question; return <div key={faq.question}><button className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition-colors hover:bg-white/[0.025] sm:px-6" onClick={() => setOpenQuestion(isOpen ? null : faq.question)}><span className="text-sm font-semibold text-slate-200">{faq.question}</span><ChevronDown size={17} className={`shrink-0 text-slate-500 transition-transform ${isOpen ? "rotate-180 text-blue-400" : ""}`} /></button><AnimatePresence initial={false}>{isOpen && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><p className="px-5 pb-5 text-sm leading-6 text-slate-500 sm:px-6">{faq.answer}</p></motion.div>}</AnimatePresence></div>; })}{visibleFaqs.length === 0 && <p className="px-6 py-10 text-center text-sm text-slate-500">No help articles match your search.</p>}</div></motion.section>
		<motion.section className="surface-card mt-6 flex flex-col items-start justify-between gap-5 p-5 sm:flex-row sm:items-center sm:p-6" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .25 }}><div className="flex items-center gap-3"><div className="stat-icon stat-icon-purple"><LifeBuoy size={18} /></div><div><h3 className="text-sm font-bold text-white">Still need a hand?</h3><p className="mt-1 text-xs text-slate-500">Support contact is not configured for this workspace.</p></div></div><span className="inline-flex items-center gap-2 text-xs text-slate-600"><Mail size={16} />Contact unavailable<ArrowUpRight size={14} /></span></motion.section>
	</div>;
};

export default Help;
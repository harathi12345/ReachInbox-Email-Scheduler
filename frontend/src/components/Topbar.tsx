import { Bell, Menu, Search, ChevronDown, LogOut, Settings, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchRecentEmails, type EmailRecord } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

type TopbarProps = { onMenuClick: () => void };

const routeLabels: Record<string, { title: string; subtitle: string }> = {
	"/": { title: "Dashboard", subtitle: "Overview of your email campaigns" },
	"/campaigns": { title: "Campaigns", subtitle: "Manage and monitor your email campaigns." },
	"/campaigns/create": { title: "Create Campaign", subtitle: "Build and schedule a new email campaign." },
	"/schedule": { title: "Schedule", subtitle: "Manage your upcoming email deliveries." },
	"/analytics": { title: "Analytics", subtitle: "Track the performance of your email campaigns." },
	"/settings": { title: "Settings", subtitle: "Manage your ReachInbox workspace preferences." },
	"/help": { title: "Help & Support", subtitle: "Find answers and get help with ReachInbox." },
};

const Topbar = ({ onMenuClick }: TopbarProps) => {
	const { pathname } = useLocation();
	const navigate = useNavigate();
	const { user, logout } = useAuth();
	const [notifications, setNotifications] = useState<EmailRecord[]>([]);
	const [notificationOpen, setNotificationOpen] = useState(false);
	const [profileOpen, setProfileOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const notificationRef = useRef<HTMLDivElement>(null);
	const labels = routeLabels[pathname] ?? routeLabels["/"];
	const lastRead = Number(localStorage.getItem("reachinbox_notifications_read") || 0);
	const unread = notifications.some((item) => new Date(item.updatedAt || item.createdAt).getTime() > lastRead);

	useEffect(() => { fetchRecentEmails().then((items) => setNotifications(items.filter((item) => ["SENT", "FAILED", "CANCELLED"].includes(item.status)))).catch(() => setNotifications([])); }, []);
	useEffect(() => { const close = (event: MouseEvent) => { const target = event.target as Node; if (dropdownRef.current && !dropdownRef.current.contains(target)) setProfileOpen(false); if (notificationRef.current && !notificationRef.current.contains(target)) setNotificationOpen(false); }; document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close); }, []);
	const initials = user?.name?.slice(0, 1).toUpperCase() || "U";

	return (
	<header className="flex h-[88px] items-center justify-between border-b border-white/[0.07] px-5 sm:px-8 lg:px-10">
		<div className="flex items-center gap-3">
			<button className="icon-button lg:hidden" onClick={onMenuClick} aria-label="Open navigation"><Menu size={20} /></button>
			<div>
				<h1 className="text-lg font-bold tracking-[-0.02em] text-white sm:text-xl">{labels.title}</h1>
				<p className="mt-0.5 hidden text-xs text-slate-500 sm:block">{labels.subtitle}</p>
			</div>
		</div>
		<div className="flex items-center gap-3 sm:gap-5">
			<button className="icon-button hidden sm:flex" aria-label="Search campaigns" title="Search campaigns" onClick={() => navigate("/campaigns")}><Search size={18} /></button>
			<div className="relative" ref={notificationRef}><button className="icon-button relative" aria-label="Notifications" title="Notifications" aria-expanded={notificationOpen} onClick={() => { setNotificationOpen(!notificationOpen); setProfileOpen(false); }}><Bell size={18} />{unread && <span className="notification-dot absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-blue-400" />}</button>{notificationOpen && <div className="dropdown-panel right-0 top-11 w-80"><div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3"><strong className="text-xs text-white">Notifications</strong>{unread && <button className="text-[10px] text-blue-300" onClick={() => { localStorage.setItem("reachinbox_notifications_read", String(Date.now())); setNotificationOpen(false); }}>Mark as read</button>}</div>{notifications.length === 0 ? <p className="px-4 py-8 text-center text-xs text-slate-500">No new notifications</p> : <div className="max-h-72 overflow-auto">{notifications.map((item) => <div key={item.id} className="border-b border-white/[0.05] px-4 py-3"><p className="text-xs font-semibold text-slate-200">Campaign {item.status.toLowerCase()}</p><p className="mt-1 truncate text-[11px] text-slate-500">{item.subject}</p></div>)}</div>}</div>}</div>
			<div className="hidden h-7 w-px bg-white/[0.08] sm:block" />
			<div className="relative" ref={dropdownRef}><button className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-white/[0.05]" aria-expanded={profileOpen} onClick={() => { setProfileOpen(!profileOpen); setNotificationOpen(false); }}><span className="avatar avatar-purple">{initials}</span><span className="hidden text-left sm:block"><span className="block max-w-28 truncate text-xs font-semibold text-slate-200">{user?.name}</span><span className="block text-[10px] text-slate-500">{user?.role || "User"}</span></span>
				<ChevronDown size={14} className="hidden text-slate-500 sm:block" />
			</button>{profileOpen && <div className="dropdown-panel right-0 top-11 w-48"><button className="dropdown-item" onClick={() => { setProfileOpen(false); navigate("/settings"); }}><UserRound size={14} />Profile</button><button className="dropdown-item" onClick={() => { setProfileOpen(false); navigate("/settings"); }}><Settings size={14} />Settings</button><button className="dropdown-item text-rose-300" onClick={() => { void logout().then(() => navigate("/login", { replace: true })); }}><LogOut size={14} />Sign out</button></div>}</div>
		</div>
	</header>
  );
};

export default Topbar;

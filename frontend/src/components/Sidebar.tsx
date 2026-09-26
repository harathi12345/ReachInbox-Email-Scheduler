import {
  LayoutDashboard,
  Mail,
  CalendarClock,
  BarChart3,
  Layers,
  MessageSquare,
  Settings,
  HelpCircle,
  X,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const mainNavigation = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/" },
  { label: "Emails", icon: Mail, to: "/campaigns" },
  { label: "Schedule", icon: CalendarClock, to: "/schedule" },
  { label: "Analytics", icon: BarChart3, to: "/analytics" },
  { label: "BullMQ", icon: Layers, to: "/bullmq" },
  { label: "Slack", icon: MessageSquare, to: "/slack" },
];

const supportNavigation = [
  { label: "Settings", icon: Settings, to: "/settings" },
  { label: "Help & Support", icon: HelpCircle, to: "/help" },
];

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { user } = useAuth();
  const initials = user?.name?.slice(0, 1).toUpperCase() || "U";
  return (
    <aside className={`sidebar fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/[0.07] bg-[#0a0f1e]/95 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex h-[88px] items-center justify-between border-b border-white/[0.07] px-6">
        <div className="flex items-center gap-3">
          <div className="brand-mark flex h-9 w-9 items-center justify-center rounded-xl">
            <Sparkles size={18} strokeWidth={2.5} />
          </div>
          <span className="text-[17px] font-bold tracking-[-0.03em] text-white">ReachInbox</span>
        </div>
        <button className="icon-button lg:hidden" onClick={onClose} aria-label="Close navigation"><X size={18} /></button>
      </div>

      <nav className="flex-1 px-4 py-7">
        <p className="eyebrow px-3">Workspace</p>
        <div className="mt-3 space-y-1">
          {mainNavigation.map(({ label, icon: Icon, to }) => (
            <NavLink key={label} to={to} end={to === "/"} className={({ isActive }) => `nav-item ${isActive ? "nav-item-active" : ""}`} onClick={onClose}>
              {({ isActive }) => <><Icon size={18} strokeWidth={isActive ? 2.3 : 1.8} /><span>{label}</span>{isActive && <motion.span layoutId="active-nav" className="nav-active-line" />}</>}
            </NavLink>
          ))}
        </div>

        <p className="eyebrow mt-9 px-3">Preferences</p>
        <div className="mt-3 space-y-1">
          {supportNavigation.map(({ label, icon: Icon, to }) => (
            <NavLink key={label} to={to} className={({ isActive }) => `nav-item ${isActive ? "nav-item-active" : ""}`} onClick={onClose}>
              {({ isActive }) => <><Icon size={18} strokeWidth={isActive ? 2.3 : 1.8} /><span>{label}</span>{isActive && <motion.span layoutId="active-nav" className="nav-active-line" />}</>}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="border-t border-white/[0.07] p-4">
        <div className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-white/[0.05]">
          <div className="avatar avatar-purple">{initials}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-100">{user?.name}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
          <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
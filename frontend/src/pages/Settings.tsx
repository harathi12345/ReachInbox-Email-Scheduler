import { useState } from "react";
import { Bell, Check, Palette, Save, UserRound } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "../components/ToastContext";
import { useAuth } from "../contexts/AuthContext";
import { useTheme, type Theme } from "../contexts/ThemeContext";

const Settings = () => {
  const { user, saveProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const [name, setName] = useState(() => user?.name || "");
  const [email, setEmail] = useState(() => user?.email || "");
  const [emailNotifications, setEmailNotifications] = useState(() => localStorage.getItem("reachinbox_email_notifications") !== "false");
  const [campaignNotifications, setCampaignNotifications] = useState(() => localStorage.getItem("reachinbox_campaign_notifications") !== "false");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const saveSettings = async () => { setError(""); setSaving(true); try { await saveProfile(name, email); localStorage.setItem("reachinbox_email_notifications", String(emailNotifications)); localStorage.setItem("reachinbox_campaign_notifications", String(campaignNotifications)); setSaved(true); showToast("Settings saved"); window.setTimeout(() => setSaved(false), 2500); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to save settings."); } finally { setSaving(false); } };

  return <div className="mx-auto max-w-[1080px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10"><motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}><p className="section-label">Workspace preferences</p><h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-white sm:text-[30px]">Settings</h2><p className="mt-2 text-sm text-slate-500">Manage your profile, appearance, and notifications.</p></motion.div><div className="mt-8 space-y-5"><SettingsSection icon={UserRound} title="Profile" description="Your authenticated ReachInbox account."><div className="grid gap-4 sm:grid-cols-2"><label className="field-label">Name<input className="field-input mt-2" value={name} onChange={(event) => setName(event.target.value)} /></label><label className="field-label">Email<input className="field-input mt-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label></div><p className="mt-4 text-xs text-slate-600">Role: {user?.role || "User"}</p></SettingsSection><SettingsSection icon={Palette} title="Appearance" description="Choose how ReachInbox should look on this device."><div className="setting-row"><div><strong>Theme</strong><small>Dark, light, or follow your operating system</small></div><select className="field-input max-w-[145px]" value={theme} onChange={(event) => setTheme(event.target.value as Theme)}><option value="dark">Dark</option><option value="light">Light</option><option value="system">System</option></select></div></SettingsSection><SettingsSection icon={Bell} title="Notifications" description="Choose which local workspace updates are enabled."><div className="grid gap-3 sm:grid-cols-2"><Toggle label="Email notifications" description="Account and workspace updates" checked={emailNotifications} onChange={() => setEmailNotifications(!emailNotifications)} /><Toggle label="Campaign notifications" description="Sent, failed, and cancelled campaign updates" checked={campaignNotifications} onChange={() => setCampaignNotifications(!campaignNotifications)} /></div></SettingsSection></div>{error && <p className="mt-5 rounded-lg border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-xs text-rose-300">{error}</p>}<div className="mt-6 flex flex-col items-stretch justify-end gap-3 border-t border-white/[0.07] pt-5 sm:flex-row sm:items-center"><button className="primary-button justify-center" onClick={() => void saveSettings()} disabled={saving}><Save size={16} />{saving ? "Saving..." : "Save Changes"}</button>{saved && <p className="flex items-center justify-center gap-2 text-xs font-medium text-emerald-300"><Check size={14} />Settings updated</p>}</div></div>;
};

type SectionProps = { icon: typeof UserRound; title: string; description: string; children: React.ReactNode };
const SettingsSection = ({ icon: Icon, title, description, children }: SectionProps) => <motion.section className="surface-card p-5 sm:p-6" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}><div className="mb-5 flex items-start gap-3"><div className="stat-icon stat-icon-blue"><Icon size={17} /></div><div><h3 className="text-sm font-bold text-white">{title}</h3><p className="mt-1 text-xs text-slate-600">{description}</p></div></div>{children}</motion.section>;
const Toggle = ({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: () => void }) => <label className="setting-row cursor-pointer"><div><strong>{label}</strong><small>{description}</small></div><input className="toggle-input" type="checkbox" checked={checked} onChange={onChange} /></label>;

export default Settings;

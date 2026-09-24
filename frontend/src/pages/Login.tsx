import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  if (user) return <Navigate to="/" replace />;
  const submit = async (event: FormEvent) => { event.preventDefault(); setError(""); setLoading(true); try { await login(email, password); navigate("/", { replace: true }); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to sign in."); } finally { setLoading(false); } };
  return <AuthShell><form className="auth-card" onSubmit={submit}><div className="auth-brand"><span className="brand-mark flex h-10 w-10 items-center justify-center rounded-xl"><Sparkles size={19} /></span><span>ReachInbox</span></div><p className="section-label mt-10">Welcome back</p><h1 className="mt-2 text-2xl font-bold text-white">Sign in to your workspace</h1><p className="mt-2 text-sm text-slate-500">Manage your campaigns and delivery pipeline.</p><label className="field-label mt-7 block">Email<input className="field-input mt-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label><label className="field-label mt-4 block">Password<div className="relative mt-2"><input className="field-input pr-12" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /><button type="button" className="absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-slate-200" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>{error && <p className="auth-error">{error}</p>}<button className="primary-button mt-6 w-full justify-center" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button><p className="mt-6 text-center text-sm text-slate-500">New to ReachInbox? <Link className="font-semibold text-blue-400 hover:text-blue-300" to="/signup">Create an account</Link></p></form></AuthShell>;
};

const AuthShell = ({ children }: { children: React.ReactNode }) => <main className="auth-shell"><div className="background-orb orb-blue" /><div className="background-orb orb-purple" />{children}</main>;
export default Login;
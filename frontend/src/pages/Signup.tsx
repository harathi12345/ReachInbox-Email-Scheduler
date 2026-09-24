import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Signup = () => {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/", { replace: true });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create account.");
    } finally {
      setLoading(false);
    }
  };

  return <main className="auth-shell">
    <div className="background-orb orb-blue" />
    <div className="background-orb orb-purple" />
    <form className="auth-card" onSubmit={submit}>
      <div className="auth-brand"><span className="brand-mark flex h-10 w-10 items-center justify-center rounded-xl"><Sparkles size={19} /></span><span>ReachInbox</span></div>
      <p className="section-label mt-10">Get started</p>
      <h1 className="mt-2 text-2xl font-bold text-white">Create your workspace</h1>
      <p className="mt-2 text-sm text-slate-500">Your campaigns, queue, and delivery insights in one place.</p>
      <label className="field-label mt-7 block">Name<input className="field-input mt-2" value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" /></label>
      <label className="field-label mt-4 block">Email<input className="field-input mt-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>
      <label className="field-label mt-4 block">Password
        <div className="relative mt-2">
          <input className="field-input pr-12" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required autoComplete="new-password" />
          <button type="button" className="absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-slate-200" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
        </div>
      </label>
      <label className="field-label mt-4 block">Confirm password
        <div className="relative mt-2">
          <input className="field-input pr-12" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} required autoComplete="new-password" />
          <button type="button" className="absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-slate-200" aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
        </div>
      </label>
      {error && <p className="auth-error">{error}</p>}
      <button className="primary-button mt-6 w-full justify-center" disabled={loading}>{loading ? "Creating account..." : "Create account"}</button>
      <p className="mt-6 text-center text-sm text-slate-500">Already have an account? <Link className="font-semibold text-blue-400 hover:text-blue-300" to="/login">Sign in</Link></p>
    </form>
  </main>;
};

export default Signup;

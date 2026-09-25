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

  const DEFAULT_BACKEND_URL = import.meta.env.DEV
    ? "http://localhost:5000"
    : "https://reachinbox-backend-ncnd.onrender.com";
  const rawBaseUrl = import.meta.env.VITE_API_URL || DEFAULT_BACKEND_URL;
  const baseUrl = rawBaseUrl.replace(/\/$/, "").replace(/\/api$/, "");
  const GOOGLE_AUTH_URL = `${baseUrl}/auth/google`;

  return (
    <main className="auth-shell">
      <div className="background-orb orb-blue" />
      <div className="background-orb orb-purple" />
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-brand">
          <span className="brand-mark flex h-10 w-10 items-center justify-center rounded-xl">
            <Sparkles size={19} />
          </span>
          <span>ReachInbox</span>
        </div>
        <p className="section-label mt-10">Get started</p>
        <h1 className="mt-2 text-2xl font-bold text-white">Create your workspace</h1>
        <p className="mt-2 text-sm text-slate-500">Your scheduled emails, queue, and delivery insights in one place.</p>
        
        <label className="field-label mt-7 block">
          Name
          <input
            className="field-input mt-2"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            autoComplete="name"
          />
        </label>
        
        <label className="field-label mt-4 block">
          Email
          <input
            className="field-input mt-2"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
          />
        </label>
        
        <label className="field-label mt-4 block">
          Password
          <div className="relative mt-2">
            <input
              className="field-input pr-12"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-slate-200"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>
        
        <label className="field-label mt-4 block">
          Confirm password
          <div className="relative mt-2">
            <input
              className="field-input pr-12"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={8}
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-slate-200"
              aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>

        {error && <p className="auth-error mt-4">{error}</p>}

        <button className="primary-button mt-6 w-full justify-center" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>

        <div className="mt-5 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">or</span>
        </div>

        <button
          type="button"
          onClick={() => { window.location.href = GOOGLE_AUTH_URL; }}
          className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link className="font-semibold text-blue-400 hover:text-blue-300" to="/login">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
};

export default Signup;

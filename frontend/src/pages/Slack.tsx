import { useEffect, useState } from "react";
import { CheckCircle2, MessageSquare, Power, AlertCircle, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { useToast } from "../components/ToastContext";
import { disconnectSlackApi, fetchSlackStatus } from "../lib/api";

const getBackendUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || "";
  if (envUrl) {
    return envUrl.replace(/\/$/, "").replace(/\/api$/, "");
  }
  return import.meta.env.DEV
    ? "http://localhost:5000"
    : "https://reachinbox-backend-ncnd.onrender.com";
};

const Slack = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const checkStatus = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchSlackStatus();
      setConnected(res.connected);
    } catch (err: any) {
      setError(err?.message || "Failed to check Slack connection status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();

    if (searchParams.get("slack") === "connected") {
      showToast("Slack account connected successfully!");
      setConnected(true);
      searchParams.delete("slack");
      setSearchParams(searchParams);
    } else if (searchParams.get("error")) {
      setError(decodeURIComponent(searchParams.get("error") || "Slack OAuth failed"));
      searchParams.delete("error");
      setSearchParams(searchParams);
    }
  }, []);

  const handleConnectSlack = () => {
    const token = localStorage.getItem("reachinbox_token") || "";
    const backendUrl = getBackendUrl();
    window.location.href = `${backendUrl}/auth/slack?token=${encodeURIComponent(token)}`;
  };

  const handleDisconnectSlack = async () => {
    setActionLoading(true);
    setError("");
    try {
      await disconnectSlackApi();
      setConnected(false);
      showToast("Slack disconnected successfully");
    } catch (err: any) {
      setError(err?.message || "Failed to disconnect Slack.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="section-label">Integrations</p>
        <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-white sm:text-[30px]">
          Slack Integration
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Connect Slack to receive instant notifications when an hourly email rate limit is reached.
        </p>
      </motion.div>

      {error && (
        <motion.div
          className="mt-6 flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-medium text-rose-300"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle size={18} className="shrink-0 text-rose-400" />
          <span>{error}</span>
        </motion.div>
      )}

      <motion.div
        className="mt-8 surface-card p-6 sm:p-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <MessageSquare size={24} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-white">Slack Workspace Alert Notifications</h3>
                {connected ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 size={13} />
                    Slack Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-400 border border-white/[0.07]">
                    Disconnected
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-400 max-w-xl">
                When ReachInbox detects that your scheduled email volume has reached the configured hourly rate limit, an automated non-blocking notification will be sent directly to your connected Slack account.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:self-center shrink-0">
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <RefreshCw size={14} className="animate-spin" />
                Checking status...
              </div>
            ) : connected ? (
              <button
                type="button"
                onClick={handleDisconnectSlack}
                disabled={actionLoading}
                className="secondary-button hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300"
              >
                <Power size={15} />
                {actionLoading ? "Disconnecting..." : "Disconnect Slack"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnectSlack}
                className="primary-button justify-center bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <MessageSquare size={15} />
                Connect Slack
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 border-t border-white/[0.07] pt-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Notification Triggers
          </h4>
          <ul className="mt-3 space-y-2 text-xs text-slate-400">
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span>Fires automatically when a sender exceeds the configured hourly rate limit</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              <span>Deduplicated in Redis (max 1 notification per sender per hour)</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Emails are safely rescheduled for the next window without dropping</span>
            </li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
};

export default Slack;

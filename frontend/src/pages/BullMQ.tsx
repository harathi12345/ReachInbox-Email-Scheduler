import { ExternalLink, Layers, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const getBackendUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || "";
  if (envUrl) {
    return envUrl.replace(/\/$/, "").replace(/\/api$/, "");
  }
  return import.meta.env.DEV
    ? "http://localhost:5000"
    : "https://reachinbox-backend-ncnd.onrender.com";
};

const BullMQ = () => {
  const backendUrl = getBackendUrl();
  const queueUrl = `${backendUrl}/admin/queues`;
  const [iframeKey, setIframeKey] = useState(0);

  const handleRefresh = () => {
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="section-label">Queue Monitor</p>
          <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-white sm:text-[30px]">
            BullMQ Live Queue Dashboard
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Real-time visibility into email scheduling queues, delayed jobs, active workers, completed sends, and rate-limited tasks.
          </p>
        </motion.div>

        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <button
            type="button"
            onClick={handleRefresh}
            className="secondary-button"
            title="Refresh queue monitor"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
          <a
            href={queueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="primary-button justify-center"
          >
            <ExternalLink size={15} />
            Open Full Dashboard
          </a>
        </motion.div>
      </div>

      <motion.div
        className="mt-8 surface-card overflow-hidden p-1 sm:p-2"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="stat-icon stat-icon-blue">
              <Layers size={16} />
            </div>
            <span className="text-xs font-semibold text-slate-300">Live BullMQ Adapter</span>
          </div>
          <span className="text-xs text-slate-500">{queueUrl}</span>
        </div>

        <div className="relative min-h-[680px] w-full overflow-hidden rounded-b-xl bg-slate-950">
          <iframe
            key={iframeKey}
            src={queueUrl}
            title="BullMQ Queue Dashboard"
            className="h-[680px] w-full border-0"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />
        </div>
      </motion.div>
    </div>
  );
};

export default BullMQ;

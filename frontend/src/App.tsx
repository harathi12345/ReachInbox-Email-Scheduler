import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Sparkles } from "lucide-react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import Campaigns from "./pages/Campaigns";
import CreateCampaign from "./pages/CreateCampaign";
import Schedule from "./pages/Schedule";
import Analytics from "./pages/Analytics";
import BullMQ from "./pages/BullMQ";
import Slack from "./pages/Slack";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { ToastProvider } from "./components/Toast";
import { pageVariants } from "./components/motion";
import { useAuth } from "./contexts/AuthContext";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-950 text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 animate-pulse">
          <Sparkles size={24} />
        </div>
        <p className="text-sm font-medium text-slate-400">Loading ReachInbox...</p>
      </div>
    </div>
  );
}

function App() {
  const { user, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <ToastProvider>
        <Routes location={location}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="app-shell min-h-screen overflow-hidden">
        <div className="background-orb orb-blue" />
        <div className="background-orb orb-purple" />
        <div className="background-orb orb-cyan" />

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.button
              aria-label="Close menu"
              className="fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />
          )}
        </AnimatePresence>

        <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

        <main className="relative z-10 min-h-screen lg:ml-64">
          <Topbar onMenuClick={() => setMobileMenuOpen(true)} />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={location.pathname} variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <Routes location={location}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/campaigns" element={<Campaigns />} />
                <Route path="/campaigns/create" element={<CreateCampaign />} />
                <Route path="/schedule" element={<Schedule />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/bullmq" element={<BullMQ />} />
                <Route path="/slack" element={<Slack />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/help" element={<Help />} />
                <Route path="/login" element={<Navigate to="/" replace />} />
                <Route path="/signup" element={<Navigate to="/" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </ToastProvider>
  );
}

export default App;
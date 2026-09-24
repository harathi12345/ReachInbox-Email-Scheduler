import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Route, Routes, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import Campaigns from "./pages/Campaigns";
import CreateCampaign from "./pages/CreateCampaign";
import Schedule from "./pages/Schedule";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import { ToastProvider } from "./components/Toast";
import { pageVariants } from "./components/motion";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { useAuth } from "./contexts/AuthContext";

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, loading } = useAuth();

  if (loading) return <div className="auth-shell"><p className="text-sm text-slate-500">Loading your workspace...</p></div>;
  if (!user) return <Routes><Route path="/signup" element={<Signup />} /><Route path="*" element={<Login />} /></Routes>;

  return <ToastProvider>
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
          <Route path="/settings" element={<Settings />} />
          <Route path="/help" element={<Help />} />
        </Routes>
        </motion.div>
        </AnimatePresence>
      </main>
    </div>
  </ToastProvider>;
}

export default App;
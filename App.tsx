
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Settings, GraduationCap, Play, Menu, Flame, User, LogOut, UserPlus, 
  ChevronRight, FolderOpen, CalendarRange, Home, Clock
} from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./lib/firebase";
import { useStudyStore } from "./hooks/useStudyStore";
import MonthGrid from "./components/study/MonthGrid";
import SubjectList from "./components/study/SubjectList";
import SettingsPage from "./components/study/SettingsPage";
import StartStudyTab from "./components/study/StartStudyTab";
import ScheduleTab from "./components/study/ScheduleTab";
import TodayTab from "./components/study/TodayTab";
import LoginPage from "./components/auth/LoginPage";
import { Button } from "./components/ui/button";
import { cn } from "./lib/utils";
import { User as UserType } from "./types";

type Tab = "today" | "provas" | "planning" | "schedule" | "study" | "settings";

interface SidebarProps {
  tab: Tab;
  setTab: (tab: Tab) => void;
  setIsMobileMenuOpen: (open: boolean) => void;
  user: UserType | null;
  onSettingsClick: () => void;
  onLogout: () => void;
  onGuestLogin: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ tab, setTab, setIsMobileMenuOpen, user, onSettingsClick, onLogout, onGuestLogin }) => {
  return (
    <div className="flex flex-col h-[100dvh] bg-white border-r border-zinc-100 w-72 safe-area-left">
      <div className="p-8 pb-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-zinc-900 flex items-center justify-center shadow-2xl shadow-zinc-900/30">
             <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-black text-2xl text-zinc-900 tracking-tighter">QIsaque</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-1">
        <button onClick={() => { setTab("today"); setIsMobileMenuOpen(false); }} className={cn("w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all text-sm font-bold", tab === "today" ? "bg-zinc-100 text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50")}>
          <Home className="w-5 h-5" /> Início
        </button>
        <button onClick={() => { setTab("provas"); setIsMobileMenuOpen(false); }} className={cn("w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all text-sm font-bold", tab === "provas" ? "bg-zinc-100 text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50")}>
          <FolderOpen className="w-5 h-5" /> Assuntos
        </button>
        <button onClick={() => { setTab("schedule"); setIsMobileMenuOpen(false); }} className={cn("w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all text-sm font-bold", tab === "schedule" ? "bg-zinc-100 text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50")}>
          <CalendarRange className="w-5 h-5" /> Cronograma
        </button>
        <button onClick={() => { setTab("study"); setIsMobileMenuOpen(false); }} className={cn("w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all text-sm font-bold", tab === "study" ? "bg-zinc-100 text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50")}>
          <Clock className="w-5 h-5" /> Timer
        </button>
      </div>

      <div className="p-6 mt-auto shrink-0 space-y-2 border-t border-zinc-50 bg-zinc-50/50">
        <button onClick={onSettingsClick} className={cn("w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all text-sm font-bold", tab === "settings" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-400 hover:text-zinc-900")}>
          <Settings className="w-5 h-5" /> Ajustes
        </button>
        {user ? (
          <button onClick={onLogout} className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all text-sm font-bold text-red-400 hover:text-red-600 hover:bg-red-50">
            <LogOut className="w-5 h-5" /> Sair
          </button>
        ) : (
          <button onClick={onGuestLogin} className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all text-sm font-bold text-zinc-900 bg-white border border-zinc-200 shadow-sm">
            <UserPlus className="w-5 h-5" /> Entrar
          </button>
        )}
      </div>
    </div>
  );
};

const App = () => {
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [tab, setTab] = useState<Tab>("today");
  const [selectedMonthId, setSelectedMonthId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { months, settings, getSubjectsByMonthId, updateSettings, getStreakStats, user, setUser, loadFromCloud, setActiveSubjectId, guestMode, setGuestMode } = useStudyStore();

  useEffect(() => {
    if (!auth) { setIsAuthLoading(false); return; }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({ uid: currentUser.uid, email: currentUser.email, displayName: currentUser.displayName, photoURL: currentUser.photoURL });
        loadFromCloud(currentUser.uid);
        setGuestMode(false);
      } else { setUser(null); }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, [setUser, loadFromCloud, setGuestMode]);

  const handleSelectExamForPlanning = (monthId: string) => { setSelectedMonthId(monthId); setTab("planning"); };
  const handleSettingsClick = () => { setTab("settings"); setIsMobileMenuOpen(false); };
  const handleLogout = async () => { if (auth && user) { await signOut(auth); } setGuestMode(false); setTab("today"); };
  const handleGuestLoginClick = () => { setShowLogin(true); };
  const handleStartStudy = (subjectId: string) => { setActiveSubjectId(subjectId); setTab("study"); };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-zinc-100 border-t-zinc-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (showLogin && !user && !guestMode) { return <LoginPage onLoginSuccess={() => setShowLogin(false)} />; }

  return (
    <div className="min-h-screen bg-white font-sans flex overflow-hidden selection:bg-zinc-900 selection:text-white">
      <div className="hidden lg:block h-screen sticky top-0 z-40">
        <Sidebar tab={tab} setTab={setTab} setIsMobileMenuOpen={setIsMobileMenuOpen} user={user} onSettingsClick={handleSettingsClick} onLogout={handleLogout} onGuestLogin={handleGuestLoginClick} />
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black z-40 lg:hidden backdrop-blur-sm" />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} className="fixed inset-y-0 left-0 z-50 bg-white w-72 lg:hidden shadow-2xl safe-area-left h-[100dvh]">
              <Sidebar tab={tab} setTab={setTab} setIsMobileMenuOpen={setIsMobileMenuOpen} user={user} onSettingsClick={handleSettingsClick} onLogout={handleLogout} onGuestLogin={handleGuestLoginClick} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-y-auto safe-area-bottom bg-zinc-50/20">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-zinc-100 px-6 py-6 lg:px-12 lg:py-8 transition-all">
           <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
             <div className="lg:hidden mr-4">
               <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
                 <Menu className="w-7 h-7 text-zinc-900" />
               </Button>
             </div>
             <div className="hidden md:flex items-center gap-3 text-zinc-400 text-sm font-bold uppercase tracking-widest">
                <span className="text-zinc-900">{tab === "today" ? "Dashboard" : tab === "provas" ? "Assuntos" : tab === "schedule" ? "Cronograma" : tab === "study" ? "Timer" : "Ajustes"}</span>
             </div>
             <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-2 rounded-full text-xs font-black border border-orange-100 uppercase tracking-tighter">
                   <Flame className="w-4 h-4 fill-current" /> {getStreakStats().currentStreak} dias de sequência
                </div>
             </div>
           </div>
        </header>

        <main className="flex-1 px-6 py-10 lg:px-12 lg:py-12 max-w-7xl mx-auto w-full">
           <AnimatePresence mode="wait">
             <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
               {tab === "today" && <TodayTab onStartStudy={handleStartStudy} />}
               {tab === "provas" && <MonthGrid months={months} onSelectMonth={handleSelectExamForPlanning} />}
               {tab === "planning" && selectedMonthId && <SubjectList monthId={selectedMonthId} subjects={getSubjectsByMonthId(selectedMonthId)} onBack={() => setTab("provas")} />}
               {tab === "schedule" && <ScheduleTab />}
               {tab === "study" && <StartStudyTab />}
               {tab === "settings" && <SettingsPage settings={settings} onUpdateSettings={updateSettings} onBack={() => setTab("today")} />}
             </motion.div>
           </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default App;

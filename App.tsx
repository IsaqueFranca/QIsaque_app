
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Settings, GraduationCap, Play, BarChart3, Menu, Flame, User, LogOut, UserPlus, 
  ChevronRight, FolderOpen, LayoutDashboard, FileText, CalendarRange
} from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./lib/firebase";
import { useStudyStore } from "./hooks/useStudyStore";
import MonthGrid from "./components/study/MonthGrid";
import SubjectList from "./components/study/SubjectList";
import SettingsPage from "./components/study/SettingsPage";
import StartStudyTab from "./components/study/StartStudyTab";
import StatisticsTab from "./components/study/StatisticsTab";
import ScheduleTab from "./components/study/ScheduleTab"; // Import ScheduleTab
import LoginPage from "./components/auth/LoginPage";
import { Button } from "./components/ui/button";
import { cn } from "./lib/utils";

type Tab = "provas" | "planning" | "schedule" | "study" | "statistics" | "settings";

const App = () => {
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("provas");
  const [selectedMonthId, setSelectedMonthId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const {
    months,
    subjects,
    settings,
    getSubjectsByMonthId,
    updateSettings,
    getSessionsByMonthId,
    getStreakStats,
    user,
    setUser,
    isGuest,
    setGuestMode,
    loadFromCloud,
  } = useStudyStore();

  const streakStats = getStreakStats();

  // Authentication & Sync Logic
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL
        });
        // Load data in background without blocking UI
        loadFromCloud(currentUser.uid);
      } else {
        setUser(null);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSelectExamForPlanning = (monthId: string) => {
    setSelectedMonthId(monthId);
    setTab("planning");
    if (window.innerWidth < 768) {
      setIsMobileMenuOpen(false);
    }
  };

  const handleSettingsClick = () => {
    setTab(tab === "settings" ? "provas" : "settings");
    if (window.innerWidth < 768) {
      setIsMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    if (user) {
      await signOut(auth);
    } else {
      setGuestMode(false);
    }
  };

  const handleGuestLoginClick = () => {
      setGuestMode(false); 
  };

  // 1. Loading Screen (Minimal / Instant)
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  // 2. Mandatory Login Screen (Unless Guest)
  if (!user && !isGuest) {
    return <LoginPage onLoginSuccess={() => {}} />;
  }

  // 3. Sidebar Component
  const Sidebar = () => (
    <div className="flex flex-col h-full bg-white border-r border-zinc-100 w-72 safe-area-left">
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center shadow-lg shadow-zinc-900/10">
             <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-zinc-900 tracking-tight">
              QIsaque
            </h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-8">
        {/* Navigation Section */}
        <div className="space-y-1">
             <p className="px-3 text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Navegação</p>
             <button
                onClick={() => { setTab("provas"); setIsMobileMenuOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium",
                  tab === "provas" ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                )}
              >
                <FolderOpen className={cn("w-4 h-4", tab === "provas" && "text-zinc-900")} />
                Provas
              </button>
              <button
                onClick={() => { setTab("schedule"); setIsMobileMenuOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium",
                  tab === "schedule" ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                )}
              >
                <CalendarRange className={cn("w-4 h-4", tab === "schedule" && "text-zinc-900")} />
                Cronograma
              </button>
             <button
                onClick={() => { setTab("study"); setIsMobileMenuOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium",
                  tab === "study" ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                )}
              >
                <Play className={cn("w-4 h-4", tab === "study" && "fill-current")} />
                Focar
              </button>
              <button
                onClick={() => { setTab("statistics"); setIsMobileMenuOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium",
                  tab === "statistics" ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                )}
              >
                <BarChart3 className="w-4 h-4" />
                Análise
              </button>
        </div>
      </div>

      {/* User Footer */}
      <div className="p-4 mt-auto space-y-2 border-t border-zinc-50 bg-zinc-50/50">
         <div className="flex items-center gap-3 mb-2 px-2">
            {user ? (
                <>
                    {user.photoURL ? (
                        <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-zinc-200" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-zinc-200">
                            <User className="w-4 h-4 text-zinc-500" />
                        </div>
                    )}
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-xs font-bold text-zinc-900 truncate">{user.displayName || "Usuário"}</span>
                        <span className="text-[10px] text-zinc-400 truncate">{user.email}</span>
                    </div>
                </>
            ) : (
                <span className="text-xs font-bold text-zinc-500">Modo Visitante</span>
            )}
         </div>

        <button
          onClick={handleSettingsClick}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-medium",
            tab === "settings" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-900"
          )}
        >
          <Settings className="w-4 h-4" />
          Ajustes
        </button>
        
        {user ? (
            <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-medium text-red-400 hover:text-red-600 hover:bg-red-50"
            >
            <LogOut className="w-4 h-4" />
            Sair
            </button>
        ) : (
             <button
            onClick={handleGuestLoginClick}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
            <UserPlus className="w-4 h-4" />
            Entrar
            </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans flex overflow-hidden selection:bg-zinc-900 selection:text-white">
      
      {/* Desktop Sidebar */}
      <div className="hidden md:block h-screen sticky top-0 z-40">
        <Sidebar />
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-40 md:hidden backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              className="fixed inset-y-0 left-0 z-50 bg-background w-72 md:hidden shadow-2xl safe-area-left"
            >
              <Sidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto safe-area-bottom bg-zinc-50/30">
        
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-zinc-50 px-6 py-4 md:px-10 md:py-5 transition-all">
           <div className="flex items-center justify-between max-w-6xl mx-auto w-full">
             
             {/* Mobile Hamburger */}
             <div className="md:hidden mr-4">
               <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
                 <Menu className="w-6 h-6 text-zinc-700" />
               </Button>
             </div>

             <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 text-zinc-400 text-sm font-medium">
                  <span>QIsaque</span>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-zinc-900 capitalize">
                      {tab === "planning" ? "Planejamento" : 
                       tab === "provas" ? "Minhas Provas" : 
                       tab === "schedule" ? "Cronograma" :
                       tab === "study" ? "Área de Foco" : 
                       tab === "statistics" ? "Relatórios" : "Ajustes"}
                  </span>
                </div>
             </div>

             <div className="flex items-center gap-4">
                {/* Streak Badge */}
                <div className="hidden sm:flex items-center gap-1.5 bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full text-xs font-bold border border-orange-100">
                   <Flame className="w-3.5 h-3.5 fill-current" />
                   {streakStats.currentStreak} dias
                </div>

                <div className="flex items-center gap-2">
                   <span className="text-sm font-bold text-zinc-900 hidden sm:block">
                     {settings.finalGoal || "Defina sua meta"}
                   </span>
                </div>
             </div>
           </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 px-6 py-8 md:px-10 md:py-10 max-w-6xl mx-auto w-full">
           <AnimatePresence mode="wait">
             <motion.div
               key={tab}
               initial={{ opacity: 0, y: 5 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -5 }}
               transition={{ duration: 0.2 }}
               className="h-full"
             >
               {tab === "provas" && (
                 <MonthGrid 
                   months={months} 
                   onSelectMonth={handleSelectExamForPlanning} 
                 />
               )}
               
               {tab === "planning" && selectedMonthId && (
                 <SubjectList 
                   monthId={selectedMonthId} 
                   subjects={getSubjectsByMonthId(selectedMonthId)}
                   onBack={() => setTab("provas")}
                 />
               )}

               {tab === "schedule" && <ScheduleTab />}

               {tab === "study" && <StartStudyTab />}

               {tab === "statistics" && (
                 <StatisticsTab 
                    months={months}
                    subjects={subjects}
                    monthlyGoalHours={settings.monthlyGoalHours}
                    getSessionsByMonth={getSessionsByMonthId}
                    getSubjectsByMonthId={getSubjectsByMonthId}
                 />
               )}

               {tab === "settings" && (
                 <SettingsPage 
                    settings={settings}
                    onUpdateSettings={updateSettings}
                    onBack={() => setTab("provas")}
                 />
               )}
             </motion.div>
           </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default App;

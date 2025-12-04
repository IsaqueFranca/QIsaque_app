
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Settings, GraduationCap, CalendarDays, Play, BarChart3, Menu, Flame, User, LogOut, Loader2, UserPlus, CloudOff
} from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./lib/firebase";
import { useStudyStore } from "./hooks/useStudyStore";
import MonthGrid from "./components/study/MonthGrid";
import SubjectList from "./components/study/SubjectList";
import SettingsPage from "./components/study/SettingsPage";
import StartStudyTab from "./components/study/StartStudyTab";
import StatisticsTab from "./components/study/StatisticsTab";
import LoginPage from "./components/auth/LoginPage";
import { Button } from "./components/ui/button";
import { cn } from "./lib/utils";
import { HealthDegree } from "./types";

type Tab = "months" | "study" | "statistics";
type View = "months" | "subjects" | "settings";

const getDegreeEmoji = (degree: HealthDegree) => {
  switch (degree) {
    case 'Pharmacy': return '💊';
    case 'Medicine': return '⚕️';
    case 'Nursing': return '✚';
    case 'Dentistry': return '🦷';
    case 'Physiotherapy': return '💪';
    case 'Biomedicine': return '🧬';
    case 'Nutrition': return '🍎';
    case 'Clinical Analysis': return '🔬';
    case 'Radiology': return '☢️';
    default: return '🎓';
  }
};

const App = () => {
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("months");
  const [view, setView] = useState<View>("months");
  const [selectedMonthId, setSelectedMonthId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const {
    months,
    subjects,
    settings,
    sessions,
    getSubjectsByMonthId,
    updateSettings,
    getSessionsByMonthId,
    getStreakStats,
    user,
    setUser,
    isGuest,
    setGuestMode,
    loadFromCloud
  } = useStudyStore();

  const streakStats = getStreakStats();

  // Authentication & Sync Logic
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL
        });
        // Auto-sync data when user is detected
        await loadFromCloud(currentUser.uid);
      } else {
        setUser(null);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSelectMonth = (monthId: string) => {
    setSelectedMonthId(monthId);
    setView("subjects");
  };

  const handleBack = () => {
    if (view === "subjects") {
      setSelectedMonthId(null);
    }
    setView("months");
  };

  const handleSettingsClick = () => {
    setView(view === "settings" ? "months" : "settings");
    if (window.innerWidth < 768) {
      setIsMobileMenuOpen(false);
    }
  };

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab);
    setView("months");
    setSelectedMonthId(null);
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
      // Logic handled in Settings Page or by logging out to trigger login screen
      setGuestMode(false); 
  };

  // 1. Loading Screen
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center animate-pulse">
             <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <p className="text-zinc-500 font-medium">Sincronizando dados...</p>
        </div>
      </div>
    );
  }

  // 2. Mandatory Login Screen (Unless Guest)
  if (!user && !isGuest) {
    return <LoginPage onLoginSuccess={() => {}} />;
  }

  // 3. Main Application (Rendered if user logged in OR guest)
  const Sidebar = () => (
    <div className="flex flex-col h-full bg-white border-r border-zinc-100 w-64 safe-area-left">
      <div className="p-8 pb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-blue-500/10 border border-zinc-100">
             <GraduationCap className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="font-bold text-xl text-zinc-900 tracking-tighter">
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-indigo-600 font-extrabold">QI</span>saque
            </h1>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-3">
        {[
          { id: 'months', icon: CalendarDays, label: 'Meses' },
          { id: 'study', icon: Play, label: 'Focar' },
          { id: 'statistics', icon: BarChart3, label: 'Análise' }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => handleTabChange(item.id as Tab)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 text-sm font-semibold tracking-wide group relative overflow-hidden",
              tab === item.id && view !== "settings"
                ? "bg-zinc-900 text-white shadow-lg shadow-zinc-900/10"
                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
            )}
          >
            <item.icon className={cn("w-5 h-5 transition-colors", 
               tab === item.id && view !== "settings" ? "text-white" : "text-zinc-400 group-hover:text-zinc-600"
            )} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto space-y-2 border-t border-zinc-50 pt-6 m-4">
         <div className="flex items-center gap-3 mb-4 px-2">
            {user ? (
                <>
                    {user.photoURL ? (
                        <img src={user.photoURL} alt="User" className="w-9 h-9 rounded-full border border-zinc-200 shadow-sm" />
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200">
                            <User className="w-4 h-4 text-zinc-500" />
                        </div>
                    )}
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-bold text-zinc-900 truncate">{user.displayName || "Usuário"}</span>
                        <span className="text-[10px] text-green-600 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        Online
                        </span>
                    </div>
                </>
            ) : (
                <>
                    <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center border border-orange-200">
                        <User className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-bold text-zinc-900 truncate">Visitante</span>
                        <span className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
                            <CloudOff className="w-3 h-3 text-zinc-400" />
                            Sem sync
                        </span>
                    </div>
                </>
            )}
            
         </div>

        <button
          onClick={handleSettingsClick}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-semibold tracking-wide",
            view === "settings"
              ? "bg-zinc-100 text-zinc-900"
              : "text-zinc-400 hover:text-zinc-900"
          )}
        >
          <Settings className={cn("w-4 h-4 transition-colors")} />
          Ajustes
        </button>
        
        {user ? (
            <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-semibold tracking-wide text-red-400 hover:text-red-600 hover:bg-red-50"
            >
            <LogOut className="w-4 h-4" />
            Sair
            </button>
        ) : (
             <button
            onClick={handleGuestLoginClick}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-semibold tracking-wide text-blue-600 hover:text-blue-700 hover:bg-blue-50"
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
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto safe-area-bottom">
        
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-zinc-50 px-6 py-4 md:px-10 md:py-6 transition-all">
           <div className="flex items-center justify-between max-w-6xl mx-auto w-full">
             
             {/* Mobile Hamburger */}
             <div className="md:hidden mr-4">
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
                  <Menu className="w-5 h-5" />
                </Button>
             </div>

             <div className="flex-1">
                <h1 className="text-xl md:text-3xl font-bold text-zinc-900 flex items-center gap-2 md:gap-3">
                  Olá, {user?.displayName?.split(' ')[0] || (isGuest ? "Visitante" : settings.userName)}
                  <span className="text-xl opacity-80" title={settings.healthDegree}>
                    {getDegreeEmoji(settings.healthDegree)}
                  </span>
                </h1>
                <div className="flex items-center gap-2 mt-1 hidden md:flex">
                   <div className="w-1.5 h-1.5 rounded-full bg-zinc-300"></div>
                   <p className="text-zinc-400 font-medium text-sm tracking-wide">
                     {settings.finalGoal || "Sua meta principal"}
                   </p>
                </div>
             </div>
             
             {/* Streak Badge */}
             <div className="flex items-center gap-4 bg-orange-50 text-orange-700 px-4 py-2 md:px-5 md:py-2.5 rounded-full shadow-sm border border-orange-100">
               <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                 <Flame className="w-4 h-4 text-orange-500 fill-current" />
               </div>
               <div className="flex flex-col">
                 <span className="font-bold text-base md:text-lg leading-none tabular-nums">{streakStats.currentStreak}</span>
                 <span className="text-[9px] md:text-[10px] opacity-70 uppercase tracking-widest font-semibold">Dias</span>
               </div>
             </div>
           </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-10 max-w-6xl mx-auto w-full">
          <AnimatePresence mode="wait">
             {view === "settings" ? (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <SettingsPage
                  settings={settings}
                  onUpdateSettings={updateSettings}
                  onBack={handleBack}
                />
              </motion.div>
            ) : tab === "months" && view === "months" ? (
              <motion.div
                key="months"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <MonthGrid
                  months={months}
                  onSelectMonth={handleSelectMonth}
                />
              </motion.div>
            ) : tab === "months" && view === "subjects" && selectedMonthId ? (
              <motion.div
                key="subjects"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <SubjectList
                  monthId={selectedMonthId}
                  subjects={getSubjectsByMonthId(selectedMonthId)}
                  onBack={handleBack}
                />
              </motion.div>
            ) : tab === "study" ? (
              <motion.div
                key="study"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
              >
                <StartStudyTab />
              </motion.div>
            ) : tab === "statistics" ? (
              <motion.div
                key="statistics"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <StatisticsTab
                  months={months}
                  subjects={subjects}
                  monthlyGoalHours={settings.monthlyGoalHours}
                  getSessionsByMonth={getSessionsByMonthId}
                  getSubjectsByMonthId={getSubjectsByMonthId}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default App;

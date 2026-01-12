
import React, { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { Play, Pause, CheckCircle2, Clock, Trash2, X, Plus, Calendar } from "lucide-react";
import { formatDate, cn } from "../../lib/utils";
import { useStudyStore } from "../../hooks/useStudyStore";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "../ui/input";

const StartStudyTab = () => {
  const { 
    months, 
    settings, 
    addSession, 
    getSessionsByMonthId,
    deleteSession,
    subjects,
    getSubjectsByMonthId,
    activeSubjectId,
    setActiveSubjectId
  } = useStudyStore();

  const [selectedMonthId, setSelectedMonthId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [studyDate, setStudyDate] = useState<string>(formatDate(new Date())); 
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(settings.pomodoroDuration * 60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isManualOpen, setIsManualOpen] = useState(false);
  const [manualHours, setManualHours] = useState("");
  const [manualMinutes, setManualMinutes] = useState("");

  useEffect(() => {
    if (activeSubjectId) {
      const subject = subjects.find(s => s.id === activeSubjectId);
      if (subject) {
        setSelectedMonthId(subject.monthId);
        setSelectedSubjectId(subject.id);
      }
      setActiveSubjectId(null);
    } else if (months.length > 0 && !selectedMonthId) {
      setSelectedMonthId(months[0].id);
    }
  }, [activeSubjectId, months, subjects]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev - 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); }
  }, [isRunning]);

  const handleStartTimer = () => {
    if (!selectedSubjectId) return;
    setIsTimerOpen(true);
    setSeconds(settings.pomodoroDuration * 60);
    setIsRunning(true);
  };

  const handleFinishSession = (status: 'completed' | 'incomplete') => {
    if (!selectedSubjectId) return;
    const duration = (settings.pomodoroDuration * 60) - seconds;
    const now = new Date();
    if (duration > 10) {
      addSession({
        subjectId: selectedSubjectId,
        startTime: now.getTime(),
        duration: duration,
        date: formatDate(now),
        status: status
      });
    }
    setIsRunning(false);
    setIsTimerOpen(false);
  };

  const handleSaveManualSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId) return;
    const h = parseInt(manualHours) || 0;
    const m = parseInt(manualMinutes) || 0;
    if (h === 0 && m === 0) return;
    const totalSeconds = (h * 3600) + (m * 60);
    const [y, mon, d] = studyDate.split('-').map(Number);
    const sessionDate = new Date(y, mon - 1, d, 12, 0, 0);
    addSession({
        subjectId: selectedSubjectId,
        startTime: sessionDate.getTime(),
        duration: totalSeconds,
        date: studyDate,
        status: 'completed'
    });
    setIsManualOpen(false);
    setManualHours("");
    setManualMinutes("");
    setStudyDate(formatDate(new Date())); 
  };

  const formatTime = (totalSeconds: number) => {
    const safeSeconds = Math.max(0, totalSeconds);
    const m = Math.floor(safeSeconds / 60);
    const s = safeSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const monthSessions = selectedMonthId ? getSessionsByMonthId(selectedMonthId) : [];
  const sortedSessions = [...monthSessions].sort((a, b) => b.startTime - a.startTime);
  const availableSubjects = selectedMonthId ? getSubjectsByMonthId(selectedMonthId) : [];
  const currentSubject = subjects.find(s => s.id === selectedSubjectId);

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Cronômetro de Estudo</h2>
        <p className="text-zinc-500">Registre seu tempo real de dedicação.</p>
      </div>

      <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-200 shadow-sm space-y-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Categoria</label>
            <select 
              className="w-full h-14 px-6 rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-900 font-bold outline-none focus:ring-2 focus:ring-zinc-900 transition-all cursor-pointer"
              value={selectedMonthId}
              onChange={(e) => { setSelectedMonthId(e.target.value); setSelectedSubjectId(""); }}
            >
              <option value="" disabled>Escolha um período</option>
              {months.map(m => ( <option key={m.id} value={m.id}>{m.name}</option> ))}
            </select>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Matéria</label>
            <select 
              className="w-full h-14 px-6 rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-900 font-bold outline-none focus:ring-2 focus:ring-zinc-900 transition-all disabled:opacity-30 cursor-pointer"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              disabled={!selectedMonthId || availableSubjects.length === 0}
            >
              <option value="">{availableSubjects.length === 0 ? "—" : "Selecione a matéria"}</option>
              {availableSubjects.map(s => ( <option key={s.id} value={s.id}>{s.title}</option> ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 pt-4">
            <Button 
              size="lg" 
              className="flex-[2] h-16 text-xl font-bold rounded-3xl bg-zinc-900 text-white shadow-2xl shadow-zinc-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all" 
              onClick={handleStartTimer}
              disabled={!selectedSubjectId}
            >
              <Play className="w-6 h-6 mr-3 fill-current" /> Iniciar Timer
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-16 rounded-3xl border-zinc-200 text-zinc-600 font-bold hover:bg-zinc-50"
              onClick={() => setIsManualOpen(true)}
              disabled={!selectedSubjectId}
            >
              <Plus className="w-5 h-5 mr-2" /> Adicionar Manual
            </Button>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="font-bold text-xl text-zinc-900 border-l-4 border-zinc-900 pl-4">Sessões Recentes</h3>
        {monthSessions.length === 0 ? (
          <div className="py-20 text-center text-zinc-300 italic text-sm border-2 border-dashed border-zinc-100 rounded-[2.5rem]">
             Nenhum registro encontrado.
          </div>
        ) : (
          <div className="grid gap-3">
            {sortedSessions.map(session => {
              const subject = subjects.find(s => s.id === session.subjectId);
              return (
                <div key={session.id} className="p-6 rounded-3xl border border-zinc-100 bg-white flex items-center justify-between group hover:border-zinc-300 transition-all">
                  <div className="space-y-1">
                    <span className="font-bold text-zinc-800">{subject?.title || "Matéria Excluída"}</span>
                    <div className="flex items-center gap-4 text-xs font-medium text-zinc-400">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {session.date.split('-').reverse().join('/')}</span>
                      <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {Math.floor(session.duration / 60)} min</span>
                    </div>
                  </div>
                  <Button 
                    size="icon" variant="ghost" className="h-10 w-10 rounded-xl text-zinc-200 hover:text-red-500 hover:bg-red-50"
                    onClick={() => deleteSession(session.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isManualOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-sm p-4" onClick={() => setIsManualOpen(false)}>
            <motion.div initial={{ scale: 0.9, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 10 }} className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-zinc-100" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-bold text-2xl text-zinc-900 mb-6">Registro Manual</h3>
              <form onSubmit={handleSaveManualSession} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Data</label>
                    <Input type="date" value={studyDate} onChange={(e) => setStudyDate(e.target.value)} className="h-12 bg-zinc-50 border-zinc-200" required />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Horas</label>
                        <Input type="number" min="0" placeholder="0" value={manualHours} onChange={(e) => setManualHours(e.target.value)} className="h-12 bg-zinc-50 border-zinc-200" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Minutos</label>
                        <Input type="number" min="0" max="59" placeholder="0" value={manualMinutes} onChange={(e) => setManualMinutes(e.target.value)} className="h-12 bg-zinc-50 border-zinc-200" />
                    </div>
                 </div>
                 <div className="pt-4 flex gap-3">
                    <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsManualOpen(false)}>Cancelar</Button>
                    <Button type="submit" className="flex-1 rounded-2xl bg-zinc-900 text-white font-bold h-12">Salvar</Button>
                 </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isTimerOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-zinc-900 flex flex-col items-center justify-center p-8">
            <div className="text-center space-y-2 mb-20">
              <h2 className="font-bold text-3xl text-white">{currentSubject?.title}</h2>
              <p className="text-zinc-500 font-medium">Foco em andamento...</p>
            </div>
            <div className="relative flex flex-col items-center">
               <div className="text-[10rem] md:text-[15rem] font-light font-mono tabular-nums text-white leading-none tracking-tighter">
                  {formatTime(seconds)}
               </div>
               <div className="flex gap-6 mt-20">
                  <Button 
                    size="lg" className={cn("h-24 w-24 rounded-full transition-all", isRunning ? "bg-white text-zinc-900" : "bg-emerald-500 text-white")}
                    onClick={() => setIsRunning(!isRunning)}
                  >
                    {isRunning ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current" />}
                  </Button>
                  <Button 
                    size="lg" variant="ghost" className="h-24 w-24 rounded-full border-2 border-white/10 text-white hover:bg-white/10"
                    onClick={() => handleFinishSession('completed')}
                  >
                    <CheckCircle2 className="w-10 h-10" />
                  </Button>
               </div>
            </div>
            <button 
              onClick={() => handleFinishSession('incomplete')}
              className="mt-20 text-zinc-500 hover:text-red-400 font-bold uppercase tracking-widest text-xs transition-colors"
            >
              Parar e Descartar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StartStudyTab;

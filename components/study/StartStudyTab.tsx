
import React, { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { Play, Pause, CheckCircle2, Clock, Trash2, Plus, Calendar } from "lucide-react";
import { formatDate, cn } from "../../lib/utils";
import { useStudyStore } from "../../hooks/useStudyStore";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "../ui/input";

const StartStudyTab = () => {
  const { 
    months, settings, addSession, getSessionsByMonthId, deleteSession, subjects, getSubjectsByMonthId, activeSubjectId, setActiveSubjectId
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
      if (subject) { setSelectedMonthId(subject.monthId); setSelectedSubjectId(subject.id); }
      setActiveSubjectId(null);
    } else if (months.length > 0 && !selectedMonthId) {
      setSelectedMonthId(months[0].id);
    }
  }, [activeSubjectId, months, subjects]);

  useEffect(() => {
    if (isRunning) { intervalRef.current = setInterval(() => setSeconds((prev) => prev - 1), 1000); } 
    else if (intervalRef.current) { clearInterval(intervalRef.current); }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); }
  }, [isRunning]);

  const handleStartTimer = () => { if (!selectedSubjectId) return; setIsTimerOpen(true); setSeconds(settings.pomodoroDuration * 60); setIsRunning(true); };
  const handleFinishSession = (status: 'completed' | 'incomplete') => {
    if (!selectedSubjectId) return;
    const duration = (settings.pomodoroDuration * 60) - seconds;
    if (duration > 10) { addSession({ subjectId: selectedSubjectId, startTime: Date.now(), duration, date: formatDate(new Date()), status }); }
    setIsRunning(false); setIsTimerOpen(false);
  };

  const handleSaveManualSession = (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedSubjectId) return;
    const h = parseInt(manualHours) || 0; const m = parseInt(manualMinutes) || 0;
    if (h === 0 && m === 0) return;
    addSession({ subjectId: selectedSubjectId, startTime: Date.now(), duration: (h * 3600) + (m * 60), date: studyDate, status: 'completed' });
    setIsManualOpen(false); setManualHours(""); setManualMinutes("");
  };

  const formatTime = (totalSeconds: number) => {
    const safeSeconds = Math.max(0, totalSeconds); const m = Math.floor(safeSeconds / 60); const s = safeSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const monthSessions = selectedMonthId ? getSessionsByMonthId(selectedMonthId) : [];
  const sortedSessions = [...monthSessions].sort((a, b) => b.startTime - a.startTime);
  const availableSubjects = selectedMonthId ? getSubjectsByMonthId(selectedMonthId) : [];
  const currentSubject = subjects.find(s => s.id === selectedSubjectId);

  return (
    <div className="space-y-6">
      <div className="space-y-0.5">
        <h2 className="text-base font-bold text-zinc-900 tracking-tight">Registro de Tempo</h2>
        <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-tighter">Timer & Adição Manual</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Grupo</label>
            <select className="w-full h-10 px-3 rounded-lg border border-zinc-100 bg-zinc-50 text-[11px] font-bold outline-none" value={selectedMonthId} onChange={(e) => setSelectedMonthId(e.target.value)}>
              {months.map(m => ( <option key={m.id} value={m.id}>{m.name}</option> ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Matéria</label>
            <select className="w-full h-10 px-3 rounded-lg border border-zinc-100 bg-zinc-50 text-[11px] font-bold outline-none" value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} disabled={availableSubjects.length === 0}>
              <option value="">{availableSubjects.length === 0 ? "—" : "Selecione..."}</option>
              {availableSubjects.map(s => ( <option key={s.id} value={s.id}>{s.title}</option> ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
            <Button size="sm" className="flex-1 h-10 text-xs font-black uppercase rounded-lg" onClick={handleStartTimer} disabled={!selectedSubjectId}>
              <Play className="w-3.5 h-3.5 mr-2 fill-current" /> Timer
            </Button>
            <Button variant="outline" size="sm" className="flex-1 h-10 text-xs font-black uppercase rounded-lg" onClick={() => setIsManualOpen(true)} disabled={!selectedSubjectId}>
              <Plus className="w-3.5 h-3.5 mr-2" /> Manual
            </Button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1">Sessões Recentes</h3>
        <div className="grid gap-1.5">
          {sortedSessions.length === 0 ? (
            <div className="py-8 text-center text-zinc-300 text-[10px] italic border border-dashed border-zinc-100 rounded-xl">Nenhum registro</div>
          ) : (
            sortedSessions.slice(0, 8).map(session => {
              const subject = subjects.find(s => s.id === session.subjectId);
              return (
                <div key={session.id} className="p-3 rounded-lg border border-zinc-50 bg-white flex items-center justify-between hover:border-zinc-200 transition-all">
                  <div>
                    <span className="block font-bold text-zinc-800 text-[11px] leading-none">{subject?.title || "Matéria"}</span>
                    <div className="flex items-center gap-3 text-[9px] font-bold text-zinc-400 uppercase mt-1">
                      <span className="flex items-center gap-1"><Calendar className="w-2.5 h-2.5" /> {session.date.split('-').reverse().join('/')}</span>
                      <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {Math.floor(session.duration / 60)} min</span>
                    </div>
                  </div>
                  <button onClick={() => deleteSession(session.id)} className="h-7 w-7 rounded-lg text-zinc-200 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <AnimatePresence>
        {isTimerOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-zinc-900 flex flex-col items-center justify-center p-6">
            <div className="text-center mb-10">
              <h2 className="font-bold text-lg text-white">{currentSubject?.title}</h2>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Cronômetro Ativo</span>
            </div>
            <div className="text-8xl md:text-9xl font-mono tabular-nums text-white font-thin mb-20">{formatTime(seconds)}</div>
            <div className="flex gap-4">
              <button onClick={() => setIsRunning(!isRunning)} className="w-16 h-16 rounded-full bg-white text-zinc-900 flex items-center justify-center">
                {isRunning ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
              </button>
              <button onClick={() => handleFinishSession('completed')} className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </button>
            </div>
            <button onClick={() => handleFinishSession('incomplete')} className="mt-20 text-zinc-600 text-[10px] font-black uppercase tracking-widest">Descartar Sessão</button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isManualOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/20 backdrop-blur-sm p-4" onClick={() => setIsManualOpen(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-xl p-6 max-w-xs w-full shadow-2xl border border-zinc-100" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-bold text-sm text-zinc-900 mb-4">Adicionar Horas</h3>
              <form onSubmit={handleSaveManualSession} className="space-y-3">
                 <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase">Data</label>
                    <Input type="date" value={studyDate} onChange={(e) => setStudyDate(e.target.value)} className="h-8 text-xs" required />
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-zinc-400 uppercase">H</label>
                        <Input type="number" placeholder="0" value={manualHours} onChange={(e) => setManualHours(e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-zinc-400 uppercase">M</label>
                        <Input type="number" placeholder="0" value={manualMinutes} onChange={(e) => setManualMinutes(e.target.value)} className="h-8 text-xs" />
                    </div>
                 </div>
                 <div className="pt-2 flex gap-2">
                    <Button variant="ghost" size="sm" className="flex-1 text-[10px]" onClick={() => setIsManualOpen(false)}>Voltar</Button>
                    <Button type="submit" size="sm" className="flex-1 text-[10px]">Salvar</Button>
                 </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StartStudyTab;

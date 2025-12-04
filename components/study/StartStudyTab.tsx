
import React, { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { Play, Pause, CheckCircle2, Clock, Trash2, X, Send, Bot, Sparkles, MessageSquare, Plus, Calendar } from "lucide-react";
import { formatDate, cn } from "../../lib/utils";
import { useStudyStore } from "../../hooks/useStudyStore";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "../ui/input";
import { getStudyChatResponse } from "../../services/geminiService";

const StartStudyTab = () => {
  const { 
    months, 
    settings, 
    addSession, 
    getSessionsByMonthId,
    deleteSession,
    updateSessionStatus,
    subjects,
    getSubjectsByMonthId
  } = useStudyStore();

  const [selectedMonthId, setSelectedMonthId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  
  // studyDate is now only used for the Manual Entry Modal
  const [studyDate, setStudyDate] = useState<string>(formatDate(new Date())); 
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  
  // Timer State
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(settings.pomodoroDuration * 60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model'; parts: { text: string }[] }[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Manual Entry State
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [manualHours, setManualHours] = useState("");
  const [manualMinutes, setManualMinutes] = useState("");

  useEffect(() => {
    if (months.length > 0 && !selectedMonthId) {
      setSelectedMonthId(months[0].id);
    }
  }, [months]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev - 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [isRunning]);

  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isChatOpen]);

  const handleStartTimer = () => {
    if (!selectedSubjectId) return;
    setIsTimerOpen(true);
    setSeconds(settings.pomodoroDuration * 60);
    setIsRunning(true);
    setChatHistory([]);
    setIsChatOpen(false);
  };

  const handleFinishSession = (status: 'completed' | 'incomplete') => {
    if (!selectedSubjectId) return;

    const duration = (settings.pomodoroDuration * 60) - seconds;
    
    // For live timer sessions, ALWAYS use the current system time/date
    const now = new Date();

    if (duration > 10) {
      addSession({
        subjectId: selectedSubjectId,
        startTime: now.getTime(),
        duration: duration,
        date: formatDate(now), // System date
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
    
    // Create a timestamp based on the MANUALLY selected date (defaulting to noon to avoid timezone edges)
    const [y, mon, d] = studyDate.split('-').map(Number);
    const sessionDate = new Date(y, mon - 1, d, 12, 0, 0);

    addSession({
        subjectId: selectedSubjectId,
        startTime: sessionDate.getTime(),
        duration: totalSeconds,
        date: studyDate, // Use the manual picker date
        status: 'completed'
    });

    setIsManualOpen(false);
    setManualHours("");
    setManualMinutes("");
    // Reset date to today after saving, for convenience
    setStudyDate(formatDate(new Date())); 
  };

  const formatTime = (totalSeconds: number) => {
    const safeSeconds = Math.max(0, totalSeconds);
    const m = Math.floor(safeSeconds / 60);
    const s = safeSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !selectedSubjectId) return;

    const subject = subjects.find(s => s.id === selectedSubjectId);
    if (!subject) return;

    const userMsg = { role: 'user' as const, parts: [{ text }] };
    setChatHistory(prev => [...prev, userMsg]);
    setChatMessage("");
    setIsAiLoading(true);

    const responseText = await getStudyChatResponse(
      subject.title,
      settings.healthDegree,
      text,
      chatHistory
    );

    const aiMsg = { role: 'model' as const, parts: [{ text: responseText }] };
    setChatHistory(prev => [...prev, aiMsg]);
    setIsAiLoading(false);
  };

  const monthSessions = selectedMonthId ? getSessionsByMonthId(selectedMonthId) : [];
  const sortedSessions = [...monthSessions].sort((a, b) => b.startTime - a.startTime);
  const availableSubjects = selectedMonthId ? getSubjectsByMonthId(selectedMonthId) : [];
  const currentSubject = subjects.find(s => s.id === selectedSubjectId);

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Foco Total</h2>
        <p className="text-zinc-500">Selecione o alvo e registre seu progresso.</p>
      </div>

      {/* Selectors */}
      <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-zinc-100 shadow-sm space-y-6">
        <div className="grid md:grid-cols-12 gap-6">
          
          {/* Month Selector */}
          <div className="md:col-span-5 space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Mês</label>
            <div className="relative">
              <select 
                className="w-full h-14 px-5 rounded-2xl border border-zinc-200 bg-white text-zinc-900 text-base font-medium appearance-none focus:ring-2 focus:ring-zinc-900 outline-none transition-all cursor-pointer hover:border-zinc-300"
                value={selectedMonthId}
                onChange={(e) => {
                  setSelectedMonthId(e.target.value);
                  setSelectedSubjectId("");
                }}
              >
                <option value="" disabled className="text-zinc-400 bg-white">Escolha um período</option>
                {months.map(m => (
                  <option key={m.id} value={m.id} className="text-zinc-900 bg-white">{m.name}</option>
                ))}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                <Clock className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Subject Selector */}
          <div className="md:col-span-7 space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Assunto</label>
            <div className="relative">
              <select 
                className="w-full h-14 px-5 rounded-2xl border border-zinc-200 bg-white text-zinc-900 text-base font-medium appearance-none focus:ring-2 focus:ring-zinc-900 outline-none transition-all disabled:opacity-50 disabled:bg-zinc-50 cursor-pointer hover:border-zinc-300"
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                disabled={!selectedMonthId || availableSubjects.length === 0}
              >
                <option value="" className="text-zinc-400 bg-white">
                  {availableSubjects.length === 0 ? "—" : "Selecione o tópico"}
                </option>
                {availableSubjects.map(s => (
                  <option key={s.id} value={s.id} className="text-zinc-900 bg-white">{s.title}</option>
                ))}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 pt-2">
            <Button 
              size="lg" 
              className="flex-1 h-14 text-lg font-bold rounded-2xl bg-zinc-900 text-white hover:bg-zinc-800 shadow-xl shadow-zinc-900/20 transition-all" 
              onClick={handleStartTimer}
              disabled={!selectedSubjectId}
            >
              <Play className="w-5 h-5 mr-3 fill-current" /> Iniciar Sessão
            </Button>
            
            <Button
              variant="outline"
              className="flex-1 h-14 text-zinc-600 border-zinc-200 hover:text-zinc-900 hover:bg-zinc-50 hover:border-zinc-300 rounded-2xl text-base"
              onClick={() => setIsManualOpen(true)}
              disabled={!selectedSubjectId}
            >
              <Plus className="w-4 h-4 mr-2" /> Registrar Manualmente
            </Button>
        </div>
      </div>

      {/* Session History */}
      <div className="space-y-6">
        <h3 className="font-bold text-xl text-zinc-900 pl-2 border-l-4 border-zinc-900">
           Histórico Recente
        </h3>
        
        {monthSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400 bg-white border border-dashed border-zinc-200 rounded-[2rem]">
             <Clock className="w-8 h-8 mb-3 opacity-20" />
             <p className="text-sm">Nenhuma sessão registrada neste mês.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedSessions.map(session => {
              const subject = subjects.find(s => s.id === session.subjectId);
              const isIncomplete = session.status === 'incomplete';
              const sessionDateDisplay = session.date.split('-').reverse().join('/');
              
              return (
                <div key={session.id} className={cn(
                  "p-5 rounded-2xl border flex items-center justify-between transition-all hover:translate-x-1",
                  isIncomplete 
                    ? "bg-zinc-50 border-zinc-200" 
                    : "bg-white border-zinc-100 shadow-sm"
                )}>
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-base text-zinc-800">{subject?.title || "Desconhecido"}</span>
                    <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
                      <span className="flex items-center gap-1.5 bg-zinc-50 px-2 py-1 rounded-md">
                         <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                         {sessionDateDisplay}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {Math.floor(session.duration / 60)} min
                      </span>
                      
                      {isIncomplete && (
                        <span className="text-red-500 bg-red-50 px-2 py-0.5 rounded-md">
                          Incompleto
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isIncomplete && (
                       <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-9 w-9 rounded-full text-zinc-400 hover:text-green-600 hover:bg-green-50"
                        onClick={() => updateSessionStatus(session.id, 'completed')}
                       >
                         <CheckCircle2 className="w-5 h-5" />
                       </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-9 w-9 rounded-full text-zinc-300 hover:text-red-500 hover:bg-red-50"
                      onClick={() => deleteSession(session.id)}
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual Entry Modal */}
      <AnimatePresence>
        {isManualOpen && (
            <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-sm p-4"
            onClick={() => setIsManualOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-zinc-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                   <h3 className="font-bold text-xl text-zinc-900">Registro Manual</h3>
                   <p className="text-sm text-zinc-500 truncate max-w-[200px]">{currentSubject?.title}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsManualOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <form onSubmit={handleSaveManualSession} className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Data</label>
                    <Input 
                        type="date" 
                        value={studyDate}
                        onChange={(e) => setStudyDate(e.target.value)}
                        className="bg-zinc-50 border-zinc-200"
                        required
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Horas</label>
                        <Input 
                            type="number" 
                            min="0"
                            placeholder="0"
                            value={manualHours}
                            onChange={(e) => setManualHours(e.target.value)}
                            className="bg-zinc-50 border-zinc-200"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Minutos</label>
                        <Input 
                            type="number" 
                            min="0"
                            max="59"
                            placeholder="0"
                            value={manualMinutes}
                            onChange={(e) => setManualMinutes(e.target.value)}
                            className="bg-zinc-50 border-zinc-200"
                        />
                    </div>
                 </div>

                 <div className="pt-4 flex gap-3">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setIsManualOpen(false)}>Cancelar</Button>
                    <Button type="submit" className="flex-1">Salvar</Button>
                 </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Timer Modal */}
      <AnimatePresence>
        {isTimerOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden"
          >
            {/* Timer Header */}
            <div className="p-8 flex justify-between items-center">
               <div>
                  <h2 className="font-bold text-2xl text-zinc-900">{currentSubject?.title}</h2>
                  <p className="text-zinc-500 text-sm flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    {formatDate(new Date()).split('-').reverse().join('/')}
                  </p>
               </div>
               
               <div className="flex gap-4">
                  {!isChatOpen && (
                    <Button 
                      variant="outline" 
                      className="gap-2 rounded-xl h-11 border-zinc-200 hover:bg-zinc-50"
                      onClick={() => setIsChatOpen(true)}
                    >
                      <Sparkles className="w-4 h-4" /> AI Tutor
                    </Button>
                  )}
                  <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setIsTimerOpen(false)} 
                  >
                      <X className="w-6 h-6" />
                  </Button>
               </div>
            </div>

            <div className="flex-1 flex relative">
              {/* Timer Content */}
              <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-16 transition-all duration-300">
                <div className="relative">
                   {/* Decorative circle */}
                   <div className="absolute inset-0 rounded-full border border-zinc-100 scale-150 opacity-50"></div>
                   
                   <div className="text-[9rem] md:text-[13rem] font-light font-mono tracking-tighter tabular-nums text-zinc-900 leading-none select-none z-10 relative">
                      {formatTime(seconds)}
                   </div>
                </div>

                <div className="flex flex-col gap-6 w-full max-w-sm">
                   <Button 
                      size="lg" 
                      className={cn(
                        "h-24 text-2xl font-bold rounded-[2rem] gap-5 transition-all shadow-2xl hover:scale-105 active:scale-95",
                        isRunning 
                            ? "bg-white text-zinc-900 border-2 border-zinc-100 hover:bg-zinc-50" 
                            : "bg-zinc-900 text-white hover:bg-zinc-800"
                      )}
                      onClick={() => setIsRunning(!isRunning)}
                    >
                      {isRunning ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />}
                      {isRunning ? "Pausar Foco" : "Iniciar Foco"}
                   </Button>

                   <div className="grid grid-cols-2 gap-4">
                      <Button 
                        variant="ghost" 
                        className="h-16 rounded-2xl text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors text-base font-medium"
                        onClick={() => handleFinishSession('incomplete')}
                      >
                        Abandonar
                      </Button>
                       <Button 
                        variant="ghost" 
                        className="h-16 rounded-2xl text-zinc-400 hover:text-green-600 hover:bg-green-50 transition-colors text-base font-medium"
                        onClick={() => handleFinishSession('completed')}
                      >
                        Finalizar
                      </Button>
                   </div>
                </div>
              </div>

              {/* AI Chat Panel */}
              <AnimatePresence>
                {isChatOpen && (
                  <motion.div
                    initial={{ x: "100%", opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: "100%", opacity: 0 }}
                    transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                    className="absolute inset-y-0 right-0 w-full md:w-[500px] bg-white border-l border-zinc-100 shadow-2xl flex flex-col z-20"
                  >
                    <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-white/50 backdrop-blur-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-lg">
                          <Bot className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-zinc-900">QIsaque AI</h3>
                          <p className="text-xs text-zinc-500 font-medium tracking-wide uppercase">Tutor: {settings.healthDegree}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(false)} className="rounded-full hover:bg-zinc-100">
                        <X className="w-6 h-6" />
                      </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#FAFAFA]">
                      {chatHistory.length === 0 && (
                        <div className="text-center space-y-8 py-10">
                          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-100">
                            <Sparkles className="w-8 h-8 text-zinc-400" />
                          </div>
                          <p className="text-base text-zinc-500 max-w-[280px] mx-auto leading-relaxed">
                            Estou pronto para ajudar com <strong>{currentSubject?.title}</strong>.
                          </p>
                          <div className="flex flex-col gap-3 max-w-xs mx-auto">
                             {[
                                { icon: "📝", label: "Resumir Tópico", prompt: `Resuma os pontos principais de ${currentSubject?.title}` },
                                { icon: "🔗", label: "Tópicos Correlatos", prompt: `Quais são os assuntos correlatos mais importantes para ${currentSubject?.title}?` },
                                { icon: "🧠", label: "Questão de Revisão", prompt: `Crie uma questão de residência sobre ${currentSubject?.title}` }
                             ].map((opt, i) => (
                               <Button key={i} variant="outline" className="justify-start h-auto py-4 px-5 rounded-xl text-left border-zinc-200 bg-white hover:border-zinc-300 shadow-sm text-zinc-700" onClick={() => handleSendMessage(opt.prompt)}>
                                 <span className="mr-3 text-xl grayscale opacity-80">{opt.icon}</span> {opt.label}
                               </Button>
                             ))}
                          </div>
                        </div>
                      )}
                      
                      {chatHistory.map((msg, i) => (
                        <div key={i} className={cn("flex gap-4", msg.role === 'user' ? "flex-row-reverse" : "")}>
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
                            msg.role === 'user' ? "bg-zinc-900 text-white border-zinc-900" : "bg-white border-zinc-200"
                          )}>
                             {msg.role === 'user' ? <MessageSquare className="w-3 h-3" /> : <Bot className="w-4 h-4 text-zinc-500" />}
                          </div>
                          <div className={cn(
                            "p-5 rounded-[1.5rem] text-sm leading-7 shadow-sm max-w-[85%]",
                            msg.role === 'user' 
                                ? "bg-zinc-900 text-zinc-50 rounded-tr-sm" 
                                : "bg-white border border-zinc-200 text-zinc-700 rounded-tl-sm"
                          )}>
                             {msg.parts[0].text}
                          </div>
                        </div>
                      ))}
                      {isAiLoading && (
                        <div className="flex gap-4">
                           <div className="w-8 h-8 rounded-full bg-white border border-zinc-200 flex items-center justify-center shrink-0">
                             <Bot className="w-4 h-4 text-zinc-400 animate-pulse" />
                           </div>
                           <div className="bg-white border border-zinc-200 text-zinc-500 p-4 rounded-2xl rounded-tl-sm text-sm shadow-sm flex items-center gap-2">
                             <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                             <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                             <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></span>
                           </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    <div className="p-6 border-t border-zinc-100 bg-white">
                       <form 
                         className="flex gap-3 relative"
                         onSubmit={(e) => { e.preventDefault(); handleSendMessage(chatMessage); }}
                       >
                         <Input 
                           value={chatMessage}
                           onChange={(e) => setChatMessage(e.target.value)}
                           placeholder="Digite sua dúvida..."
                           className="flex-1 h-14 pl-6 pr-14 rounded-2xl bg-zinc-50 border-zinc-200 focus:bg-white transition-all shadow-inner"
                           disabled={isAiLoading}
                         />
                         <Button type="submit" size="icon" className="absolute right-2 top-2 h-10 w-10 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800" disabled={isAiLoading || !chatMessage.trim()}>
                           <Send className="w-4 h-4 ml-0.5" />
                         </Button>
                       </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StartStudyTab;

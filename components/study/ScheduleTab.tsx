import React, { useState, useMemo } from "react";
import { useStudyStore } from "../../hooks/useStudyStore";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Plus, X, ArrowRight, Check, BookOpen, ChevronDown, ChevronUp, Clock, AlertCircle, CheckCircle2, Circle, Edit3, TrendingUp, MoreHorizontal, StickyNote, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { cn, formatDate } from "../../lib/utils";
import { Session, Subject, Subtopic } from "../../types";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// --- Components ---

interface ScheduleSubjectCardProps {
  subject: Subject;
  monthId: string;
  sessions: Session[];
  onToggleSubtopic: (subjectId: string, subtopicId: string) => void;
  onUpdateSessionStatus: (sessionId: string, status: 'completed' | 'incomplete') => void;
  onUpdateSubject: (id: string, updates: Partial<Subject>) => void;
}

const ScheduleSubjectCard: React.FC<ScheduleSubjectCardProps> = ({ 
  subject, 
  monthId, 
  sessions, 
  onToggleSubtopic,
  onUpdateSessionStatus,
  onUpdateSubject
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Stats Calculation
  const goalHours = (subject.weeklyGoal || 0) * 4; // Approx 4 weeks/month
  const subjectSessions = sessions.filter(s => s.subjectId === subject.id && s.date.startsWith(monthId));
  const totalSeconds = subjectSessions.reduce((acc, s) => acc + s.duration, 0);
  const totalHours = totalSeconds / 3600;
  
  const hourProgress = goalHours > 0 ? Math.min(100, (totalHours / goalHours) * 100) : 0;
  
  const totalSubtopics = subject.subtopics.length;
  const completedSubtopics = subject.subtopics.filter(s => s.isCompleted).length;
  // Progress is 100% if subject is manually completed OR all goals met
  const isCompleted = subject.isCompleted;

  // Determine Color Status based on Hour Progress or Completion
  const getStatusColor = (p: number) => {
    if (isCompleted) return "bg-green-500";
    if (p >= 100) return "bg-green-500";
    if (p >= 50) return "bg-blue-500";
    if (p > 0) return "bg-orange-500";
    return "bg-zinc-200";
  };
  
  const getStatusText = (p: number) => {
      if (isCompleted) return "text-green-600";
      if (p >= 100) return "text-green-600";
      if (p >= 50) return "text-blue-600";
      if (p > 0) return "text-orange-600";
      return "text-zinc-400";
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-white border rounded-2xl overflow-hidden transition-all duration-300",
        isExpanded ? "border-indigo-200 shadow-md ring-1 ring-indigo-50" : "border-zinc-100 hover:border-zinc-200",
        isCompleted && "border-green-200 bg-green-50/20"
      )}
    >
      {/* Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 cursor-pointer flex items-center justify-between hover:bg-zinc-50/50 transition-colors"
      >
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-1">
             <div 
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateSubject(subject.id, { isCompleted: !subject.isCompleted });
                }}
                className={cn(
                  "w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer hover:scale-105",
                  isCompleted ? "bg-green-500 border-green-500" : "border-zinc-300 bg-white hover:border-green-400"
                )}
                title={isCompleted ? "Marcar como não concluído" : "Concluir Matéria"}
             >
                {isCompleted && <Check className="w-3.5 h-3.5 text-white" />}
             </div>
             <h4 className={cn("font-bold text-base truncate", isCompleted ? "text-green-700" : "text-zinc-900")}>
               {subject.title}
             </h4>
             {subject.tag && (
               <span className="text-[10px] px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded-full font-medium">
                 {subject.tag}
               </span>
             )}
          </div>
          
          <div className="flex items-center gap-4 text-xs ml-7">
             <div className="flex items-center gap-1.5 min-w-[100px]">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span className="font-medium text-zinc-700">
                  {totalHours.toFixed(1)}h <span className="text-zinc-400">/ {goalHours}h</span>
                </span>
             </div>
             <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
                <span className="font-medium text-zinc-700">
                  {completedSubtopics}/{totalSubtopics} tópicos
                </span>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
           {/* Mini Progress Circle or Bar */}
           <div className="flex flex-col items-end gap-1 min-w-[60px]">
              <span className={cn("text-xs font-bold", getStatusText(hourProgress))}>
                 {isCompleted ? "100%" : `${Math.round(hourProgress)}%`}
              </span>
              <div className="w-16 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                 <div 
                    className={cn("h-full rounded-full transition-all duration-500", getStatusColor(hourProgress))} 
                    style={{ width: `${isCompleted ? 100 : hourProgress}%` }}
                 />
              </div>
           </div>
           
           {isExpanded ? (
             <ChevronUp className="w-5 h-5 text-zinc-400" />
           ) : (
             <ChevronDown className="w-5 h-5 text-zinc-400" />
           )}
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-zinc-100 bg-zinc-50/30"
          >
            <div className="p-5 space-y-6">
               
               {/* Notes Section */}
               <div className="space-y-2">
                  <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                    <StickyNote className="w-3 h-3" /> Notas
                  </h5>
                  <textarea
                    value={subject.notes || ''}
                    onChange={(e) => onUpdateSubject(subject.id, { notes: e.target.value })}
                    placeholder="Adicione observações, links ou lembretes sobre esta matéria..."
                    className="w-full min-h-[80px] text-sm p-3 rounded-xl border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 resize-none"
                  />
               </div>

               {/* Subtopics Section */}
               <div>
                  <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <BookOpen className="w-3 h-3" /> Tópicos de Estudo
                  </h5>
                  <div className="space-y-2">
                    {subject.subtopics.length === 0 && (
                      <p className="text-sm text-zinc-400 italic">Nenhum tópico cadastrado.</p>
                    )}
                    {subject.subtopics.map(sub => (
                      <div 
                        key={sub.id} 
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group",
                          sub.isCompleted ? "bg-green-50/50 border-green-100" : "bg-white border-zinc-200 hover:border-indigo-200"
                        )}
                        onClick={() => onToggleSubtopic(subject.id, sub.id)}
                      >
                         <div className={cn(
                           "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                           sub.isCompleted ? "bg-green-500 border-green-500" : "border-zinc-300 group-hover:border-indigo-400"
                         )}>
                            {sub.isCompleted && <Check className="w-3 h-3 text-white" />}
                         </div>
                         <span className={cn(
                           "text-sm font-medium flex-1",
                           sub.isCompleted ? "text-zinc-400 line-through" : "text-zinc-700"
                         )}>{sub.title}</span>
                      </div>
                    ))}
                  </div>
               </div>

               {/* Sessions Log Section */}
               <div>
                  <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Clock className="w-3 h-3" /> Sessões Realizadas
                  </h5>
                  <div className="space-y-2">
                     {subjectSessions.length === 0 ? (
                       <p className="text-sm text-zinc-400 italic">Nenhuma sessão registrada neste mês.</p>
                     ) : (
                       subjectSessions.map(session => (
                         <div key={session.id} className="flex items-center justify-between text-sm p-3 bg-white rounded-xl border border-zinc-200">
                            <div className="flex items-center gap-3">
                               <div className={cn(
                                 "w-2 h-2 rounded-full",
                                 session.status === 'completed' ? "bg-green-400" : "bg-red-400"
                               )} />
                               <span className="text-zinc-700">
                                 {session.date.split('-').reverse().join('/')}
                               </span>
                               <span className="text-zinc-400">•</span>
                               <span className="font-medium text-zinc-900">
                                 {Math.floor(session.duration / 60)} min
                               </span>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "h-7 text-xs px-2",
                                session.status === 'completed' ? "text-green-600 hover:text-green-700" : "text-red-500 hover:text-red-600"
                              )}
                              onClick={() => onUpdateSessionStatus(session.id, session.status === 'completed' ? 'incomplete' : 'completed')}
                            >
                              {session.status === 'completed' ? 'Concluído' : 'Incompleto'}
                            </Button>
                         </div>
                       ))
                     )}
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};


const ScheduleTab = () => {
  const { 
    months, 
    subjects, 
    sessions, 
    scheduleSubject, 
    toggleSubtopic,
    updateSessionStatus,
    activeScheduleMonths,
    addActiveScheduleMonth,
    removeActiveScheduleMonth,
    updateSubject
  } = useStudyStore();
  
  const [viewingMonthId, setViewingMonthId] = useState<string | null>(null);
  const [managingMonthId, setManagingMonthId] = useState<string | null>(null);
  const [isAddingMonth, setIsAddingMonth] = useState(false);
  const [newMonthValue, setNewMonthValue] = useState(formatDate(new Date()).slice(0, 7));

  const calendarMonths = useMemo(() => {
    return activeScheduleMonths.map(monthStr => {
      const [year, month] = monthStr.split('-').map(Number);
      const date = new Date(year, month - 1, 1);
      return {
        name: MONTH_NAMES[month - 1],
        id: monthStr,
        date: date,
        year: year
      };
    }).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [activeScheduleMonths]);

  const getMonthStats = (monthId: string) => {
    const monthSubjects = subjects.filter(s => s.scheduledDate === monthId);
    let totalGoalHours = 0;
    let totalStudiedSeconds = 0;
    
    monthSubjects.forEach(sub => {
      totalGoalHours += (sub.weeklyGoal || 0) * 4;
    });

    sessions.forEach(sess => {
      if (sess.date.startsWith(monthId) && monthSubjects.find(s => s.id === sess.subjectId)) {
        totalStudiedSeconds += sess.duration;
      }
    });

    const totalStudiedHours = totalStudiedSeconds / 3600;
    // Calculate progress with a boost for completed subjects to make it feel more rewarding
    const rawProgress = totalGoalHours > 0 ? (totalStudiedHours / totalGoalHours) * 100 : 0;
    
    // Check for manually completed subjects
    const completedCount = monthSubjects.filter(s => s.isCompleted).length;
    const allCompleted = monthSubjects.length > 0 && completedCount === monthSubjects.length;

    return {
      subjectCount: monthSubjects.length,
      progress: allCompleted ? 100 : Math.min(100, rawProgress),
      totalGoalHours,
      totalStudiedHours
    };
  };

  const handleToggleSchedule = (subjectId: string, targetMonthId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (subject?.scheduledDate === targetMonthId) {
      scheduleSubject(subjectId, undefined);
    } else {
      scheduleSubject(subjectId, targetMonthId);
    }
  };

  const handleAddMonth = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMonthValue) {
      addActiveScheduleMonth(newMonthValue);
      setIsAddingMonth(false);
    }
  };

  const viewingMonthData = viewingMonthId ? calendarMonths.find(m => m.id === viewingMonthId) : null;
  const viewingMonthSubjects = viewingMonthId ? subjects.filter(s => s.scheduledDate === viewingMonthId) : [];
  const viewingMonthStats = viewingMonthId ? getMonthStats(viewingMonthId) : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
            <Calendar className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Cronograma Anual</h2>
            <p className="text-zinc-500 text-sm">Organize e acompanhe seu progresso mensal.</p>
          </div>
        </div>
        
        <Button onClick={() => setIsAddingMonth(true)} className="rounded-xl shadow-lg shadow-indigo-500/20">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Mês
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {calendarMonths.map((month) => {
          const stats = getMonthStats(month.id);
          const isCurrentMonth = format(new Date(), "yyyy-MM") === month.id;

          return (
            <motion.div 
              key={month.id}
              whileHover={{ y: -4 }}
              layout
              onClick={() => setViewingMonthId(month.id)}
              className={cn(
                "bg-white border rounded-3xl flex flex-col h-[280px] shadow-sm cursor-pointer overflow-hidden group relative transition-all",
                isCurrentMonth ? "border-indigo-200 ring-4 ring-indigo-50/50" : "border-zinc-200 hover:border-indigo-200 hover:shadow-lg"
              )}
            >
              {/* Card Header */}
              <div className={cn(
                "p-5 flex justify-between items-center",
                isCurrentMonth ? "bg-indigo-50/50" : "bg-zinc-50/30"
              )}>
                <div>
                   <span className={cn(
                     "font-bold text-lg capitalize block",
                     isCurrentMonth ? "text-indigo-900" : "text-zinc-700"
                   )}>{month.name}</span>
                   <span className="text-xs text-zinc-500 font-medium">{month.year}</span>
                   {isCurrentMonth && <span className="ml-2 text-[10px] font-bold text-indigo-500 bg-indigo-100 px-2 py-0.5 rounded-full uppercase tracking-wide">Atual</span>}
                </div>
                
                <div className="flex items-center gap-2">
                   <div className="w-10 h-10 rounded-full bg-white border border-zinc-100 flex items-center justify-center text-zinc-400 font-mono text-sm shadow-sm group-hover:scale-110 transition-transform">
                     {stats.subjectCount}
                   </div>
                   <div 
                    onClick={(e) => { e.stopPropagation(); removeActiveScheduleMonth(month.id); }}
                    className="w-8 h-8 rounded-full hover:bg-red-100 hover:text-red-500 flex items-center justify-center text-zinc-300 transition-colors opacity-0 group-hover:opacity-100"
                    title="Remover mês"
                   >
                     <Trash2 className="w-4 h-4" />
                   </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="flex-1 p-5 flex flex-col justify-between">
                
                {/* Visual Representation of Content */}
                <div className="space-y-2">
                   {stats.subjectCount === 0 ? (
                      <div className="text-center py-6">
                         <Circle className="w-12 h-12 text-zinc-100 mx-auto mb-2" />
                         <p className="text-xs text-zinc-400">Sem planejamento</p>
                      </div>
                   ) : (
                      <div className="flex flex-wrap gap-1.5 content-start h-[100px] overflow-hidden mask-gradient-b">
                         {Array.from({length: Math.min(12, stats.subjectCount)}).map((_, i) => (
                            <div key={i} className="w-2 h-2 rounded-full bg-indigo-400 opacity-80" />
                         ))}
                         {stats.subjectCount > 12 && <div className="w-2 h-2 rounded-full bg-zinc-200 text-[6px] flex items-center justify-center">+</div>}
                      </div>
                   )}
                </div>

                {/* Progress Footer */}
                <div>
                   <div className="flex justify-between text-xs font-medium text-zinc-500 mb-2">
                      <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Progresso</span>
                      <span className={cn(stats.progress > 0 ? "text-indigo-600" : "text-zinc-400")}>{Math.round(stats.progress)}%</span>
                   </div>
                   <Progress value={stats.progress} className="h-1.5 bg-zinc-100" />
                </div>
              </div>

              {/* Hover Action */}
              <div className="absolute top-[80px] right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                 <div className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-indigo-600">
                    <ArrowRight className="w-4 h-4" />
                 </div>
              </div>
            </motion.div>
          );
        })}

        {/* Empty State / Add Action Card */}
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsAddingMonth(true)}
            className="border-2 border-dashed border-zinc-200 rounded-3xl flex flex-col items-center justify-center h-[280px] text-zinc-400 hover:text-indigo-500 hover:border-indigo-300 hover:bg-indigo-50/10 transition-all gap-4"
        >
            <div className="w-16 h-16 rounded-full bg-zinc-50 flex items-center justify-center">
                <Plus className="w-8 h-8" />
            </div>
            <span className="font-medium">Adicionar Planejamento</span>
        </motion.button>
      </div>

      {/* Add Month Modal */}
      <AnimatePresence>
        {isAddingMonth && (
            <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-sm p-4"
            onClick={() => setIsAddingMonth(false)}
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
                   <h3 className="font-bold text-xl text-zinc-900">Novo Mês</h3>
                   <p className="text-sm text-zinc-500">Selecione o mês para planejar.</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsAddingMonth(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <form onSubmit={handleAddMonth} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Mês e Ano</label>
                    <input 
                        type="month" 
                        value={newMonthValue}
                        onChange={(e) => setNewMonthValue(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 text-base focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        required
                    />
                 </div>

                 <Button type="submit" className="w-full h-12 text-base">Adicionar</Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Month Detail Modal */}
      <AnimatePresence>
        {viewingMonthId && viewingMonthData && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-md p-4"
            onClick={() => setViewingMonthId(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-[2rem] p-0 max-w-4xl w-full shadow-2xl border border-zinc-100 max-h-[90vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-8 pb-4 bg-white border-b border-zinc-50 flex justify-between items-start shrink-0 z-10">
                 <div>
                    <h2 className="text-3xl font-bold text-zinc-900 capitalize flex items-center gap-3">
                       {viewingMonthData.name}
                       <span className="text-lg text-zinc-400 font-normal">{viewingMonthData.year}</span>
                    </h2>
                    
                    {viewingMonthStats && (
                      <div className="flex items-center gap-6 mt-3 text-sm text-zinc-500">
                         <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-indigo-500" />
                            <span className="font-medium text-zinc-700">{viewingMonthStats.subjectCount}</span> matérias
                         </div>
                         <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-orange-500" />
                            <span className="font-medium text-zinc-700">{viewingMonthStats.totalStudiedHours.toFixed(1)}h</span> estudadas
                         </div>
                         <div className="flex items-center gap-2">
                             <div className="w-20 h-2 bg-zinc-100 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 transition-all duration-700" style={{width: `${viewingMonthStats.progress}%`}} />
                             </div>
                             <span className="font-bold text-zinc-900">{Math.round(viewingMonthStats.progress)}%</span>
                         </div>
                      </div>
                    )}
                 </div>
                 
                 <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => { setManagingMonthId(viewingMonthId); setViewingMonthId(null); }}
                      className="rounded-xl border-zinc-200 hover:bg-zinc-50 text-zinc-700"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Gerenciar Matérias
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setViewingMonthId(null)} className="rounded-full hover:bg-zinc-100">
                      <X className="w-6 h-6 text-zinc-400" />
                    </Button>
                 </div>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="flex-1 overflow-y-auto p-8 bg-zinc-50/50">
                 <div className="space-y-4">
                    {viewingMonthSubjects.length === 0 ? (
                       <div className="flex flex-col items-center justify-center py-20 text-center">
                          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                             <Calendar className="w-8 h-8 text-zinc-300" />
                          </div>
                          <h3 className="text-lg font-bold text-zinc-900">Mês Livre</h3>
                          <p className="text-zinc-500 max-w-xs mt-2 mb-6">Você ainda não agendou nenhuma matéria para este mês.</p>
                          <Button onClick={() => { setManagingMonthId(viewingMonthId); setViewingMonthId(null); }}>
                             <Plus className="w-4 h-4 mr-2" />
                             Adicionar Matérias
                          </Button>
                       </div>
                    ) : (
                       <div className="grid grid-cols-1 gap-4">
                          {viewingMonthSubjects.map(subject => (
                             <ScheduleSubjectCard 
                                key={subject.id}
                                subject={subject}
                                monthId={viewingMonthId}
                                sessions={sessions}
                                onToggleSubtopic={toggleSubtopic}
                                onUpdateSessionStatus={updateSessionStatus}
                                onUpdateSubject={updateSubject}
                             />
                          ))}
                       </div>
                    )}
                 </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selection Modal (Manage Subjects) */}
      <AnimatePresence>
        {managingMonthId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-sm p-4"
            onClick={() => setManagingMonthId(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-zinc-100 max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6 shrink-0">
                <div>
                    <h3 className="font-bold text-xl text-zinc-900 capitalize">
                        Planejamento de {calendarMonths.find(m => m.id === managingMonthId)?.name}
                    </h3>
                    <p className="text-zinc-500 text-sm">Marque as matérias para estudar neste mês.</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setManagingMonthId(null)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                {months.length === 0 && <p className="text-zinc-400 text-center py-10">Crie provas na aba 'Provas' primeiro.</p>}
                
                {months.map(exam => {
                    const examSubjects = subjects.filter(s => s.monthId === exam.id);
                    if(examSubjects.length === 0) return null;

                    return (
                        <div key={exam.id} className="space-y-3">
                            <h4 className="font-bold text-zinc-800 text-sm flex items-center gap-2 bg-zinc-50 p-2 rounded-lg sticky top-0 z-10 backdrop-blur-sm bg-zinc-50/90">
                                <ArrowRight className="w-3 h-3 text-zinc-400" />
                                {exam.name}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2">
                                {examSubjects.map(sub => {
                                    const isSelected = sub.scheduledDate === managingMonthId;
                                    const isScheduledElsewhere = sub.scheduledDate && sub.scheduledDate !== managingMonthId;
                                    
                                    return (
                                        <div 
                                            key={sub.id}
                                            onClick={() => handleToggleSchedule(sub.id, managingMonthId!)}
                                            className={cn(
                                                "p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between group",
                                                isSelected 
                                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200" 
                                                    : isScheduledElsewhere
                                                        ? "bg-zinc-100 border-zinc-200 text-zinc-500"
                                                        : "bg-white border-zinc-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-zinc-800"
                                            )}
                                        >
                                            <div className="overflow-hidden">
                                                <p className={cn("font-medium text-sm truncate", isSelected ? "text-white" : "text-zinc-800")}>{sub.title}</p>
                                                {isScheduledElsewhere && (
                                                    <p className="text-[10px] mt-0.5 text-zinc-400">
                                                        Em {calendarMonths.find(m => m.id === sub.scheduledDate)?.name || 'Outro Mês'}
                                                    </p>
                                                )}
                                            </div>
                                            {isSelected && <Check className="w-4 h-4 shrink-0 text-white" />}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
              </div>
              
              <div className="pt-4 border-t border-zinc-100 mt-4 flex justify-between shrink-0">
                  <Button variant="ghost" onClick={() => { setViewingMonthId(managingMonthId); setManagingMonthId(null); }}>
                    Voltar para Detalhes
                  </Button>
                  <Button onClick={() => { setViewingMonthId(managingMonthId); setManagingMonthId(null); }}>
                    Salvar e Visualizar
                  </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScheduleTab;
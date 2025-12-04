
import React, { useState, useMemo, useEffect } from "react";
import { useStudyStore } from "../../hooks/useStudyStore";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Plus, X, ArrowRight, Check, BookOpen, ChevronDown, ChevronUp, Clock, AlertCircle, CheckCircle2, Circle, Edit3, TrendingUp, MoreHorizontal, StickyNote, Trash2, CalendarDays, List, LayoutGrid, CheckSquare, Maximize2, Copy, Wand2, RefreshCw, Save, Settings2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Progress } from "../ui/progress";
import { cn, formatDate } from "../../lib/utils";
import { Session, Subject, Subtopic, SubjectSchedule } from "../../types";
import { getDay, getDaysInMonth, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// --- Helper Functions ---

const getPlannedDurationSeconds = (subject: Subject, monthId: string): number => {
  const sched = subject.schedules?.[monthId];
  if (!sched || !sched.monthlyGoal || !sched.plannedDays || sched.plannedDays.length === 0) return 3600; // default 1h
  // Return average seconds per planned day
  return Math.floor((sched.monthlyGoal * 3600) / sched.plannedDays.length);
};

// --- Auto Distribution Modal ---

interface AutoDistributeModalProps {
  monthId: string;
  subjects: Subject[];
  onClose: () => void;
  onSave: (distribution: Record<string, string[]>) => void;
}

const AutoDistributeModal: React.FC<AutoDistributeModalProps> = ({ monthId, subjects, onClose, onSave }) => {
  const [step, setStep] = useState<'config' | 'preview'>('config');
  
  // Config State
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
  const [subjectsPerDay, setSubjectsPerDay] = useState(3);
  
  // Preview State
  const [distribution, setDistribution] = useState<Record<string, string[]>>({}); // DateStr -> SubjectIDs[]

  // Month Data
  const monthDates = useMemo(() => {
    const [year, month] = monthId.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return eachDayOfInterval({ start, end });
  }, [monthId]);

  const availableDates = useMemo(() => {
    return monthDates.filter(d => selectedWeekdays.includes(getDay(d)));
  }, [monthDates, selectedWeekdays]);

  const totalGoalHours = useMemo(() => {
    return subjects.reduce((acc, s) => acc + (s.schedules?.[monthId]?.monthlyGoal || 0), 0);
  }, [subjects, monthId]);

  // Generation Logic
  const handleGenerate = () => {
    const newDist: Record<string, string[]> = {};
    const validSubjects = subjects.filter(s => (s.schedules?.[monthId]?.monthlyGoal || 0) > 0);
    
    if (availableDates.length === 0 || validSubjects.length === 0) {
      setDistribution({});
      setStep('preview');
      return;
    }

    // Initialize map
    monthDates.forEach(d => {
      newDist[formatDate(d)] = [];
    });

    // Calculate slots
    const totalSlots = availableDates.length * subjectsPerDay;
    
    // Assign slots per subject proportional to goal
    const subjectSlots = validSubjects.map(s => {
       const goal = s.schedules?.[monthId]?.monthlyGoal || 0;
       const share = goal / totalGoalHours;
       const slots = Math.round(share * totalSlots);
       return { id: s.id, slots, goal };
    });

    // Sort by most slots to distribute them first (better spacing)
    subjectSlots.sort((a, b) => b.slots - a.slots);

    // Distribution Algorithm (Round Robin with Stride)
    subjectSlots.forEach((sub, index) => {
      if (sub.slots <= 0) return;
      
      // Calculate ideal stride to space out this subject
      // e.g., if needed on 5 days out of 20, stride is 4.
      const stride = Math.max(1, availableDates.length / sub.slots);
      
      // Offset start based on subject index to prevent stacking all on Day 1
      let currentPos = index % availableDates.length;
      
      let assignedCount = 0;
      let attempts = 0; // Breaker

      while (assignedCount < sub.slots && attempts < availableDates.length * 2) {
         const dateIdx = Math.floor(currentPos) % availableDates.length;
         const dateStr = formatDate(availableDates[dateIdx]);

         // Try to assign if space permits
         if (newDist[dateStr].length < subjectsPerDay) {
            if (!newDist[dateStr].includes(sub.id)) {
                newDist[dateStr].push(sub.id);
                assignedCount++;
            }
         }
         
         currentPos += stride;
         attempts++;
      }
    });

    setDistribution(newDist);
    setStep('preview');
  };

  const toggleAssignment = (dateStr: string, subjectId: string) => {
    setDistribution(prev => {
      const current = prev[dateStr] || [];
      const exists = current.includes(subjectId);
      const updated = exists 
        ? current.filter(id => id !== subjectId)
        : [...current, subjectId];
      return { ...prev, [dateStr]: updated };
    });
  };

  const handleConfirm = () => {
    // Invert the map: Date->Subjects to Subject->Dates
    const subjectUpdates: Record<string, string[]> = {};
    
    subjects.forEach(s => subjectUpdates[s.id] = []);

    Object.entries(distribution).forEach(([dateStr, subIds]) => {
      subIds.forEach(subId => {
        if (!subjectUpdates[subId]) subjectUpdates[subId] = [];
        subjectUpdates[subId].push(dateStr);
      });
    });

    onSave(subjectUpdates);
    onClose();
  };

  const getEstimatedDailyHours = (dateStr: string) => {
     const subIds = distribution[dateStr] || [];
     if (subIds.length === 0) return 0;
     
     let total = 0;
     subIds.forEach(id => {
        // Find subject
        const sub = subjects.find(s => s.id === id);
        // Find how many days this subject is assigned to in TOTAL in the PREVIEW
        let assignedDaysCount = 0;
        Object.values(distribution).forEach(dayList => {
           if (dayList.includes(id)) assignedDaysCount++;
        });
        
        const goal = sub?.schedules?.[monthId]?.monthlyGoal || 0;
        const duration = assignedDaysCount > 0 ? goal / assignedDaysCount : 0;
        total += duration;
     });
     return total;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-zinc-950/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-zinc-100 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-white z-10">
           <div>
              <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                 <Wand2 className="w-5 h-5 text-indigo-500" />
                 Distribuição Inteligente
              </h3>
              <p className="text-sm text-zinc-500">
                {step === 'config' ? 'Configure como deseja distribuir suas horas.' : 'Revise e ajuste a distribuição gerada.'}
              </p>
           </div>
           <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>

        <div className="flex-1 overflow-y-auto bg-zinc-50/50 p-6">
           {step === 'config' ? (
              <div className="max-w-lg mx-auto space-y-8">
                 <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
                    <h4 className="font-bold text-zinc-900 flex items-center gap-2">
                       <CalendarDays className="w-4 h-4 text-zinc-400" /> Dias de Estudo
                    </h4>
                    <div className="grid grid-cols-7 gap-2">
                       {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => {
                          const isSelected = selectedWeekdays.includes(i);
                          return (
                             <button
                                key={i}
                                onClick={() => setSelectedWeekdays(prev => 
                                   prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i]
                                )}
                                className={cn(
                                   "aspect-square rounded-xl text-sm font-bold flex items-center justify-center transition-all",
                                   isSelected ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200"
                                )}
                             >
                                {d}
                             </button>
                          );
                       })}
                    </div>
                    <p className="text-xs text-zinc-400">Selecione os dias da semana disponíveis.</p>
                 </div>

                 <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
                    <h4 className="font-bold text-zinc-900 flex items-center gap-2">
                       <LayoutGrid className="w-4 h-4 text-zinc-400" /> Intensidade
                    </h4>
                    <div className="space-y-2">
                       <div className="flex justify-between text-sm">
                          <span className="text-zinc-500">Matérias por dia</span>
                          <span className="font-bold text-indigo-600">{subjectsPerDay}</span>
                       </div>
                       <input 
                          type="range" 
                          min="1" 
                          max="8" 
                          step="1"
                          value={subjectsPerDay}
                          onChange={(e) => setSubjectsPerDay(parseInt(e.target.value))}
                          className="w-full accent-indigo-600 h-2 bg-zinc-100 rounded-lg appearance-none cursor-pointer"
                       />
                       <div className="flex justify-between text-[10px] text-zinc-400 font-medium">
                          <span>Foco Único</span>
                          <span>Diversificado</span>
                       </div>
                    </div>
                 </div>

                 <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                    <div className="text-sm text-indigo-900">
                       <span className="block font-bold">Resumo do Mês</span>
                       <span className="opacity-80">{totalGoalHours}h Totais • {availableDates.length} Dias Úteis</span>
                    </div>
                    <div className="text-right">
                       <span className="block text-2xl font-bold text-indigo-600">
                          ~{(totalGoalHours / availableDates.length).toFixed(1)}h
                       </span>
                       <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Por Dia</span>
                    </div>
                 </div>
              </div>
           ) : (
              <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                    {/* Weekday Headers */}
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d,i) => (
                       <div key={i} className="hidden md:block text-center text-xs font-bold text-zinc-400 uppercase mb-2">{d}</div>
                    ))}

                    {/* Empty cells for start padding */}
                    {Array.from({ length: getDay(monthDates[0]) }).map((_, i) => (
                       <div key={`pad-${i}`} className="hidden md:block" />
                    ))}

                    {monthDates.map(date => {
                       const dateStr = formatDate(date);
                       const assignedIds = distribution[dateStr] || [];
                       const dailyHours = getEstimatedDailyHours(dateStr);
                       const isSelected = selectedWeekdays.includes(getDay(date));
                       
                       return (
                          <div 
                             key={dateStr}
                             className={cn(
                                "min-h-[100px] bg-white rounded-xl border p-2 flex flex-col gap-1 transition-all",
                                isSelected ? "border-zinc-200" : "border-zinc-100 bg-zinc-50/50 opacity-60"
                             )}
                          >
                             <div className="flex justify-between items-start mb-1">
                                <span className={cn("text-sm font-bold", isSelected ? "text-zinc-700" : "text-zinc-400")}>
                                   {date.getDate()}
                                </span>
                                {assignedIds.length > 0 && (
                                   <span className="text-[9px] font-bold text-indigo-400 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                                      ~{dailyHours.toFixed(1)}h
                                   </span>
                                )}
                             </div>

                             <div className="flex-1 flex flex-col gap-1">
                                {assignedIds.map(subId => {
                                   const sub = subjects.find(s => s.id === subId);
                                   if (!sub) return null;
                                   return (
                                      <div 
                                         key={subId} 
                                         onClick={() => toggleAssignment(dateStr, subId)}
                                         className="text-[10px] bg-zinc-100 px-2 py-1 rounded-md text-zinc-700 truncate cursor-pointer hover:bg-red-50 hover:text-red-600 transition-colors flex items-center justify-between group"
                                      >
                                         <span className="truncate">{sub.title}</span>
                                         <X className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100" />
                                      </div>
                                   );
                                })}
                                {/* Add Button */}
                                {isSelected && (
                                   <div className="relative group">
                                      <button className="w-full text-[10px] text-zinc-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-md py-1 border border-dashed border-zinc-200 hover:border-indigo-200 flex items-center justify-center gap-1 transition-all">
                                         <Plus className="w-2.5 h-2.5" /> Add
                                      </button>
                                      {/* Simple Dropdown for adding (Hidden by default, shown on hover/focus could be tricky in grid, simplified to click rotation or just show standard UI) */}
                                      {/* For simplicity in this demo, let's make the Add button cycle through unassigned subjects or open a small dialog. 
                                          Given complexity constraints, let's just make it cycle through missing subjects? No, too unpredictable.
                                          Let's use a native select overlaid? Or just a simple click handler that adds the first available subject.
                                          Better: Click opens a small absolute list.
                                      */}
                                      <select 
                                         className="absolute inset-0 opacity-0 cursor-pointer"
                                         value=""
                                         onChange={(e) => {
                                            if(e.target.value) toggleAssignment(dateStr, e.target.value);
                                         }}
                                      >
                                         <option value="">Adicionar...</option>
                                         {subjects.filter(s => !assignedIds.includes(s.id)).map(s => (
                                            <option key={s.id} value={s.id}>{s.title}</option>
                                         ))}
                                      </select>
                                   </div>
                                )}
                             </div>
                          </div>
                       );
                    })}
                 </div>
              </div>
           )}
        </div>

        <div className="p-6 border-t border-zinc-100 bg-white flex justify-between z-10">
           {step === 'config' ? (
              <>
                 <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                 <Button onClick={handleGenerate} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8">
                    Gerar Cronograma <ArrowRight className="w-4 h-4 ml-2" />
                 </Button>
              </>
           ) : (
              <>
                 <Button variant="ghost" onClick={() => setStep('config')}>
                    <Settings2 className="w-4 h-4 mr-2" /> Reconfigurar
                 </Button>
                 <div className="flex gap-3">
                    <Button variant="outline" onClick={handleGenerate}>
                       <RefreshCw className="w-4 h-4 mr-2" /> Regenerar
                    </Button>
                    <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700 text-white px-8">
                       <Save className="w-4 h-4 mr-2" /> Salvar Alterações
                    </Button>
                 </div>
              </>
           )}
        </div>
      </motion.div>
    </motion.div>
  );
};


// --- Components ---

interface ScheduleSubjectCardProps {
  subject: Subject;
  monthId: string;
  scheduleData: SubjectSchedule; // Data specific to this month
  sessions: Session[];
  onToggleSubtopic: (subjectId: string, subtopicId: string) => void;
  onUpdateSessionStatus: (sessionId: string, status: 'completed' | 'incomplete') => void;
  onUpdateSubjectSchedule: (id: string, monthId: string, updates: Partial<SubjectSchedule>) => void;
  onTogglePlannedDay: (subjectId: string, monthId: string, dateStr: string) => void;
}

const ScheduleSubjectCard: React.FC<ScheduleSubjectCardProps> = ({ 
  subject, 
  monthId,
  scheduleData, 
  sessions, 
  onToggleSubtopic,
  onUpdateSessionStatus,
  onUpdateSubjectSchedule,
  onTogglePlannedDay
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Stats Calculation for this specific month
  const goalHours = scheduleData.monthlyGoal || 0;
  
  const isCompleted = scheduleData.isCompleted;

  // Planning Calculations
  const plannedDays = scheduleData.plannedDays || [];
  const hoursPerDay = plannedDays.length > 0 && goalHours > 0 
    ? (goalHours / plannedDays.length).toFixed(1) 
    : "0";

  // Generate Calendar Days for Planning
  const calendarGrid = useMemo(() => {
    const [year, month] = monthId.split('-').map(Number);
    const startMonthDate = new Date(year, month - 1, 1);
    const endMonthDate = new Date(year, month, 0);
    
    // Calculate padding days to fill the grid
    const startDay = startMonthDate.getDay(); // 0 is Sunday
    const startDate = new Date(startMonthDate);
    startDate.setDate(startMonthDate.getDate() - startDay);
    
    const endDay = endMonthDate.getDay();
    const endDate = new Date(endMonthDate);
    endDate.setDate(endMonthDate.getDate() + (6 - endDay));
    
    const days: Date[] = [];
    let current = new Date(startDate);
    
    while (current <= endDate) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }
    return days;
  }, [monthId]);

  return (
    <>
      {/* Compact Card (Grid Item) */}
      <motion.div 
        layout
        onClick={() => setIsExpanded(true)}
        className={cn(
          "bg-white border rounded-lg overflow-hidden transition-all duration-300 flex flex-col cursor-pointer group hover:shadow-md",
          "border-zinc-200 hover:border-indigo-300",
          isCompleted && "border-green-200 bg-green-50/10"
        )}
      >
        {/* Header */}
        <div className={cn(
          "px-3 py-2 flex items-center justify-between border-b transition-colors",
           isCompleted ? "bg-green-50/30 border-green-100" : "bg-zinc-50/50 border-zinc-100 group-hover:bg-indigo-50/30"
        )}>
           <div className="flex-1 min-w-0 flex items-center gap-2">
              <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateSubjectSchedule(subject.id, monthId, { isCompleted: !isCompleted });
                  }}
                  className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer shrink-0",
                    isCompleted ? "bg-green-500 border-green-500" : "border-zinc-300 bg-white hover:border-green-400"
                  )}
              >
                  {isCompleted && <Check className="w-3 h-3 text-white" />}
              </div>
              <h4 className={cn("font-bold text-xs truncate leading-tight", isCompleted ? "text-green-800" : "text-zinc-900")}>
                {subject.title}
              </h4>
           </div>
           <Maximize2 className="w-3 h-3 text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Body: Compact List */}
        <div className="p-3 bg-white flex-1 min-h-[60px]">
           {subject.subtopics.length === 0 ? (
              <p className="text-[10px] text-zinc-300 italic">Sem tópicos cadastrados</p>
           ) : (
              <ul className="space-y-1.5">
                 {subject.subtopics.slice(0, 5).map(st => (
                   <li key={st.id} className="flex items-start gap-1.5 text-[10px] leading-tight text-zinc-600">
                      <span className={cn("w-1 h-1 rounded-full mt-1 shrink-0", st.isCompleted ? "bg-green-400" : "bg-zinc-300")} />
                      <span className={cn("truncate", st.isCompleted ? "text-zinc-400 line-through" : "text-zinc-600")}>
                        {st.title}
                      </span>
                   </li>
                 ))}
                 {subject.subtopics.length > 5 && (
                    <li className="text-[9px] text-zinc-400 pl-2.5">+ {subject.subtopics.length - 5} tópicos</li>
                 )}
              </ul>
           )}
        </div>
        
        {/* Footer info */}
        <div className="px-3 py-1.5 border-t border-zinc-50 bg-zinc-50/30 flex justify-between items-center">
            <span className="text-[9px] text-zinc-400 flex items-center gap-1">
               <CalendarDays className="w-2.5 h-2.5" />
               {plannedDays.length} dias
            </span>
            {goalHours > 0 && <span className="text-[9px] font-medium text-indigo-600">{goalHours}h meta</span>}
        </div>
      </motion.div>

      {/* Expanded Modal (Fixed Overlay) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/40 backdrop-blur-sm p-4"
            onClick={() => setIsExpanded(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col md:flex-row ring-1 ring-zinc-950/5"
              onClick={(e) => e.stopPropagation()}
            >
               {/* Left Column: Details & Notes */}
               <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-zinc-100 min-h-[300px] md:h-auto">
                  {/* Header */}
                  <div className="p-5 border-b border-zinc-100 flex items-start gap-3 bg-zinc-50/50">
                      <div 
                          onClick={() => onUpdateSubjectSchedule(subject.id, monthId, { isCompleted: !isCompleted })}
                          className={cn(
                            "w-6 h-6 mt-0.5 rounded-lg border flex items-center justify-center transition-all cursor-pointer shrink-0",
                            isCompleted ? "bg-green-500 border-green-500" : "border-zinc-300 bg-white hover:border-green-400"
                          )}
                      >
                          {isCompleted && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <div className="flex-1">
                          <h3 className={cn("text-xl font-bold leading-tight", isCompleted ? "text-green-800" : "text-zinc-900")}>
                            {subject.title}
                          </h3>
                          <div className="flex gap-2 mt-1">
                             <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", isCompleted ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500")}>
                                {isCompleted ? "Concluído" : "Em andamento"}
                             </span>
                          </div>
                      </div>
                  </div>

                  {/* Subtopics List */}
                  <div className="flex-1 overflow-y-auto p-5">
                      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <List className="w-3 h-3" /> Tópicos ({subject.subtopics.length})
                      </h4>
                      {subject.subtopics.length === 0 ? (
                        <div className="text-zinc-400 text-sm italic p-4 text-center border border-dashed border-zinc-200 rounded-lg">
                           Sem subtópicos. Adicione na aba "Assuntos".
                        </div>
                      ) : (
                        <ul className="space-y-1">
                          {subject.subtopics.map(st => (
                            <li key={st.id} className="group flex items-start gap-3 p-2 rounded-lg hover:bg-zinc-50 transition-colors">
                               <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0 transition-colors", st.isCompleted ? "bg-green-500" : "bg-zinc-300")} />
                               <span className={cn("text-sm leading-relaxed transition-colors", st.isCompleted ? "text-zinc-400 line-through" : "text-zinc-700 font-medium")}>
                                 {st.title}
                               </span>
                            </li>
                          ))}
                        </ul>
                      )}
                  </div>

                  {/* Notes Section (Pinned to Bottom of Left Col) */}
                  <div className="p-5 bg-zinc-50 border-t border-zinc-100">
                      <div className="flex items-center gap-2 mb-2">
                         <StickyNote className="w-3.5 h-3.5 text-zinc-400" />
                         <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Anotações</span>
                      </div>
                      <textarea
                        value={scheduleData.notes || ''}
                        onChange={(e) => onUpdateSubjectSchedule(subject.id, monthId, { notes: e.target.value })}
                        className="w-full h-24 text-sm p-3 rounded-xl border border-zinc-200 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white shadow-sm"
                        placeholder="Escreva observações, dúvidas ou lembretes aqui..."
                      />
                  </div>
               </div>

               {/* Right Column: Calendar & Planning */}
               <div className="w-full md:w-[380px] bg-zinc-50/50 flex flex-col h-full overflow-y-auto">
                  <div className="p-5 flex items-center justify-between border-b border-zinc-100 bg-white">
                      <span className="font-bold text-zinc-900 flex items-center gap-2">
                         <Calendar className="w-4 h-4 text-indigo-600" /> Planejamento
                      </span>
                      <Button variant="ghost" size="icon" onClick={() => setIsExpanded(false)} className="h-8 w-8 -mr-2">
                         <X className="w-4 h-4" />
                      </Button>
                  </div>

                  <div className="p-5 space-y-6">
                     {/* Goal Input */}
                     <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm space-y-3">
                        <div className="flex justify-between items-center">
                           <label className="text-xs font-bold text-zinc-500 uppercase">Meta Mensal (Horas)</label>
                           <Clock className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div className="flex items-center gap-3">
                           <Input 
                              type="number"
                              className="flex-1 text-lg font-bold h-12 bg-zinc-50 border-zinc-200 text-center"
                              value={scheduleData.monthlyGoal || 0}
                              onChange={(e) => onUpdateSubjectSchedule(subject.id, monthId, { monthlyGoal: parseInt(e.target.value) || 0 })}
                           />
                           <div className="text-xs text-zinc-400 font-medium w-20 leading-tight">
                              ~{hoursPerDay}h <br/> por dia
                           </div>
                        </div>
                     </div>

                     {/* Calendar Grid */}
                     <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                           <span className="text-xs font-bold text-zinc-500 uppercase">Dias de Estudo</span>
                           <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md font-bold">
                              {plannedDays.length} selecionados
                           </span>
                        </div>
                        
                        <div className="grid grid-cols-7 gap-1 text-center mb-2">
                            {['D','S','T','Q','Q','S','S'].map((d, i) => (
                              <span key={i} className="text-[10px] font-bold text-zinc-400">{d}</span>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1.5">
                             {calendarGrid.map((day, i) => {
                                const dateStr = formatDate(day);
                                const isSelected = plannedDays.includes(dateStr);
                                const isCurrentMonth = dateStr.startsWith(monthId);
                                
                                if (!isCurrentMonth) return <div key={i} />;

                                return (
                                   <motion.div 
                                      key={i}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => onTogglePlannedDay(subject.id, monthId, dateStr)}
                                      className={cn(
                                         "aspect-square rounded-lg flex items-center justify-center text-xs font-medium cursor-pointer transition-all border",
                                         isSelected 
                                           ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200" 
                                           : "bg-zinc-50 border-transparent text-zinc-500 hover:bg-white hover:border-zinc-300"
                                      )}
                                   >
                                      {day.getDate()}
                                   </motion.div>
                                );
                             })}
                        </div>
                     </div>

                     <div className="text-center">
                        <p className="text-xs text-zinc-400">
                           Clique nos dias acima para agendar sessões de estudo para esta matéria.
                        </p>
                     </div>
                  </div>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// --- Summary View Component ---

interface SummaryMonthProps {
  monthId: string;
  monthName: string;
  year: number;
  subjects: Subject[];
  sessions: Session[];
  onToggleDayCompletion: (subjectId: string, date: string, isDone: boolean) => void;
}

const SummaryMonthItem: React.FC<SummaryMonthProps> = ({ monthId, monthName, year, subjects, sessions, onToggleDayCompletion }) => {
  const [expanded, setExpanded] = useState(false);

  // Aggregate Data
  const plannedEvents = useMemo(() => {
    const events: { date: string; subject: Subject; isDone: boolean }[] = [];
    let totalPlannedHours = 0;
    
    subjects.forEach(sub => {
      const sched = sub.schedules?.[monthId];
      if (sched) {
        totalPlannedHours += sched.monthlyGoal || 0;
        if (sched.plannedDays) {
          sched.plannedDays.forEach(date => {
             // Check if session exists
             const done = sessions.some(s => s.subjectId === sub.id && s.date === date && s.status === 'completed');
             events.push({ date, subject: sub, isDone: done });
          });
        }
      }
    });

    // Group by Date
    const grouped: Record<string, typeof events> = {};
    events.forEach(e => {
       if (!grouped[e.date]) grouped[e.date] = [];
       grouped[e.date].push(e);
    });

    // Sort Dates
    const sortedDates = Object.keys(grouped).sort();
    
    return { 
       sortedDates, 
       grouped, 
       totalPlannedHours 
    };
  }, [subjects, sessions, monthId]);

  // Calculate actual progress
  const studiedSeconds = sessions
    .filter(s => s.date.startsWith(monthId) && s.status === 'completed')
    .reduce((acc, s) => acc + s.duration, 0);
  const studiedHours = studiedSeconds / 3600;
  
  const progress = plannedEvents.totalPlannedHours > 0 
    ? Math.min(100, (studiedHours / plannedEvents.totalPlannedHours) * 100) 
    : 0;

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div 
         onClick={() => setExpanded(!expanded)}
         className="p-5 cursor-pointer flex items-center justify-between hover:bg-zinc-50/50"
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-bold text-lg text-zinc-900 capitalize">{monthName}</h3>
            <span className="text-sm text-zinc-400 font-medium">{year}</span>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-medium">
             <span className="text-zinc-500">
                {plannedEvents.sortedDates.length} dias c/ estudo
             </span>
             <span className="text-zinc-300">|</span>
             <div className="flex items-center gap-1.5">
               <span className={cn(progress >= 100 ? "text-green-600" : "text-indigo-600")}>
                 {studiedHours.toFixed(1)}h
               </span>
               <span className="text-zinc-400">/ {plannedEvents.totalPlannedHours}h planejadas</span>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="w-24 hidden sm:block">
              <Progress value={progress} className={cn("h-2", progress >= 100 ? "bg-green-100" : "bg-zinc-100")} />
           </div>
           {expanded ? <ChevronUp className="text-zinc-400" /> : <ChevronDown className="text-zinc-400" />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div 
             initial={{ height: 0 }} 
             animate={{ height: "auto" }} 
             exit={{ height: 0 }} 
             className="border-t border-zinc-100 bg-zinc-50/30"
          >
             <div className="p-6 space-y-6">
                {plannedEvents.sortedDates.length === 0 ? (
                   <p className="text-center text-zinc-400 py-4 text-sm">Nenhum estudo agendado para este mês.</p>
                ) : (
                   <div className="space-y-6 relative">
                      {/* Timeline Line */}
                      <div className="absolute left-[19px] top-2 bottom-2 w-[2px] bg-zinc-200" />
                      
                      {plannedEvents.sortedDates.map(dateStr => {
                         const items = plannedEvents.grouped[dateStr];
                         const dateObj = new Date(dateStr + 'T12:00:00'); // Fix timezone offset
                         const dayName = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' });
                         const dayNum = dateObj.getDate();
                         
                         // Check if all items for this day are done
                         const allDone = items.every(i => i.isDone);

                         return (
                            <div key={dateStr} className="relative pl-10">
                               {/* Timeline Dot */}
                               <div className={cn(
                                 "absolute left-[11px] top-1 w-[18px] h-[18px] rounded-full border-[3px] bg-white z-10",
                                 allDone ? "border-green-500" : "border-indigo-400"
                               )} />
                               
                               <div className="flex items-baseline gap-2 mb-2">
                                  <span className="font-bold text-zinc-900 text-sm">{dayNum}</span>
                                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{dayName}</span>
                               </div>

                               <div className="space-y-2">
                                  {items.map((item, idx) => (
                                     <div 
                                        key={idx} 
                                        className={cn(
                                          "flex items-center justify-between p-3 rounded-xl border bg-white transition-all",
                                          item.isDone ? "border-green-100 bg-green-50/20" : "border-zinc-200"
                                        )}
                                     >
                                        <div className="flex items-center gap-2 overflow-hidden">
                                           <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", item.isDone ? "bg-green-500" : "bg-indigo-500")} />
                                           <span className={cn("text-sm font-medium truncate", item.isDone ? "text-green-800" : "text-zinc-700")}>
                                              {item.subject.title}
                                           </span>
                                        </div>
                                        
                                        <button 
                                           onClick={() => onToggleDayCompletion(item.subject.id, dateStr, item.isDone)}
                                           className={cn(
                                              "w-8 h-8 flex items-center justify-center rounded-lg transition-colors",
                                              item.isDone 
                                                ? "text-green-600 hover:bg-green-100" 
                                                : "text-zinc-300 hover:text-indigo-500 hover:bg-indigo-50"
                                           )}
                                           title={item.isDone ? "Desmarcar" : "Marcar como Concluído"}
                                        >
                                           {item.isDone ? <CheckSquare className="w-5 h-5" /> : <div className="w-5 h-5 border-2 border-current rounded-md" />}
                                        </button>
                                     </div>
                                  ))}
                               </div>
                            </div>
                         );
                      })}
                   </div>
                )}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


// --- Main Tab Component ---

const ScheduleTab = () => {
  const { 
    months, 
    subjects, 
    sessions, 
    toggleSubtopic,
    updateSessionStatus,
    activeScheduleMonths,
    addActiveScheduleMonth,
    removeActiveScheduleMonth,
    toggleSubjectInMonth,
    updateSubjectSchedule,
    toggleSubjectPlannedDay,
    addSession,
    deleteSession,
    duplicateMonthSchedule
  } = useStudyStore();
  
  const [viewMode, setViewMode] = useState<'grid' | 'summary'>('grid');
  const [viewingMonthId, setViewingMonthId] = useState<string | null>(null);
  const [managingMonthId, setManagingMonthId] = useState<string | null>(null);
  const [isAddingMonth, setIsAddingMonth] = useState(false);
  const [newMonthValue, setNewMonthValue] = useState(formatDate(new Date()).slice(0, 7));
  
  // Duplication State
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [monthToDuplicate, setMonthToDuplicate] = useState<string | null>(null);
  const [targetDuplicateMonth, setTargetDuplicateMonth] = useState<string>(formatDate(new Date()).slice(0, 7));

  // Auto Distribute State
  const [isAutoDistributing, setIsAutoDistributing] = useState(false);
  const [distributeMonthId, setDistributeMonthId] = useState<string | null>(null);

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
    // Find subjects that have an entry for this month in their schedules
    const monthSubjects = subjects.filter(s => !!s.schedules && !!s.schedules[monthId]);
    
    let totalGoalHours = 0;
    let totalStudiedSeconds = 0;
    
    monthSubjects.forEach(sub => {
      totalGoalHours += (sub.schedules[monthId].monthlyGoal || 0);
    });

    sessions.forEach(sess => {
      // Check if session belongs to month AND belongs to a subject scheduled in this month
      if (sess.date.startsWith(monthId) && monthSubjects.find(s => s.id === sess.subjectId)) {
        totalStudiedSeconds += sess.duration;
      }
    });

    const totalStudiedHours = totalStudiedSeconds / 3600;
    const rawProgress = totalGoalHours > 0 ? (totalStudiedHours / totalGoalHours) * 100 : 0;
    
    const completedCount = monthSubjects.filter(s => s.schedules[monthId].isCompleted).length;
    const allCompleted = monthSubjects.length > 0 && completedCount === monthSubjects.length;

    return {
      subjectCount: monthSubjects.length,
      progress: allCompleted ? 100 : Math.min(100, rawProgress),
      totalGoalHours,
      totalStudiedHours
    };
  };

  const handleToggleSchedule = (subjectId: string, targetMonthId: string) => {
    toggleSubjectInMonth(subjectId, targetMonthId);
  };

  const handleAddMonth = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMonthValue) {
      addActiveScheduleMonth(newMonthValue);
      setIsAddingMonth(false);
    }
  };

  const handleDuplicateMonth = (e: React.FormEvent) => {
    e.preventDefault();
    if (monthToDuplicate && targetDuplicateMonth) {
        duplicateMonthSchedule(monthToDuplicate, targetDuplicateMonth);
        setIsDuplicating(false);
        setMonthToDuplicate(null);
    }
  };

  const openDuplicateModal = (monthId: string) => {
      setMonthToDuplicate(monthId);
      // Default to the next month of the source
      const [y, m] = monthId.split('-').map(Number);
      const nextDate = new Date(y, m, 1); // Month is 0-indexed in JS date but 1-indexed in split
      const nextStr = formatDate(nextDate).slice(0, 7);
      setTargetDuplicateMonth(nextStr);
      setIsDuplicating(true);
  };

  // Toggle Day Completion from Summary View
  const handleToggleDayCompletion = (subjectId: string, dateStr: string, isDone: boolean) => {
    if (isDone) {
      // Remove completed session(s) for this day/subject
      const sessionsToRemove = sessions.filter(s => s.subjectId === subjectId && s.date === dateStr && s.status === 'completed');
      sessionsToRemove.forEach(s => deleteSession(s.id));
    } else {
      // Add a session
      const subject = subjects.find(s => s.id === subjectId);
      if (!subject) return;
      
      const monthId = dateStr.slice(0, 7);
      const duration = getPlannedDurationSeconds(subject, monthId);
      
      const dateObj = new Date(dateStr + 'T12:00:00');
      
      addSession({
         subjectId,
         date: dateStr,
         startTime: dateObj.getTime(),
         duration: duration,
         status: 'completed'
      });
    }
  };
  
  // Handle save from Auto Distribute
  const handleAutoDistributeSave = (distribution: Record<string, string[]>) => {
    if (!distributeMonthId) return;
    
    // distribution is SubjectID -> DateStr[]
    Object.entries(distribution).forEach(([subjectId, dates]) => {
      updateSubjectSchedule(subjectId, distributeMonthId, { plannedDays: dates });
    });
  };

  const viewingMonthData = viewingMonthId ? calendarMonths.find(m => m.id === viewingMonthId) : null;
  // Filter subjects that have the month key
  const viewingMonthSubjects = viewingMonthId ? subjects.filter(s => !!s.schedules && !!s.schedules[viewingMonthId]) : [];
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
            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Cronograma</h2>
            <p className="text-zinc-500 text-sm">Organize e acompanhe seu progresso mensal.</p>
          </div>
        </div>
        
        <div className="flex gap-2 bg-zinc-100 p-1 rounded-xl">
           <button 
             onClick={() => setViewMode('grid')}
             className={cn(
               "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
               viewMode === 'grid' ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-900"
             )}
           >
             <LayoutGrid className="w-4 h-4" />
             Grade
           </button>
           <button 
             onClick={() => setViewMode('summary')}
             className={cn(
               "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
               viewMode === 'summary' ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-900"
             )}
           >
             <List className="w-4 h-4" />
             Resumo
           </button>
        </div>
      </div>

      {viewMode === 'summary' ? (
        <div className="space-y-6">
           {calendarMonths.length === 0 && (
              <div className="text-center py-20 bg-zinc-50 rounded-3xl border border-dashed border-zinc-200">
                 <p className="text-zinc-500">Nenhum mês planejado ainda.</p>
                 <Button variant="link" onClick={() => setViewMode('grid')}>Voltar para Grade e adicionar</Button>
              </div>
           )}
           {calendarMonths.map(month => (
              <SummaryMonthItem 
                key={month.id}
                monthId={month.id}
                monthName={month.name}
                year={month.year}
                subjects={subjects}
                sessions={sessions}
                onToggleDayCompletion={handleToggleDayCompletion}
              />
           ))}
        </div>
      ) : (
        /* GRID VIEW */
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {calendarMonths.map((month) => {
              const stats = getMonthStats(month.id);
              const isCurrentMonth = formatDate(new Date()).slice(0, 7) === month.id;

              return (
                <motion.div 
                  key={month.id}
                  whileHover={{ y: -4 }}
                  layout
                  onClick={() => setViewingMonthId(month.id)}
                  className={cn(
                    "bg-white border rounded-3xl flex flex-col h-auto min-h-[220px] shadow-sm cursor-pointer overflow-hidden group relative transition-all",
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
                        "font-bold text-lg capitalize block line-clamp-1",
                        isCurrentMonth ? "text-indigo-900" : "text-zinc-700"
                      )} title={month.name}>{month.name}</span>
                      <span className="text-xs text-zinc-500 font-medium">{month.year}</span>
                      {isCurrentMonth && <span className="ml-2 text-[10px] font-bold text-indigo-500 bg-indigo-100 px-2 py-0.5 rounded-full uppercase tracking-wide">Atual</span>}
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <div 
                        onClick={(e) => { e.stopPropagation(); openDuplicateModal(month.id); }}
                        className="w-8 h-8 rounded-full hover:bg-white hover:text-indigo-600 flex items-center justify-center text-zinc-400 transition-colors"
                        title="Duplicar planejamento"
                      >
                         <Copy className="w-4 h-4" />
                      </div>
                      <div 
                        onClick={(e) => { e.stopPropagation(); removeActiveScheduleMonth(month.id); }}
                        className="w-8 h-8 rounded-full hover:bg-red-100 hover:text-red-500 flex items-center justify-center text-zinc-300 transition-colors"
                        title="Remover mês"
                      >
                        <Trash2 className="w-4 h-4" />
                      </div>
                    </div>
                     <div className="w-10 h-10 rounded-full bg-white border border-zinc-100 flex items-center justify-center text-zinc-400 font-mono text-sm shadow-sm group-hover:hidden transition-transform">
                        {stats.subjectCount}
                      </div>
                  </div>

                  {/* Card Body */}
                  <div className="flex-1 p-5 flex flex-col gap-6">
                    
                    {/* Visual Representation of Content */}
                    <div className="space-y-2">
                      {stats.subjectCount === 0 ? (
                          <div className="text-center py-6">
                            <Circle className="w-12 h-12 text-zinc-100 mx-auto mb-2" />
                            <p className="text-xs text-zinc-400">Sem planejamento</p>
                          </div>
                      ) : (
                          <div className="flex flex-wrap gap-1.5 content-start">
                            {Array.from({length: Math.min(12, stats.subjectCount)}).map((_, i) => (
                                <div key={i} className="w-2 h-2 rounded-full bg-indigo-400 opacity-80" />
                            ))}
                            {stats.subjectCount > 12 && <div className="w-2 h-2 rounded-full bg-zinc-200 text-[6px] flex items-center justify-center">+</div>}
                          </div>
                      )}
                    </div>

                    {/* Progress Footer */}
                    <div className="mt-auto">
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
                className="border-2 border-dashed border-zinc-200 rounded-3xl flex flex-col items-center justify-center h-auto min-h-[220px] text-zinc-400 hover:text-indigo-500 hover:border-indigo-300 hover:bg-indigo-50/10 transition-all gap-4"
            >
                <div className="w-16 h-16 rounded-full bg-zinc-50 flex items-center justify-center">
                    <Plus className="w-8 h-8" />
                </div>
                <span className="font-medium">Adicionar Mês</span>
            </motion.button>
          </div>
        </>
      )}

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

      {/* Duplicate Month Modal */}
      <AnimatePresence>
        {isDuplicating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-sm p-4"
            onClick={() => setIsDuplicating(false)}
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
                   <h3 className="font-bold text-xl text-zinc-900 flex items-center gap-2">
                     <Copy className="w-5 h-5 text-indigo-500" />
                     Duplicar Planejamento
                   </h3>
                   <p className="text-sm text-zinc-500">Copiar matérias e metas.</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsDuplicating(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="mb-4 text-xs text-zinc-400 bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                 Isso copiará todas as matérias ativas, metas de horas e anotações de <b>{monthToDuplicate}</b> para o novo mês. Os dias específicos não serão copiados.
              </div>

              <form onSubmit={handleDuplicateMonth} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Para qual mês?</label>
                    <input 
                        type="month" 
                        value={targetDuplicateMonth}
                        onChange={(e) => setTargetDuplicateMonth(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-base focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        required
                    />
                 </div>

                 <div className="flex gap-3">
                   <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDuplicating(false)}>Cancelar</Button>
                   <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">Duplicar</Button>
                 </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Auto Distribute Modal */}
      <AnimatePresence>
        {isAutoDistributing && distributeMonthId && (
          <AutoDistributeModal
            monthId={distributeMonthId}
            subjects={subjects.filter(s => !!s.schedules && !!s.schedules[distributeMonthId])}
            onClose={() => { setIsAutoDistributing(false); setDistributeMonthId(null); }}
            onSave={handleAutoDistributeSave}
          />
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
              className="bg-white rounded-[2rem] p-0 max-w-6xl w-full shadow-2xl border border-zinc-100 max-h-[90vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-8 pb-4 bg-white border-b border-zinc-50 flex justify-between items-start shrink-0 z-10">
                 <div className="flex-1 min-w-0 pr-4">
                    <h2 className="text-3xl font-bold text-zinc-900 capitalize flex items-center gap-3 flex-wrap">
                       <span className="truncate">{viewingMonthData.name}</span>
                       <span className="text-lg text-zinc-400 font-normal whitespace-nowrap">{viewingMonthData.year}</span>
                    </h2>
                    
                    {viewingMonthStats && (
                      <div className="flex items-center gap-6 mt-3 text-sm text-zinc-500 overflow-x-auto">
                         <div className="flex items-center gap-2 whitespace-nowrap">
                            <BookOpen className="w-4 h-4 text-indigo-500" />
                            <span className="font-medium text-zinc-700">{viewingMonthStats.subjectCount}</span> matérias
                         </div>
                         <div className="flex items-center gap-2 whitespace-nowrap">
                            <Clock className="w-4 h-4 text-orange-500" />
                            <span className="font-medium text-zinc-700">{viewingMonthStats.totalStudiedHours.toFixed(1)}h</span> estudadas
                         </div>
                         <div className="flex items-center gap-2 whitespace-nowrap">
                             <div className="w-20 h-2 bg-zinc-100 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 transition-all duration-700" style={{width: `${viewingMonthStats.progress}%`}} />
                             </div>
                             <span className="font-bold text-zinc-900">{Math.round(viewingMonthStats.progress)}%</span>
                         </div>
                      </div>
                    )}
                 </div>
                 
                 <div className="flex gap-2 shrink-0">
                     <Button 
                      onClick={() => { setDistributeMonthId(viewingMonthId); }}
                      className="rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 hidden sm:flex"
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      Distribuição Automática
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => { setManagingMonthId(viewingMonthId); setViewingMonthId(null); }}
                      className="rounded-xl border-zinc-200 hover:bg-zinc-50 text-zinc-700 hidden sm:flex"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Gerenciar Matérias
                    </Button>
                     <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => { setManagingMonthId(viewingMonthId); setViewingMonthId(null); }}
                      className="rounded-xl border-zinc-200 hover:bg-zinc-50 text-zinc-700 sm:hidden"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setViewingMonthId(null)} className="rounded-full hover:bg-zinc-100">
                      <X className="w-6 h-6 text-zinc-400" />
                    </Button>
                 </div>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-zinc-50/50">
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
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 items-start">
                          {viewingMonthSubjects.map(subject => (
                             <ScheduleSubjectCard 
                                key={subject.id}
                                subject={subject}
                                monthId={viewingMonthId}
                                scheduleData={subject.schedules[viewingMonthId]}
                                sessions={sessions}
                                onToggleSubtopic={toggleSubtopic}
                                onUpdateSessionStatus={updateSessionStatus}
                                onUpdateSubjectSchedule={updateSubjectSchedule}
                                onTogglePlannedDay={toggleSubjectPlannedDay}
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
                <div className="flex-1 min-w-0 pr-4">
                    <h3 className="font-bold text-xl text-zinc-900 capitalize truncate">
                        Planejamento de {calendarMonths.find(m => m.id === managingMonthId)?.name}
                    </h3>
                    <p className="text-zinc-500 text-sm">Marque as matérias para estudar neste mês.</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setManagingMonthId(null)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                {months.length === 0 && <p className="text-zinc-400 text-center py-10">Crie assuntos na aba 'Assuntos' primeiro.</p>}
                
                {months.map(exam => {
                    const examSubjects = subjects.filter(s => s.monthId === exam.id);
                    if(examSubjects.length === 0) return null;

                    return (
                        <div key={exam.id} className="space-y-3">
                            <h4 className="font-bold text-zinc-800 text-sm flex items-center gap-2 bg-zinc-50 p-2 rounded-lg sticky top-0 z-10 backdrop-blur-sm bg-zinc-50/90 truncate">
                                <ArrowRight className="w-3 h-3 text-zinc-400 shrink-0" />
                                <span className="truncate">{exam.name}</span>
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2">
                                {examSubjects.map(sub => {
                                    // Check if current month exists in schedules map
                                    const isSelected = !!sub.schedules && !!sub.schedules[managingMonthId];
                                    
                                    return (
                                        <div 
                                            key={sub.id}
                                            onClick={() => handleToggleSchedule(sub.id, managingMonthId!)}
                                            className={cn(
                                                "p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between group",
                                                isSelected 
                                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200" 
                                                    : "bg-white border-zinc-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-zinc-800"
                                            )}
                                        >
                                            <div className="overflow-hidden">
                                                <p className={cn("font-medium text-sm truncate", isSelected ? "text-white" : "text-zinc-800")}>{sub.title}</p>
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

import React, { useState, useMemo } from "react";
import { useStudyStore } from "../../hooks/useStudyStore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, Plus, X, ArrowRight, Check, ChevronRight, Clock, 
  AlertCircle, CheckCircle2, List, LayoutGrid, Maximize2, 
  Copy, Wand2, RefreshCw, Save, Settings2, CalendarDays, Trash2, ArrowLeft,
  FileText, Table2
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { cn, formatDate, MONTH_NAMES } from "../../lib/utils";
import { Subject, SubjectSchedule, Session } from "../../types";
import { getDay, eachDayOfInterval, format } from "date-fns";
import ptBR from "date-fns/locale/pt-BR";

// Helper to replace startOfWeek since import was failing
const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // weekStartsOn: 0 (Sunday)
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

// --- Monthly Summary Modal ---

interface MonthlySummaryModalProps {
  monthId: string;
  subjects: Subject[];
  onClose: () => void;
}

const MonthlySummaryModal: React.FC<MonthlySummaryModalProps> = ({ monthId, subjects, onClose }) => {
  const [year, month] = monthId.split('-').map(Number);
  
  const summaryData = useMemo(() => {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    const days = eachDayOfInterval({ start, end });
    
    const dailyData: { date: Date; items: { subject: string; hours: number }[] }[] = [];

    days.forEach(day => {
      const dateStr = formatDate(day);
      const items: { subject: string; hours: number }[] = [];
      
      subjects.forEach(sub => {
        const schedule = sub.schedules?.[monthId];
        if (schedule?.plannedDays?.includes(dateStr)) {
           const assignedDays = schedule.plannedDays.length;
           const hours = assignedDays > 0 ? (schedule.monthlyGoal || 0) / assignedDays : 0;
           items.push({ subject: sub.title, hours });
        }
      });
      
      if (items.length > 0) {
        dailyData.push({ date: day, items });
      }
    });

    return dailyData;
  }, [monthId, subjects, year, month]);

  // Group by week for the Overview
  const weeks = useMemo(() => {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    const days = eachDayOfInterval({ start, end });
    const weekMap: Record<string, { date: Date, subjects: string[] }[]> = {};

    days.forEach(day => {
       const weekStart = getStartOfWeek(day);
       const weekKey = formatDate(weekStart);
       
       if (!weekMap[weekKey]) weekMap[weekKey] = [];
       
       const dateStr = formatDate(day);
       const daySubjects = subjects
         .filter(s => s.schedules?.[monthId]?.plannedDays?.includes(dateStr))
         .map(s => s.title);
         
       if (daySubjects.length > 0) {
          weekMap[weekKey].push({ date: day, subjects: daySubjects });
       }
    });

    return Object.entries(weekMap).map(([key, days]) => ({
       start: new Date(key),
       days
    }));
  }, [monthId, subjects, year, month]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-zinc-950/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl border border-zinc-100 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-white shrink-0">
           <div>
              <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                 <FileText className="w-5 h-5 text-indigo-500" />
                 Resumo do Planejamento
              </h3>
              <p className="text-sm text-zinc-500">
                Visão geral da distribuição salva para {MONTH_NAMES[month - 1]}.
              </p>
           </div>
           <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>

        <div className="flex-1 overflow-y-auto bg-zinc-50/50 p-6 space-y-8">
            
            {/* A. Saved Automatic Planning Overview */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
               <h4 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-zinc-400" />
                  Visão Semanal
               </h4>
               <div className="space-y-6">
                  {weeks.map((week, idx) => (
                    <div key={idx} className="border-l-2 border-indigo-100 pl-4">
                       <h5 className="text-xs font-bold text-indigo-600 uppercase mb-2">
                          Semana de {format(week.start, "dd 'de' MMM", { locale: ptBR })}
                       </h5>
                       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {week.days.map((d, i) => (
                             <div key={i} className="bg-zinc-50 rounded-lg p-2 border border-zinc-100">
                                <div className="text-[10px] font-bold text-zinc-400 uppercase mb-1">
                                   {format(d.date, "EEE, dd", { locale: ptBR })}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                   {d.subjects.map((sub, j) => (
                                      <span key={j} className="text-[10px] bg-white border border-zinc-200 px-1.5 py-0.5 rounded text-zinc-700 truncate max-w-full">
                                         {sub}
                                      </span>
                                   ))}
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                  ))}
                  {weeks.length === 0 && <p className="text-sm text-zinc-400 italic">Nenhum planejamento encontrado para este mês.</p>}
               </div>
            </div>

            {/* B. Daily Study Distribution Table */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
               <h4 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
                  <Table2 className="w-4 h-4 text-zinc-400" />
                  Lista Diária de Estudos
               </h4>
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="border-b border-zinc-100 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                       <th className="py-2 px-3">Data</th>
                       <th className="py-2 px-3">Matéria</th>
                       <th className="py-2 px-3 text-right">Horas Est.</th>
                     </tr>
                   </thead>
                   <tbody className="text-xs text-zinc-700 divide-y divide-zinc-50">
                     {summaryData.length === 0 ? (
                       <tr><td colSpan={3} className="py-4 text-center text-zinc-400 italic">Sem dados</td></tr>
                     ) : (
                       summaryData.flatMap((day) => 
                         day.items.map((item, idx) => (
                           <tr key={`${formatDate(day.date)}-${idx}`} className="hover:bg-zinc-50 transition-colors">
                             <td className="py-1.5 px-3 font-medium text-zinc-900 whitespace-nowrap">
                               {idx === 0 ? format(day.date, "dd/MM/yyyy") : ""}
                             </td>
                             <td className="py-1.5 px-3">{item.subject}</td>
                             <td className="py-1.5 px-3 text-right font-mono text-zinc-500">
                               {item.hours > 0 ? item.hours.toFixed(1) + 'h' : '-'}
                             </td>
                           </tr>
                         ))
                       )
                     )}
                   </tbody>
                 </table>
               </div>
            </div>
        </div>
        
        <div className="p-6 border-t border-zinc-100 bg-white flex justify-end shrink-0">
           <Button onClick={onClose} className="px-8">Fechar Resumo</Button>
        </div>
      </motion.div>
    </motion.div>
  );
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

    // 1. Calculate Total Slots Available in the grid
    const totalSlotsInGrid = availableDates.length * subjectsPerDay;
    
    // 2. Prepare the Priority Queue
    // We calculate how many slots each subject *deserves* based on their hours relative to the total hours.
    const distributionQueue = validSubjects.map(s => {
       const goal = s.schedules?.[monthId]?.monthlyGoal || 0;
       
       // Calculate strictly proportional share
       const ratio = totalGoalHours > 0 ? goal / totalGoalHours : 0;
       
       // Determine number of slots. 
       // We cap it at availableDates.length because a subject can only appear ONCE per day.
       // We ensure at least 1 slot if it has hours.
       let targetSlots = Math.round(ratio * totalSlotsInGrid);
       if (targetSlots === 0 && goal > 0) targetSlots = 1;
       if (targetSlots > availableDates.length) targetSlots = availableDates.length;

       return {
          id: s.id,
          targetSlots,
          goal
       };
    });

    // 3. Sort by "Big Rocks First"
    // Subjects with more slots (more hours) get placed first to ensure they fit.
    distributionQueue.sort((a, b) => b.targetSlots - a.targetSlots);

    // 4. Distribute using Interval/Stride approach to ensure spacing
    distributionQueue.forEach((sub, index) => {
      if (sub.targetSlots <= 0) return;
      
      // The stride is the ideal gap between study sessions for this subject
      const interval = availableDates.length / sub.targetSlots;
      
      // Shift starting position slightly for different subjects to avoid Day 1 pile-up
      const startOffset = index % Math.floor(interval || 1); 

      for (let i = 0; i < sub.targetSlots; i++) {
          // Ideally we want to place it at:
          let idealIndex = Math.floor((i * interval) + startOffset) % availableDates.length;
          
          let bestDateStr = "";
          let placed = false;

          // Check if ideal date is valid
          let dateStr = formatDate(availableDates[idealIndex]);
          
          if (newDist[dateStr].length < subjectsPerDay && !newDist[dateStr].includes(sub.id)) {
             bestDateStr = dateStr;
             placed = true;
          } else {
             // Collision: Find the NEAREST AVAILABLE day that isn't full and doesn't have this subject
             // We prioritize days with fewer subjects to balance the load.
             let bestCandidateIndex = -1;
             let minLoad = Infinity;

             // Scan all available dates
             for (let j = 0; j < availableDates.length; j++) {
                const scanStr = formatDate(availableDates[j]);
                const currentLoad = newDist[scanStr].length;
                
                // Must not be full, must not already have this subject
                if (currentLoad < subjectsPerDay && !newDist[scanStr].includes(sub.id)) {
                   // Calculate distance from ideal index to keep distribution somewhat regular
                   // We prefer closer days, but empty days are also good.
                   // Simple heuristic: pick the emptiest day.
                   if (currentLoad < minLoad) {
                      minLoad = currentLoad;
                      bestCandidateIndex = j;
                   }
                }
             }

             if (bestCandidateIndex !== -1) {
                bestDateStr = formatDate(availableDates[bestCandidateIndex]);
                placed = true;
             }
          }

          if (placed && bestDateStr) {
             newDist[bestDateStr].push(sub.id);
          }
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
        const sub = subjects.find(s => s.id === id);
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
                 {totalGoalHours === 0 ? (
                    <div className="bg-amber-50 text-amber-800 p-4 rounded-xl flex items-center gap-3 border border-amber-200">
                        <AlertCircle className="w-5 h-5" />
                        <div>
                            <p className="font-bold">Sem metas definidas</p>
                            <p className="text-sm">Defina as metas mensais (horas) de cada matéria antes de gerar a distribuição.</p>
                        </div>
                    </div>
                 ) : null}

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
                          ~{(availableDates.length > 0 ? totalGoalHours / availableDates.length : 0).toFixed(1)}h
                       </span>
                       <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Por Dia</span>
                    </div>
                 </div>
              </div>
           ) : (
              <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d,i) => (
                       <div key={i} className="hidden md:block text-center text-xs font-bold text-zinc-400 uppercase mb-2">{d}</div>
                    ))}
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
                 <Button onClick={handleGenerate} disabled={totalGoalHours === 0} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8">
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

// --- Schedule Subject Card Component ---

interface ScheduleSubjectCardProps {
  subject: Subject;
  monthId: string;
  scheduleData: SubjectSchedule; 
  onUpdateSubjectSchedule: (id: string, monthId: string, updates: Partial<SubjectSchedule>) => void;
  onTogglePlannedDay: (subjectId: string, monthId: string, dateStr: string) => void;
  generateMonthSchedule: (subjectId: string, monthStr: string, config: any) => void;
}

const ScheduleSubjectCard: React.FC<ScheduleSubjectCardProps> = ({ 
  subject, 
  monthId,
  scheduleData, 
  onUpdateSubjectSchedule,
  onTogglePlannedDay,
  generateMonthSchedule
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [weeklyHours, setWeeklyHours] = useState(4);
  const [weeklyDays, setWeeklyDays] = useState<number[]>([1, 3, 5]); // Mon, Wed, Fri default

  const plannedDays = scheduleData.plannedDays || [];
  const goalHours = scheduleData.monthlyGoal || 0;

  const handleGenerateWeekly = () => {
    generateMonthSchedule(subject.id, monthId, {
      hoursPerWeek: weeklyHours,
      preferredDays: weeklyDays
    });
  };

  return (
    <>
      <motion.div 
        layout
        onClick={() => setIsExpanded(true)}
        className={cn(
          "bg-white border rounded-lg overflow-hidden transition-all duration-300 flex flex-col cursor-pointer group hover:shadow-md",
          "border-zinc-200 hover:border-indigo-300"
        )}
      >
        <div className={cn(
          "px-3 py-2 flex items-center justify-between border-b transition-colors bg-zinc-50/50 border-zinc-100 group-hover:bg-indigo-50/30"
        )}>
           <div className="flex-1 min-w-0 flex items-center gap-2">
              <h4 className="font-bold text-xs truncate text-zinc-900">
                {subject.title}
              </h4>
           </div>
           <Maximize2 className="w-3 h-3 text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="p-3 bg-white flex-1 min-h-[60px]">
           <ul className="space-y-1.5">
             {subject.subtopics.slice(0, 3).map(st => (
               <li key={st.id} className="flex items-start gap-1.5 text-[10px] leading-tight text-zinc-600">
                  <span className="w-1 h-1 rounded-full mt-1 shrink-0 bg-zinc-300" />
                  <span className="truncate text-zinc-600">
                    {st.title}
                  </span>
               </li>
             ))}
           </ul>
        </div>
        
        <div className="px-3 py-1.5 border-t border-zinc-50 bg-zinc-50/30 flex justify-between items-center">
            <span className="text-[9px] text-zinc-400 flex items-center gap-1">
               <CalendarDays className="w-2.5 h-2.5" />
               {plannedDays.length} dias
            </span>
            {goalHours > 0 && <span className="text-[9px] font-medium text-indigo-600">{goalHours}h</span>}
        </div>
      </motion.div>

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
              className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col md:flex-row"
              onClick={(e) => e.stopPropagation()}
            >
               <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-zinc-100">
                  <div className="p-5 border-b border-zinc-100 flex items-start gap-3 bg-zinc-50/50">
                      <div className="flex-1">
                          <h3 className="text-xl font-bold text-zinc-900">{subject.title}</h3>
                          <p className="text-xs text-zinc-500 mt-1">Configuração da Matéria</p>
                      </div>
                  </div>

                  <div className="p-5 border-b border-zinc-100 bg-white">
                      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Calendar className="w-3 h-3" /> Configuração Semanal
                      </h4>
                      <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="text-[10px] uppercase font-bold text-zinc-400">Horas / Semana</label>
                                <Input type="number" value={weeklyHours} onChange={(e) => setWeeklyHours(parseInt(e.target.value))} className="h-9 mt-1" />
                            </div>
                            <Button size="sm" onClick={handleGenerateWeekly} className="mt-5 bg-indigo-600 hover:bg-indigo-700 text-white">
                                <Wand2 className="w-3 h-3 mr-2" /> Gerar
                            </Button>
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-2">Dias Preferidos</label>
                            <div className="flex gap-1">
                                {['D','S','T','Q','Q','S','S'].map((d, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => setWeeklyDays(prev => prev.includes(i) ? prev.filter(x => x!==i) : [...prev, i])}
                                        className={cn(
                                            "w-8 h-8 rounded-lg text-xs font-bold transition-colors",
                                            weeklyDays.includes(i) ? "bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200"
                                        )}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5">
                      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Tópicos</h4>
                      <ul className="space-y-1">
                          {subject.subtopics.map(st => (
                            <li key={st.id} className="flex items-center gap-2 p-2 rounded hover:bg-zinc-50">
                               <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                               <span className="text-sm text-zinc-600">{st.title}</span>
                            </li>
                          ))}
                      </ul>
                  </div>
               </div>

               <div className="flex-1 bg-zinc-50/50 flex flex-col max-h-[400px] md:max-h-full">
                  <div className="p-5 border-b border-zinc-100 flex justify-between items-center">
                      <h4 className="font-bold text-zinc-900">Calendário</h4>
                      <div className="flex items-center gap-2">
                          <label className="text-xs text-zinc-500">Meta Mensal (h):</label>
                          <Input 
                             type="number" 
                             className="w-16 h-8 text-right bg-white" 
                             value={goalHours}
                             onChange={(e) => onUpdateSubjectSchedule(subject.id, monthId, { monthlyGoal: parseInt(e.target.value) || 0 })}
                          />
                      </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-5">
                      <div className="grid grid-cols-7 gap-2">
                         {['D','S','T','Q','Q','S','S'].map((d,i) => (
                            <div key={i} className="text-center text-[10px] font-bold text-zinc-400 uppercase">{d}</div>
                         ))}
                         {eachDayOfInterval({
                            start: new Date(parseInt(monthId.split('-')[0]), parseInt(monthId.split('-')[1])-1, 1),
                            end: new Date(parseInt(monthId.split('-')[0]), parseInt(monthId.split('-')[1]), 0)
                         }).map(date => {
                             const dStr = formatDate(date);
                             const isSelected = plannedDays.includes(dStr);
                             const startOffset = date.getDate() === 1 ? { gridColumnStart: getDay(date) + 1 } : {};
                             
                             return (
                                <div 
                                    key={dStr} 
                                    style={startOffset}
                                    onClick={() => onTogglePlannedDay(subject.id, monthId, dStr)}
                                    className={cn(
                                        "aspect-square rounded-lg flex items-center justify-center text-xs font-medium cursor-pointer transition-all border",
                                        isSelected 
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" 
                                            : "bg-white text-zinc-700 border-zinc-200 hover:border-indigo-300"
                                    )}
                                >
                                    {date.getDate()}
                                </div>
                             );
                         })}
                      </div>
                  </div>
                  <div className="p-5 border-t border-zinc-100 flex justify-end">
                      <Button onClick={() => setIsExpanded(false)}>Fechar</Button>
                  </div>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// --- Main Schedule Tab ---

const ScheduleTab = () => {
  const { 
    activeScheduleMonths, 
    addActiveScheduleMonth, 
    removeActiveScheduleMonth, 
    duplicateMonthSchedule,
    subjects,
    updateSubjectSchedule,
    toggleSubjectPlannedDay,
    generateMonthSchedule
  } = useStudyStore();

  const [expandedMonthId, setExpandedMonthId] = useState<string | null>(null);
  const [isAutoDistributing, setIsAutoDistributing] = useState(false);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [monthToDuplicate, setMonthToDuplicate] = useState<string | null>(null);
  const [targetMonthForDuplication, setTargetMonthForDuplication] = useState("");
  
  // New state for Summary Modal
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const handleAddMonth = () => {
     const today = new Date();
     const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
     const mStr = formatDate(nextMonth).slice(0, 7);
     addActiveScheduleMonth(mStr);
  };

  const handleDuplicateClick = (sourceId: string) => {
    setMonthToDuplicate(sourceId);
    setDuplicateModalOpen(true);
  };

  const confirmDuplication = () => {
    if (monthToDuplicate && targetMonthForDuplication) {
      duplicateMonthSchedule(monthToDuplicate, targetMonthForDuplication);
      setDuplicateModalOpen(false);
      setMonthToDuplicate(null);
      setTargetMonthForDuplication("");
    }
  };

  const handleSaveDistribution = (subjectUpdates: Record<string, string[]>) => {
    if (!expandedMonthId) return;
    Object.entries(subjectUpdates).forEach(([subjectId, dates]) => {
      updateSubjectSchedule(subjectId, expandedMonthId, { plannedDays: dates });
    });
    setIsAutoDistributing(false);
    // Show summary after saving
    setShowSummaryModal(true);
  };

  return (
    <div className="space-y-8">
      {!expandedMonthId ? (
         <>
            <div className="flex justify-between items-center">
                <div>
                   <h2 className="text-2xl font-bold text-zinc-900">Cronogramas</h2>
                   <p className="text-zinc-500 text-sm">Gerencie seu planejamento mensal.</p>
                </div>
                <Button onClick={handleAddMonth} className="bg-zinc-900 text-white rounded-full">
                    <Plus className="w-4 h-4 mr-2" /> Novo Mês
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeScheduleMonths.map(monthId => {
                   const [y, m] = monthId.split('-');
                   const monthName = MONTH_NAMES[parseInt(m) - 1];
                   return (
                      <motion.div 
                        key={monthId}
                        whileHover={{ y: -4 }}
                        className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm hover:shadow-xl transition-all group"
                      >
                         <div className="flex justify-between items-start mb-4">
                             <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-bold text-lg">
                                 {m}
                             </div>
                             <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => handleDuplicateClick(monthId)}>
                                    <Copy className="w-4 h-4 text-zinc-500" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-red-50" onClick={() => removeActiveScheduleMonth(monthId)}>
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                             </div>
                         </div>
                         <h3 className="text-xl font-bold text-zinc-900 mb-1">{monthName}</h3>
                         <p className="text-sm text-zinc-500 mb-6">{y}</p>
                         <Button className="w-full rounded-xl" onClick={() => setExpandedMonthId(monthId)}>
                             Abrir Planejamento
                         </Button>
                      </motion.div>
                   );
                })}
            </div>
         </>
      ) : (
         <div className="space-y-6">
             <div className="flex items-center justify-between pb-6 border-b border-zinc-100">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setExpandedMonthId(null)} className="rounded-full hover:bg-zinc-100">
                        <ArrowLeft className="w-6 h-6 text-zinc-500" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-900">
                            {MONTH_NAMES[parseInt(expandedMonthId.split('-')[1]) - 1]}
                        </h2>
                        <p className="text-zinc-500 text-sm">Visão detalhada do mês</p>
                    </div>
                </div>
                <div className="flex gap-3">
                   <Button variant="outline" className="rounded-xl hidden sm:flex" onClick={() => setIsAutoDistributing(true)}>
                      <Wand2 className="w-4 h-4 mr-2 text-indigo-500" /> Distribuição Automática
                   </Button>
                   <Button variant="ghost" className="rounded-xl hidden sm:flex" onClick={() => setShowSummaryModal(true)}>
                      <FileText className="w-4 h-4 mr-2 text-zinc-500" /> Ver Resumo
                   </Button>
                </div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                 {subjects.map(subject => (
                    <ScheduleSubjectCard 
                        key={subject.id}
                        subject={subject}
                        monthId={expandedMonthId}
                        scheduleData={subject.schedules?.[expandedMonthId] || { monthlyGoal: 0, plannedDays: [], isCompleted: false, notes: '' }}
                        onUpdateSubjectSchedule={updateSubjectSchedule}
                        onTogglePlannedDay={toggleSubjectPlannedDay}
                        generateMonthSchedule={generateMonthSchedule}
                    />
                 ))}
             </div>
         </div>
      )}

      {/* Auto Distribute Modal */}
      {isAutoDistributing && expandedMonthId && (
          <AutoDistributeModal 
             monthId={expandedMonthId}
             subjects={subjects}
             onClose={() => setIsAutoDistributing(false)}
             onSave={handleSaveDistribution}
          />
      )}

      {/* Monthly Summary Modal */}
      {showSummaryModal && expandedMonthId && (
         <MonthlySummaryModal 
            monthId={expandedMonthId}
            subjects={subjects}
            onClose={() => setShowSummaryModal(false)}
         />
      )}

      {/* Duplicate Modal */}
      <AnimatePresence>
        {duplicateModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-zinc-950/40 backdrop-blur-sm p-4"
            onClick={() => setDuplicateModalOpen(false)}
          >
             <motion.div 
               initial={{ scale: 0.95 }}
               animate={{ scale: 1 }}
               className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
               onClick={e => e.stopPropagation()}
             >
                <h3 className="font-bold text-lg mb-4">Duplicar Planejamento</h3>
                <p className="text-sm text-zinc-500 mb-4">Copiar estrutura de {monthToDuplicate} para:</p>
                <Input 
                   type="month" 
                   value={targetMonthForDuplication} 
                   onChange={(e) => setTargetMonthForDuplication(e.target.value)}
                   className="mb-6"
                />
                <div className="flex justify-end gap-2">
                   <Button variant="ghost" onClick={() => setDuplicateModalOpen(false)}>Cancelar</Button>
                   <Button onClick={confirmDuplication} disabled={!targetMonthForDuplication}>Confirmar</Button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScheduleTab;

import React, { useState } from "react";
import { useStudyStore } from "../../hooks/useStudyStore";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Plus, X, ArrowRight, Check, BookOpen } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

const ScheduleTab = () => {
  const { months, subjects, scheduleSubject } = useStudyStore();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null); // Format: "YYYY-MM"
  
  const currentYear = new Date().getFullYear();
  const calendarMonths = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(currentYear, i, 1);
    return {
      name: format(date, "MMMM", { locale: ptBR }),
      id: format(date, "yyyy-MM"),
      date: date
    };
  });

  const getSubjectsForScheduleMonth = (dateStr: string) => {
    return subjects.filter(s => s.scheduledDate === dateStr);
  };

  const getUnscheduledSubjects = () => {
      // Filter out subjects that are already scheduled
      // OR allow moving them. For now, list all to allow moving.
      return subjects;
  };

  const handleToggleSchedule = (subjectId: string, targetMonthId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (subject?.scheduledDate === targetMonthId) {
        // Unschedule if clicked again in same month
        scheduleSubject(subjectId, undefined);
    } else {
        // Move to new month
        scheduleSubject(subjectId, targetMonthId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
             <Calendar className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">Cronograma</h2>
            <p className="text-zinc-500 text-sm">Distribua os assuntos das provas ao longo do ano.</p>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {calendarMonths.map((month) => {
          const monthSubjects = getSubjectsForScheduleMonth(month.id);
          const isCurrentMonth = format(new Date(), "yyyy-MM") === month.id;

          return (
            <div 
              key={month.id}
              className={cn(
                "bg-white border rounded-2xl flex flex-col h-[300px] shadow-sm transition-all overflow-hidden relative group",
                isCurrentMonth ? "border-indigo-200 ring-4 ring-indigo-50" : "border-zinc-200"
              )}
            >
              <div className={cn(
                  "p-4 border-b flex justify-between items-center",
                  isCurrentMonth ? "bg-indigo-50 border-indigo-100" : "bg-zinc-50 border-zinc-100"
              )}>
                <span className={cn(
                    "font-bold capitalize",
                    isCurrentMonth ? "text-indigo-900" : "text-zinc-700"
                )}>{month.name}</span>
                <span className="text-xs font-mono text-zinc-400">{monthSubjects.length}</span>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {monthSubjects.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-300 gap-2">
                        <BookOpen className="w-8 h-8 opacity-20" />
                        <span className="text-xs">Vazio</span>
                    </div>
                ) : (
                    monthSubjects.map(sub => {
                        const examName = months.find(m => m.id === sub.monthId)?.name || "Prova";
                        return (
                            <div key={sub.id} className="bg-white border border-zinc-100 p-2 rounded-lg text-sm shadow-sm">
                                <p className="font-medium text-zinc-800 truncate">{sub.title}</p>
                                <p className="text-[10px] text-zinc-400 truncate">{examName}</p>
                            </div>
                        )
                    })
                )}
              </div>

              <button 
                onClick={() => setSelectedMonth(month.id)}
                className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0"
                title="Adicionar assuntos"
              >
                  <Plus className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal Selection */}
      <AnimatePresence>
        {selectedMonth && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-sm p-4"
            onClick={() => setSelectedMonth(null)}
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
                        Planejamento de {calendarMonths.find(m => m.id === selectedMonth)?.name}
                    </h3>
                    <p className="text-zinc-500 text-sm">Selecione os assuntos para estudar neste mês.</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedMonth(null)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                {months.length === 0 && <p className="text-zinc-400 text-center py-10">Crie provas primeiro.</p>}
                
                {months.map(exam => {
                    const examSubjects = subjects.filter(s => s.monthId === exam.id);
                    if(examSubjects.length === 0) return null;

                    return (
                        <div key={exam.id} className="space-y-3">
                            <h4 className="font-bold text-zinc-800 text-sm flex items-center gap-2 bg-zinc-50 p-2 rounded-lg">
                                <ArrowRight className="w-3 h-3 text-zinc-400" />
                                {exam.name}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2">
                                {examSubjects.map(sub => {
                                    const isSelected = sub.scheduledDate === selectedMonth;
                                    const isScheduledElsewhere = sub.scheduledDate && sub.scheduledDate !== selectedMonth;
                                    
                                    return (
                                        <div 
                                            key={sub.id}
                                            onClick={() => handleToggleSchedule(sub.id, selectedMonth!)}
                                            className={cn(
                                                "p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between group",
                                                isSelected 
                                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200" 
                                                    : isScheduledElsewhere
                                                        ? "bg-zinc-100 border-zinc-200 text-zinc-500" // Removida opacidade, adicionada cor sólida
                                                        : "bg-white border-zinc-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-zinc-800"
                                            )}
                                        >
                                            <div className="overflow-hidden">
                                                <p className={cn("font-medium text-sm truncate", isSelected ? "text-white" : "text-zinc-800")}>{sub.title}</p>
                                                {isScheduledElsewhere && (
                                                    <p className="text-[10px] mt-0.5 text-zinc-400">
                                                        Em {calendarMonths.find(m => m.id === sub.scheduledDate)?.name}
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
              
              <div className="pt-4 border-t border-zinc-100 mt-4 flex justify-end shrink-0">
                  <Button onClick={() => setSelectedMonth(null)}>Concluir</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScheduleTab;

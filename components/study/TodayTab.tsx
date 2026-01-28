
import React, { useMemo, useState } from "react";
import { useStudyStore } from "../../hooks/useStudyStore";
import { formatDate } from "../../lib/utils";
import { Clock, BookOpen, LayoutList, PlayCircle, Filter, CheckSquare } from "lucide-react";
import { cn } from "../../lib/utils";

interface TodayTabProps {
  onStartStudy: (subjectId: string) => void;
}

const TodayTab: React.FC<TodayTabProps> = ({ onStartStudy }) => {
  const { subjects, sessions, settings, months, getQuestionsBySubject, getTotalQuestions } = useStudyStore();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const todayStr = formatDate(new Date());

  const hoursToday = useMemo(() => {
    const todaySessions = sessions.filter(s => s.date === todayStr && s.status === 'completed');
    return (todaySessions.reduce((acc, s) => acc + s.duration, 0) / 3600).toFixed(1);
  }, [sessions, todayStr]);

  const grandTotalHours = useMemo(() => {
    const completedSessions = sessions.filter(s => s.status === 'completed');
    return (completedSessions.reduce((acc, s) => acc + s.duration, 0) / 3600).toFixed(1);
  }, [sessions]);

  const totalQuestions = useMemo(() => getTotalQuestions(), [sessions, getTotalQuestions]);

  const getSubjectHours = (subjectId: string) => {
    const subjectSessions = sessions.filter(s => s.subjectId === subjectId && s.status === 'completed');
    const totalSeconds = subjectSessions.reduce((acc, s) => acc + s.duration, 0);
    return (totalSeconds / 3600).toFixed(1);
  };

  const filteredSubjects = useMemo(() => {
    if (selectedCategoryId === "all") return subjects;
    return subjects.filter(s => s.monthId === selectedCategoryId);
  }, [subjects, selectedCategoryId]);

  const displayName = settings.userName ? settings.userName.split(' ')[0] : 'Estudante';

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Resumo Minimalista */}
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
        <div>
          <h1 className="text-sm font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            Status: {displayName}
          </h1>
          <p className="text-zinc-400 text-[10px] font-medium uppercase tracking-tighter">Resumo de desempenho geral</p>
        </div>
        
        <div className="flex gap-2">
           <div className="bg-zinc-900 text-white px-3 py-1.5 rounded-lg flex flex-col items-center min-w-[60px]">
              <span className="text-[8px] font-black text-zinc-400 uppercase tracking-tighter">Hoje</span>
              <span className="text-sm font-bold leading-none">{hoursToday}h</span>
           </div>
           <div className="bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-lg flex flex-col items-center min-w-[60px]">
              <span className="text-[8px] font-black text-zinc-400 uppercase tracking-tighter">Total H</span>
              <span className="text-sm font-bold text-zinc-900 leading-none">{grandTotalHours}h</span>
           </div>
           <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex flex-col items-center min-w-[60px]">
              <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">Questões</span>
              <span className="text-sm font-bold text-emerald-600 leading-none">{totalQuestions}</span>
           </div>
        </div>
      </div>

      {/* Seletor de Categoria (Filtro) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
         <div className="flex items-center gap-1.5 shrink-0 pr-3 border-r border-zinc-100 mr-1">
            <Filter className="w-3 h-3 text-zinc-300" />
            <span className="text-[9px] font-black text-zinc-400 uppercase">Filtrar:</span>
         </div>
         <button 
            onClick={() => setSelectedCategoryId("all")}
            className={cn(
               "px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all whitespace-nowrap",
               selectedCategoryId === "all" ? "bg-zinc-900 text-white shadow-sm" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
            )}
         >
            Todas
         </button>
         {months.map(month => (
            <button 
               key={month.id}
               onClick={() => setSelectedCategoryId(month.id)}
               className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all whitespace-nowrap",
                  selectedCategoryId === month.id ? "bg-zinc-900 text-white shadow-sm" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
               )}
            >
               {month.name}
            </button>
         ))}
      </div>

      {/* Tabela de Alta Densidade */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
            <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <LayoutList className="w-3 h-3" />
                Matérias & Produtividade
            </h2>
            <span className="text-[9px] font-bold text-zinc-300 uppercase">{filteredSubjects.length} Mostradas</span>
        </div>
        
        <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-zinc-50/50 border-b border-zinc-200">
                            <th className="px-3 py-2 text-[9px] font-black text-zinc-400 uppercase tracking-tighter">Matéria</th>
                            <th className="px-3 py-2 text-[9px] font-black text-zinc-400 uppercase tracking-tighter">Grupo</th>
                            <th className="px-3 py-2 text-[9px] font-black text-zinc-400 uppercase tracking-tighter text-right">Tempo</th>
                            <th className="px-3 py-2 text-[9px] font-black text-zinc-400 uppercase tracking-tighter text-right">Qtd. Q</th>
                            <th className="px-3 py-2 text-[9px] font-black text-zinc-400 uppercase tracking-tighter text-right">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {filteredSubjects.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-3 py-8 text-center text-zinc-400 text-[10px] italic">
                                    Nenhuma matéria nesta categoria.
                                </td>
                            </tr>
                        ) : (
                            filteredSubjects.map((subject) => {
                                const parentMonth = months.find(m => m.id === subject.monthId);
                                const totalHours = getSubjectHours(subject.id);
                                const totalQ = getQuestionsBySubject(subject.id);

                                return (
                                    <tr key={subject.id} className="hover:bg-zinc-50/80 transition-colors group">
                                        <td className="px-3 py-1.5">
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="w-3 h-3 text-zinc-300" />
                                                <div className="truncate">
                                                    <span className="block font-bold text-zinc-900 text-[11px] truncate leading-tight">{subject.title}</span>
                                                    {subject.tag && <span className="text-[8px] text-zinc-400 uppercase font-black block leading-none">{subject.tag}</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-1.5">
                                            <span className="text-[9px] text-zinc-500 font-bold bg-zinc-100 px-1 py-0.5 rounded truncate inline-block max-w-[80px]">
                                                {parentMonth?.name || "Geral"}
                                            </span>
                                        </td>
                                        <td className="px-3 py-1.5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Clock className="w-2.5 h-2.5 text-zinc-300" />
                                                <span className="font-mono font-bold text-zinc-900 text-xs">{totalHours}h</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-1.5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <CheckSquare className="w-2.5 h-2.5 text-emerald-400" />
                                                <span className="font-mono font-bold text-emerald-600 text-xs">{totalQ}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-1.5 text-right">
                                            <button 
                                                onClick={() => onStartStudy(subject.id)}
                                                className="text-zinc-300 hover:text-zinc-900 transition-colors"
                                            >
                                                <PlayCircle className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </section>

      {/* Informações de Apoio */}
      <div className="bg-white px-3 py-2 rounded-lg border border-zinc-100 flex items-center justify-between">
          <p className="text-zinc-400 text-[9px] font-medium leading-none">
             Dados acumulados de horas e exercícios.
          </p>
          <span className="text-[8px] font-black text-zinc-300 uppercase">QIsaque Lite</span>
      </div>
    </div>
  );
};

export default TodayTab;


import React, { useMemo } from "react";
import { useStudyStore } from "../../hooks/useStudyStore";
import { formatDate } from "../../lib/utils";
import { motion } from "framer-motion";
import { Clock, BookOpen, Calendar, ArrowUpRight, LayoutList, PlayCircle } from "lucide-react";
import { Button } from "../ui/button";

interface TodayTabProps {
  onStartStudy: (subjectId: string) => void;
}

const TodayTab: React.FC<TodayTabProps> = ({ onStartStudy }) => {
  const { subjects, sessions, settings, months } = useStudyStore();
  const todayStr = formatDate(new Date());

  // Calculate total hours today
  const hoursToday = useMemo(() => {
    const todaySessions = sessions.filter(s => s.date === todayStr && s.status === 'completed');
    return (todaySessions.reduce((acc, s) => acc + s.duration, 0) / 3600).toFixed(1);
  }, [sessions, todayStr]);

  // Calculate grand total hours
  const grandTotalHours = useMemo(() => {
    const completedSessions = sessions.filter(s => s.status === 'completed');
    return (completedSessions.reduce((acc, s) => acc + s.duration, 0) / 3600).toFixed(1);
  }, [sessions]);

  const getSubjectHours = (subjectId: string) => {
    const subjectSessions = sessions.filter(s => s.subjectId === subjectId && s.status === 'completed');
    const totalSeconds = subjectSessions.reduce((acc, s) => acc + s.duration, 0);
    return (totalSeconds / 3600).toFixed(1);
  };

  const displayName = settings.userName ? settings.userName.split(' ')[0] : 'Estudante';

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      {/* Welcome Header & Simple Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight">
            Olá, {displayName}.
          </h1>
          <p className="text-zinc-500 mt-2 text-lg">
            Acompanhamento em tempo real do seu tempo de estudo.
          </p>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
           <div className="bg-zinc-900 text-white p-6 rounded-3xl shadow-xl flex-1 md:flex-none md:min-w-[180px]">
              <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Hoje</span>
              <div className="flex items-baseline gap-1">
                 <span className="text-3xl font-bold">{hoursToday}</span>
                 <span className="text-sm font-medium opacity-60">horas</span>
              </div>
           </div>
           <div className="bg-white border border-zinc-200 p-6 rounded-3xl shadow-sm flex-1 md:flex-none md:min-w-[180px]">
              <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Total Acumulado</span>
              <div className="flex items-baseline gap-1">
                 <span className="text-3xl font-bold text-zinc-900">{grandTotalHours}</span>
                 <span className="text-sm font-medium text-zinc-400">horas</span>
              </div>
           </div>
        </div>
      </div>

      {/* Main Study Log Table */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-bold text-zinc-900 flex items-center gap-3">
                <LayoutList className="w-6 h-6 text-zinc-400" />
                Quadro Geral de Horas
            </h2>
            <div className="bg-zinc-100 px-3 py-1 rounded-full text-[10px] font-bold text-zinc-500 uppercase">
                {subjects.length} Matérias
            </div>
        </div>
        
        <div className="bg-white rounded-[2.5rem] border border-zinc-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-zinc-50/80 border-b border-zinc-200">
                            <th className="px-8 py-5 text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Matéria</th>
                            <th className="px-8 py-5 text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Categoria / Mês</th>
                            <th className="px-8 py-5 text-[11px] font-bold text-zinc-400 uppercase tracking-widest text-right">Tempo Acumulado</th>
                            <th className="px-8 py-5 text-[11px] font-bold text-zinc-400 uppercase tracking-widest text-right">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {subjects.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-8 py-20 text-center text-zinc-400 italic text-sm">
                                    Nenhuma matéria registrada. Adicione matérias na aba "Assuntos".
                                </td>
                            </tr>
                        ) : (
                            subjects.map((subject) => {
                                const parentMonth = months.find(m => m.id === subject.monthId);
                                const totalHours = getSubjectHours(subject.id);

                                return (
                                    <tr key={subject.id} className="hover:bg-zinc-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-zinc-100 flex items-center justify-center shrink-0 group-hover:bg-zinc-900 group-hover:text-white transition-all">
                                                    <BookOpen className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <span className="block font-bold text-zinc-900 text-base">{subject.title}</span>
                                                    {subject.tag && <span className="text-[10px] text-zinc-400 font-medium">{subject.tag}</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-sm text-zinc-500 font-medium">
                                                {parentMonth?.name || "Sem categoria"}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2.5">
                                                <Clock className="w-4 h-4 text-zinc-300" />
                                                <span className="font-mono font-bold text-zinc-900 text-xl tracking-tight">{totalHours}h</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button 
                                                onClick={() => onStartStudy(subject.id)}
                                                className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-900 font-bold text-xs uppercase tracking-tighter transition-colors"
                                            >
                                                Estudar <PlayCircle className="w-4 h-4" />
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

      {/* Footer Info */}
      <div className="bg-zinc-100/50 p-8 rounded-[2.5rem] border border-zinc-200 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
             <Calendar className="w-8 h-8 text-zinc-900" />
          </div>
          <div className="flex-1">
             <h4 className="font-bold text-zinc-900">Mantenha a Regularidade</h4>
             <p className="text-zinc-500 text-sm mt-1">
                Registrar cada minuto de estudo é essencial para uma análise precisa do seu desempenho em longo prazo.
             </p>
          </div>
          <Button variant="outline" className="h-12 rounded-2xl border-zinc-200 bg-white shadow-sm font-bold text-sm px-6">
             Exportar Relatório <ArrowUpRight className="ml-2 w-4 h-4" />
          </Button>
      </div>
    </div>
  );
};

export default TodayTab;
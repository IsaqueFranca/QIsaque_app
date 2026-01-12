
import React, { useMemo } from "react";
import { useStudyStore } from "../../hooks/useStudyStore";
import { formatDate } from "../../lib/utils";
import { motion } from "framer-motion";
import { Calendar, CheckCircle2, Play, Coffee, ArrowRight, Sun, Moon, Sunrise, BookOpen, Clock, LayoutList, TrendingUp } from "lucide-react";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { cn } from "../../lib/utils";

interface TodayTabProps {
  onStartStudy: (subjectId: string) => void;
}

const TodayTab: React.FC<TodayTabProps> = ({ onStartStudy }) => {
  const { subjects, sessions, settings, months } = useStudyStore();
  const today = new Date();
  const todayStr = formatDate(today);
  const monthId = todayStr.slice(0, 7);

  // Filter subjects scheduled for today
  const todaysSubjects = useMemo(() => {
    return subjects.filter(subject => {
      const schedule = subject.schedules?.[monthId];
      return schedule?.plannedDays?.includes(todayStr);
    });
  }, [subjects, monthId, todayStr]);

  // Greeting Logic
  const getGreeting = () => {
    const hour = today.getHours();
    if (hour < 12) return { text: "Bom dia", icon: Sunrise };
    if (hour < 18) return { text: "Boa tarde", icon: Sun };
    return { text: "Boa noite", icon: Moon };
  };
  const greeting = getGreeting();

  const getSubjectTotalHours = (subjectId: string) => {
    const subjectSessions = sessions.filter(
      s => s.subjectId === subjectId && s.status === 'completed'
    );
    const totalDuration = subjectSessions.reduce((acc, s) => acc + s.duration, 0);
    return (totalDuration / 3600).toFixed(1);
  };

  const getSubjectCompletion = (subject: any) => {
    if (!subject.subtopics || subject.subtopics.length === 0) return 0;
    const completed = subject.subtopics.filter((st: any) => st.isCompleted).length;
    return Math.round((completed / subject.subtopics.length) * 100);
  };

  const displayName = settings.userName ? settings.userName.split(' ')[0] : 'Estudante';

  return (
    <div className="space-y-12 max-w-6xl mx-auto">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 flex items-center gap-3">
            <greeting.icon className="w-8 h-8 text-orange-500" />
            {greeting.text}, {displayName}!
          </h1>
          <p className="text-zinc-500 mt-2 text-lg">
            Hoje é <span className="font-semibold text-zinc-700 capitalize">{today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>.
          </p>
        </div>
        
        <div className="flex gap-4">
           {todaysSubjects.length > 0 && (
            <div className="bg-white px-5 py-3 rounded-2xl border border-zinc-100 shadow-sm flex items-center gap-4">
                <div className="text-right">
                <span className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Metas de Hoje</span>
                <span className="text-xl font-bold text-indigo-600">{todaysSubjects.length} matérias</span>
                </div>
                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-indigo-600" />
                </div>
            </div>
            )}
        </div>
      </div>

      {/* NEW: Overall Subject Performance Table */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                <LayoutList className="w-5 h-5 text-indigo-500" />
                Resumo Geral de Estudos
            </h2>
            <span className="text-xs text-zinc-500 font-medium">Visualização total de desempenho</span>
        </div>
        
        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-zinc-50/50 border-b border-zinc-100">
                            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Matéria</th>
                            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Assunto Principal</th>
                            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest text-center">Progresso</th>
                            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest text-right">Tempo Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                        {subjects.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-zinc-400 italic">
                                    Nenhuma matéria cadastrada ainda.
                                </td>
                            </tr>
                        ) : (
                            subjects.map((subject) => {
                                const parentMonth = months.find(m => m.id === subject.monthId);
                                const progress = getSubjectCompletion(subject);
                                const totalHours = getSubjectTotalHours(subject.id);

                                return (
                                    <tr key={subject.id} className="hover:bg-zinc-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                                                    <BookOpen className="w-4 h-4 text-indigo-500" />
                                                </div>
                                                <span className="font-bold text-zinc-800 text-sm">{subject.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-zinc-500 font-medium">
                                            {parentMonth?.name || "Geral"}
                                        </td>
                                        <td className="px-6 py-4 min-w-[140px]">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                                    <span>Conclusão</span>
                                                    <span>{progress}%</span>
                                                </div>
                                                <Progress value={progress} className="h-1.5" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                                                <span className="font-mono font-bold text-zinc-900 text-base">{totalHours}h</span>
                                            </div>
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

      {/* Today's Planning Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 px-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-bold text-zinc-900">Planejamento para Hoje</h2>
        </div>

        {todaysSubjects.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-dashed border-zinc-200 shadow-sm text-center px-4"
          >
            <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6">
               <Coffee className="w-12 h-12 text-orange-400" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">Dia Livre!</h2>
            <p className="text-zinc-500 max-w-md mx-auto leading-relaxed">
              Nenhuma matéria foi agendada para hoje no seu cronograma. Aproveite para descansar ou adiantar o conteúdo de amanhã.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {todaysSubjects.map((subject, index) => {
                const subjectSessions = sessions.filter(
                    s => s.subjectId === subject.id && s.date === todayStr && s.status === 'completed'
                );
                const todaysMinutes = Math.round(subjectSessions.reduce((acc, s) => acc + s.duration, 0) / 60);
                const isStarted = todaysMinutes > 0;
                
                return (
                  <motion.div
                    key={subject.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "bg-white p-6 rounded-[2rem] border transition-all hover:shadow-lg group relative overflow-hidden",
                      isStarted ? "border-green-200 shadow-green-100/50" : "border-zinc-100 shadow-sm"
                    )}
                  >
                    {isStarted && (
                       <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                          EM ANDAMENTO
                       </div>
                    )}

                    <div className="flex justify-between items-start mb-6">
                       <div className="flex-1">
                          <h3 className="text-xl font-bold text-zinc-900 line-clamp-1" title={subject.title}>
                             {subject.title}
                          </h3>
                          {subject.tag && (
                            <span className="inline-block mt-2 text-xs font-medium px-2.5 py-1 bg-zinc-100 text-zinc-600 rounded-lg">
                               {subject.tag}
                            </span>
                          )}
                       </div>
                       <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center shrink-0 ml-4 group-hover:scale-110 transition-transform">
                          <BookOpen className="w-6 h-6 text-zinc-400" />
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div className="flex items-center gap-4 text-sm">
                          <div className={cn(
                             "flex items-center gap-2 px-3 py-2 rounded-xl border",
                             isStarted ? "bg-green-50 border-green-100 text-green-700" : "bg-zinc-50 border-zinc-100 text-zinc-500"
                          )}>
                             <CheckCircle2 className="w-4 h-4" />
                             <span className="font-medium">{todaysMinutes > 0 ? `${todaysMinutes} min estudados` : "Não iniciado"}</span>
                          </div>
                       </div>

                       <Button 
                         className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-indigo-200/50 group-hover:bg-indigo-700 transition-all"
                         onClick={() => onStartStudy(subject.id)}
                       >
                         <Play className="w-4 h-4 mr-2 fill-current" />
                         {isStarted ? "Continuar Estudando" : "Começar Agora"}
                         <ArrowRight className="w-4 h-4 ml-auto opacity-50" />
                       </Button>
                    </div>
                  </motion.div>
                );
             })}
          </div>
        )}
      </section>
    </div>
  );
};

export default TodayTab;

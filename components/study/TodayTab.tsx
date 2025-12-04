
import React, { useMemo } from "react";
import { useStudyStore } from "../../hooks/useStudyStore";
import { formatDate } from "../../lib/utils";
import { motion } from "framer-motion";
import { Calendar, CheckCircle2, Play, Coffee, ArrowRight, Sun, Moon, Sunrise, BookOpen } from "lucide-react";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { cn } from "../../lib/utils";

interface TodayTabProps {
  onStartStudy: (subjectId: string) => void;
}

const TodayTab: React.FC<TodayTabProps> = ({ onStartStudy }) => {
  const { subjects, sessions, settings } = useStudyStore();
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

  const getSubjectTodayStats = (subjectId: string) => {
    const todaysSessions = sessions.filter(
      s => s.subjectId === subjectId && s.date === todayStr && s.status === 'completed'
    );
    const totalDuration = todaysSessions.reduce((acc, s) => acc + s.duration, 0);
    return {
      count: todaysSessions.length,
      minutes: Math.round(totalDuration / 60)
    };
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 flex items-center gap-3">
            <greeting.icon className="w-8 h-8 text-orange-500" />
            {greeting.text}, {settings.userName.split(' ')[0]}!
          </h1>
          <p className="text-zinc-500 mt-2 text-lg">
            Hoje é <span className="font-semibold text-zinc-700 capitalize">{today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>.
          </p>
        </div>
        
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

      {/* Content Grid */}
      <div className="space-y-6">
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
            <div className="mt-8 flex gap-4">
              <Button variant="outline" className="rounded-xl h-12 px-6" onClick={() => {}}>
                Ver Cronograma Completo
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {todaysSubjects.map((subject, index) => {
                const stats = getSubjectTodayStats(subject.id);
                const isStarted = stats.count > 0;
                
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
                             <span className="font-medium">{stats.count > 0 ? `${stats.minutes} min estudados` : "Não iniciado"}</span>
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
      </div>
    </div>
  );
};

export default TodayTab;

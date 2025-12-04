
import React, { useState, useEffect } from 'react';
import { Session, Month, Subject } from "../../types";
import { BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Bar } from 'recharts';
import { Progress } from "../ui/progress";
import { Clock, Trophy, Flame, Calendar, BrainCircuit, BarChart3 } from "lucide-react";
import StudyHeatmap from "./StudyHeatmap";
import { useStudyStore } from "../../hooks/useStudyStore";
import { generateBehavioralInsights } from "../../services/geminiService";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

interface StatisticsTabProps {
  months: Month[];
  subjects: Subject[];
  monthlyGoalHours: number;
  getSessionsByMonth: (monthId: string) => Session[];
  getSubjectsByMonthId: (monthId: string) => Subject[];
}

interface SubjectStat {
  name: string;
  duration: number;
  count: number;
}

const StatisticsTab: React.FC<StatisticsTabProps> = ({
  months,
  subjects,
  monthlyGoalHours,
  getSessionsByMonth,
  getSubjectsByMonthId
}) => {
  const [selectedMonthId, setSelectedMonthId] = useState<string>("");
  const [aiInsights, setAiInsights] = useState<string>("");
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  const { getStreakStats, sessions: allSessions, settings } = useStudyStore();
  const streakStats = getStreakStats();

  useEffect(() => {
    if (months.length > 0 && !selectedMonthId) {
      setSelectedMonthId(months[0].id);
    }
  }, [months]);

  useEffect(() => {
    // Generate insights on mount
    const fetchInsights = async () => {
      setIsLoadingInsights(true);
      const text = await generateBehavioralInsights(streakStats, allSessions, settings.healthDegree);
      setAiInsights(text);
      setIsLoadingInsights(false);
    };
    if (streakStats.totalActiveDays > 0) {
      fetchInsights();
    }
  }, []);

  const sessions = selectedMonthId ? getSessionsByMonth(selectedMonthId) : [];
  const completedSessions = sessions.filter(s => s.status === 'completed');

  // Calculate stats
  const totalSeconds = completedSessions.reduce((acc, s) => acc + s.duration, 0);
  const totalHours = Math.floor(totalSeconds / 3600);
  const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
  
  const goalProgress = Math.min(100, (totalHours / monthlyGoalHours) * 100);

  // Group by Subject
  const subjectStats = completedSessions.reduce((acc, session) => {
    const subject = subjects.find(s => s.id === session.subjectId);
    if (!subject) return acc;
    
    if (!acc[subject.id]) {
      acc[subject.id] = {
        name: subject.title,
        duration: 0,
        count: 0
      };
    }
    acc[subject.id].duration += session.duration;
    acc[subject.id].count += 1;
    return acc;
  }, {} as Record<string, SubjectStat>);

  // Format for Chart and List
  const subjectList = (Object.values(subjectStats) as SubjectStat[])
    .sort((a, b) => b.duration - a.duration)
    .map(stat => ({
      name: stat.name,
      hours: Math.round((stat.duration / 3600) * 10) / 10,
      duration: stat.duration
    }));

  const topSubjects = subjectList.slice(0, 5); // For chart

  return (
    <div className="space-y-6">
      
      {/* Streak Hero Section */}
      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-8 overflow-hidden relative">
         <div className="flex items-center justify-between mb-8">
           <h3 className="font-bold text-lg flex items-center gap-3 text-zinc-900">
             <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-sky-600" />
             </div>
             Histórico Anual
           </h3>
           <div className="flex gap-6 text-sm">
              <div className="flex flex-col items-end">
                <span className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Sequência Atual</span>
                <span className="font-bold text-xl flex items-center text-orange-500 mt-0.5">
                  <Flame className="w-5 h-5 mr-1.5 fill-current" />
                  {streakStats.currentStreak} dias
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-zinc-500 font-medium text-xs uppercase tracking-wider">Recorde</span>
                <span className="font-bold text-xl text-zinc-900 mt-0.5">{streakStats.longestStreak} dias</span>
              </div>
           </div>
         </div>
         {/* Container for better visibility of empty cells */}
         <div className="bg-zinc-50/50 p-6 rounded-2xl border border-dashed border-zinc-200">
           <StudyHeatmap dayMap={streakStats.dayMap} />
         </div>
      </div>

      {/* AI Behavioral Insights */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-indigo-100 p-8 rounded-3xl relative overflow-hidden shadow-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-50 rounded-lg">
             <BrainCircuit className="w-5 h-5 text-indigo-600" />
          </div>
          <h3 className="font-bold text-indigo-950">Análise Comportamental</h3>
        </div>
        
        {isLoadingInsights ? (
          <div className="animate-pulse flex space-x-4">
             <div className="flex-1 space-y-3 py-1">
               <div className="h-2 bg-indigo-50 rounded w-3/4"></div>
               <div className="h-2 bg-indigo-50 rounded w-5/6"></div>
             </div>
          </div>
        ) : aiInsights ? (
          <div className="text-sm text-indigo-900/80 whitespace-pre-line leading-relaxed font-medium">
            {aiInsights}
          </div>
        ) : (
          <p className="text-sm text-indigo-400">Registre mais sessões para receber insights inteligentes da IA.</p>
        )}
      </motion.div>

      {/* Monthly Stats Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Selector & Totals */}
        <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm flex flex-col justify-between">
           <div className="mb-8">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 block ml-1">
                Filtrar Mês
              </label>
              <div className="relative">
                <select 
                  className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-white text-zinc-900 appearance-none text-sm font-medium focus:ring-2 focus:ring-sky-500/20 outline-none transition-all hover:border-zinc-300"
                  value={selectedMonthId}
                  onChange={(e) => setSelectedMonthId(e.target.value)}
                >
                  {months.length === 0 && <option className="text-zinc-900 bg-white">Nenhum mês cadastrado</option>}
                  {months.map(m => (
                    <option key={m.id} value={m.id} className="text-zinc-900 bg-white">{m.name}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
           </div>

           <div>
              <div className="flex items-end justify-between mb-6">
                <div>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Tempo Total no Mês</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-zinc-900 tracking-tight">{totalHours}</span>
                    <span className="text-lg text-zinc-500 font-medium">h {totalMinutes}m</span>
                  </div>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-600 mb-1">
                   <Clock className="w-7 h-7" />
                </div>
              </div>
              
              <div className="space-y-3 bg-zinc-50 p-4 rounded-2xl">
                <div className="flex justify-between text-xs font-medium">
                   <span className="text-zinc-600">Progresso da Meta</span>
                   <span className="text-zinc-900">{Math.round(goalProgress)}% de {monthlyGoalHours}h</span>
                </div>
                <Progress value={goalProgress} className="h-2 bg-zinc-200" />
              </div>
           </div>
        </div>

        {/* Chart */}
        <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm min-h-[300px] flex flex-col">
           <h3 className="font-bold text-zinc-900 mb-6 flex items-center gap-2">
             Top Assuntos
           </h3>
           {subjectList.length > 0 ? (
             <div className="flex-1 w-full min-h-[200px]">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={topSubjects} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }} barGap={2}>
                   <XAxis type="number" hide />
                   <YAxis 
                     type="category" 
                     dataKey="name" 
                     width={100} 
                     tick={{fontSize: 11, fill: '#52525b', fontWeight: 500}} 
                     interval={0}
                     axisLine={false}
                     tickLine={false}
                   />
                   <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.15)', padding: '12px' }}
                   />
                   <Bar dataKey="hours" radius={[0, 6, 6, 0]} barSize={24} background={{ fill: '#f4f4f5' }}>
                      {topSubjects.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(200, 95%, ${45 + index * 5}%)`} />
                      ))}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </div>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 text-sm border-2 border-dashed border-zinc-100 rounded-2xl bg-zinc-50">
               <BarChart3 className="w-8 h-8 mb-2 opacity-20" />
               Sem dados suficientes.
             </div>
           )}
        </div>
      </div>

      {/* Ranking */}
      <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm">
        <h3 className="font-bold text-zinc-900 mb-6 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" /> Ranking Detalhado
        </h3>
        {subjectList.length > 0 ? (
          <div className="space-y-2">
             {subjectList.map((item, index) => (
               <div key={index} className="flex items-center justify-between p-3 rounded-2xl hover:bg-zinc-50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      "font-mono text-xs w-8 h-8 flex items-center justify-center rounded-xl font-bold transition-transform group-hover:scale-110",
                      index === 0 ? "bg-amber-100 text-amber-700 shadow-sm" : 
                      index === 1 ? "bg-slate-100 text-slate-700 shadow-sm" : 
                      index === 2 ? "bg-orange-50 text-orange-700 shadow-sm" : "bg-transparent text-zinc-400"
                    )}>{index + 1}</span>
                    <span className="font-medium text-sm text-zinc-700 truncate max-w-[200px]">{item.name}</span>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div className="w-24 h-1.5 bg-zinc-100 rounded-full overflow-hidden hidden sm:block">
                       <div className="h-full bg-sky-500 rounded-full" style={{ width: `${(item.duration / (topSubjects[0].duration || 1)) * 100}%` }} />
                    </div>
                    <div className="min-w-[60px] text-right">
                      <span className="text-sm font-bold block text-zinc-900">{item.hours}h</span>
                      <span className="text-[10px] text-zinc-400 font-medium">{Math.round(item.duration / 60)} min</span>
                    </div>
                  </div>
               </div>
             ))}
          </div>
        ) : (
           <p className="text-sm text-zinc-400 text-center py-8">Estude para subir no ranking!</p>
        )}
      </div>
    </div>
  );
};

export default StatisticsTab;


import React, { useState, useEffect } from 'react';
import { Session, Month, Subject } from "../../types";
import { BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Bar } from 'recharts';
import { Progress } from "../ui/progress";
import { Clock, Trophy, Flame, Calendar, BrainCircuit, BarChart3, CheckSquare } from "lucide-react";
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
  questions: number;
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

  const { getStreakStats, sessions: allSessions, settings, getTotalQuestions } = useStudyStore();
  const streakStats = getStreakStats();

  useEffect(() => {
    if (months.length > 0 && !selectedMonthId) {
      setSelectedMonthId(months[0].id);
    }
  }, [months]);

  useEffect(() => {
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

  const totalSeconds = completedSessions.reduce((acc, s) => acc + s.duration, 0);
  const totalHours = Math.floor(totalSeconds / 3600);
  const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
  const totalQuestionsMonth = completedSessions.reduce((acc, s) => acc + (s.questionsSolved || 0), 0);
  
  const goalProgress = Math.min(100, (totalHours / monthlyGoalHours) * 100);

  const subjectStats = completedSessions.reduce((acc, session) => {
    const subject = subjects.find(s => s.id === session.subjectId);
    if (!subject) return acc;
    
    if (!acc[subject.id]) {
      acc[subject.id] = {
        name: subject.title,
        duration: 0,
        count: 0,
        questions: 0
      };
    }
    acc[subject.id].duration += session.duration;
    acc[subject.id].count += 1;
    acc[subject.id].questions += (session.questionsSolved || 0);
    return acc;
  }, {} as Record<string, SubjectStat>);

  const subjectList = (Object.values(subjectStats) as SubjectStat[])
    .sort((a, b) => b.duration - a.duration)
    .map(stat => ({
      name: stat.name,
      hours: Math.round((stat.duration / 3600) * 10) / 10,
      duration: stat.duration,
      questions: stat.questions
    }));

  const topSubjects = subjectList.slice(0, 5);

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
         <div className="bg-zinc-50/50 p-6 rounded-2xl border border-dashed border-zinc-200">
           <StudyHeatmap dayMap={streakStats.dayMap} />
         </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Monthly Focus */}
        <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm flex flex-col justify-between">
           <div className="mb-6">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 block ml-1">
                Filtrar Mês
              </label>
              <select 
                className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-white text-zinc-900 appearance-none text-sm font-medium outline-none transition-all hover:border-zinc-300"
                value={selectedMonthId}
                onChange={(e) => setSelectedMonthId(e.target.value)}
              >
                {months.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
           </div>

           <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Horas Mensais</p>
                  <div className="flex items-baseline gap-1 text-zinc-900">
                    <span className="text-4xl font-black">{totalHours}</span>
                    <span className="text-sm font-medium text-zinc-400">h {totalMinutes}m</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1 text-right">Questões</p>
                  <div className="flex items-baseline gap-1 text-emerald-600 justify-end">
                    <span className="text-4xl font-black">{totalQuestionsMonth}</span>
                    <CheckSquare className="w-4 h-4" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                   <span className="text-zinc-400">Meta de Horas</span>
                   <span className="text-zinc-900">{Math.round(goalProgress)}% de {monthlyGoalHours}h</span>
                </div>
                <Progress value={goalProgress} className="h-1.5" />
              </div>
           </div>
        </div>

        {/* Top Subjects Chart */}
        <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm flex flex-col">
           <h3 className="font-bold text-zinc-900 mb-6 text-sm uppercase tracking-widest text-zinc-400">Destaque por Assunto</h3>
           {subjectList.length > 0 ? (
             <div className="flex-1 w-full min-h-[200px]">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={topSubjects} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
                   <XAxis type="number" hide />
                   <YAxis 
                     type="category" 
                     dataKey="name" 
                     width={100} 
                     tick={{fontSize: 10, fill: '#71717a', fontWeight: 600}} 
                     axisLine={false}
                     tickLine={false}
                   />
                   <Tooltip cursor={{fill: 'transparent'}} />
                   <Bar dataKey="questions" name="Questões" radius={[0, 4, 4, 0]} barSize={20} fill="#10b981" />
                 </BarChart>
               </ResponsiveContainer>
             </div>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 text-sm italic">
               Sem registros.
             </div>
           )}
        </div>
      </div>

      {/* Ranking Detalhado */}
      <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm">
        <h3 className="font-bold text-zinc-900 mb-6 flex items-center gap-2 text-sm uppercase tracking-widest">
          <Trophy className="w-4 h-4 text-amber-500" /> Histórico por Matéria
        </h3>
        <div className="space-y-2">
            {subjectList.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-xl border border-zinc-50 hover:bg-zinc-50 transition-colors">
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black text-zinc-300 w-4">{index + 1}</span>
                        <span className="font-bold text-[11px] text-zinc-700">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <span className="text-[11px] font-black block text-zinc-900">{item.hours}h</span>
                            <span className="text-[8px] text-zinc-400 uppercase font-bold">Tempo</span>
                        </div>
                        <div className="text-right min-w-[50px]">
                            <span className="text-[11px] font-black block text-emerald-600">{item.questions}</span>
                            <span className="text-[8px] text-emerald-400 uppercase font-bold">Questões</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default StatisticsTab;

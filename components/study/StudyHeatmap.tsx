import React, { useState, useMemo } from "react";
import { format, getDay } from "date-fns";
import ptBR from "date-fns/locale/pt-BR";
import { generateYearDays, getIntensityLevel, formatDate, cn } from "../../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Calendar } from "lucide-react";
import { Button } from "../ui/button";

interface StudyHeatmapProps {
  dayMap: Map<string, number>;
}

const StudyHeatmap: React.FC<StudyHeatmapProps> = ({ dayMap }) => {
  const [selectedDay, setSelectedDay] = useState<{ date: Date; minutes: number } | null>(null);
  
  const days = useMemo(() => generateYearDays(), []);
  
  // Calculate start padding to align the first day to the correct row (Sunday=1, Monday=2...)
  const startDay = days.length > 0 ? getDay(days[0]) : 0;
  
  const paddedDays = useMemo(() => {
    return [...Array(startDay).fill(null), ...days];
  }, [days, startDay]);

  // Rolling 12 months labels
  const monthLabels = useMemo(() => {
    const today = new Date();
    const labels = [];
    for(let i=11; i>=0; i--) {
       // Create date at 1st of month to avoid overflow (e.g. 31st Mar - 1 month = 28th/29th Feb vs 3rd Mar)
       const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
       labels.push(format(date, 'MMM', { locale: ptBR }));
    }
    return labels;
  }, []);

  const getColorClass = (level: number) => {
    switch (level) {
      case 0: return "bg-zinc-100 hover:bg-zinc-200"; 
      case 1: return "bg-sky-200";
      case 2: return "bg-sky-300";
      case 3: return "bg-sky-400";
      case 4: return "bg-sky-500";
      default: return "bg-zinc-100";
    }
  };

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="min-w-[700px]">
        {/* Month Labels */}
        <div className="flex text-xs font-medium text-zinc-600 pl-10 mb-3">
           {monthLabels.map((m, i) => (
             <span key={i} className="flex-1 text-center capitalize">{m}</span>
           ))}
        </div>
        
        <div className="flex">
          {/* Day Labels */}
          <div className="grid grid-rows-7 gap-1 text-[10px] font-medium text-zinc-500 mr-3 w-8 text-right">
             <span className="h-3 flex items-center justify-end"></span>
             <span className="h-3 flex items-center justify-end">Seg</span>
             <span className="h-3 flex items-center justify-end"></span>
             <span className="h-3 flex items-center justify-end">Qua</span>
             <span className="h-3 flex items-center justify-end"></span>
             <span className="h-3 flex items-center justify-end">Sex</span>
             <span className="h-3 flex items-center justify-end"></span>
          </div>
          
          {/* Heatmap Grid */}
          <div className="grid grid-rows-7 grid-flow-col gap-1">
            {paddedDays.map((day, i) => {
              if (!day) return <div key={`pad-${i}`} className="w-3 h-3 bg-transparent" />;

              const dateStr = formatDate(day);
              const minutes = Math.floor(dayMap.get(dateStr) || 0);
              const level = getIntensityLevel(minutes);

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDay({ date: day, minutes })}
                  className={cn(
                    "w-3 h-3 rounded-[2px] cursor-pointer transition-all hover:scale-125 hover:ring-2 ring-offset-1 ring-sky-300 relative z-0 hover:z-10",
                    getColorClass(level)
                  )}
                  title={`${format(day, "dd/MM/yyyy")}: ${minutes} minutos`}
                />
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-6 text-xs font-medium text-zinc-500 justify-end pr-4">
          <span>Menos</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-[2px] bg-zinc-100" />
            <div className="w-3 h-3 rounded-[2px] bg-sky-200" />
            <div className="w-3 h-3 rounded-[2px] bg-sky-300" />
            <div className="w-3 h-3 rounded-[2px] bg-sky-400" />
            <div className="w-3 h-3 rounded-[2px] bg-sky-500" />
          </div>
          <span>Mais</span>
        </div>
      </div>

      {/* Day Detail Modal */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-sm p-4"
            onClick={() => setSelectedDay(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 10 }}
              className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-2xl w-full max-w-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                   <h3 className="font-semibold text-lg flex items-center gap-2 text-zinc-900">
                     <Calendar className="w-4 h-4 text-sky-500" />
                     {format(selectedDay.date, "dd 'de' MMMM", { locale: ptBR })}
                   </h3>
                   <span className="text-xs text-zinc-500 capitalize">
                     {format(selectedDay.date, "EEEE", { locale: ptBR })}
                   </span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-zinc-100" onClick={() => setSelectedDay(null)}>
                  <X className="w-4 h-4 text-zinc-400" />
                </Button>
              </div>

              <div className="flex items-center justify-between bg-zinc-50 p-4 rounded-xl">
                 <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", 
                      selectedDay.minutes > 0 ? "bg-sky-500 text-white" : "bg-zinc-200 text-zinc-400"
                    )}>
                       <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-zinc-900">{selectedDay.minutes}</p>
                      <p className="text-xs text-zinc-500">Minutos estudados</p>
                    </div>
                 </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudyHeatmap;
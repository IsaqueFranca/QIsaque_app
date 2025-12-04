import React, { useState } from "react";
import { Month } from "../../types";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, Check, X, Calendar, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Progress } from "../ui/progress";
import { useStudyStore } from "../../hooks/useStudyStore";
import { cn } from "../../lib/utils";

interface MonthGridProps {
  months: Month[];
  onSelectMonth: (monthId: string) => void;
}

const MonthGrid: React.FC<MonthGridProps> = ({ months, onSelectMonth }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newMonthName, setNewMonthName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { addMonth, editMonth, deleteMonth, getSubjectsByMonthId } = useStudyStore();

  const handleAddMonth = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMonthName.trim()) {
      addMonth(newMonthName);
      setNewMonthName("");
      setIsAdding(false);
    }
  };

  const handleEdit = (month: Month) => {
    setEditingId(month.id);
    setEditName(month.name);
  };

  const saveEdit = (id: string) => {
    if (editName.trim()) {
      editMonth(id, editName);
    }
    setEditingId(null);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMonth(deleteId);
      setDeleteId(null);
    }
  };

  const getMonthProgress = (monthId: string) => {
    const subjects = getSubjectsByMonthId(monthId);
    if (subjects.length === 0) return 0;
    
    let totalSubtopics = 0;
    let completedSubtopics = 0;
    
    subjects.forEach(s => {
      totalSubtopics += s.subtopics.length;
      completedSubtopics += s.subtopics.filter(st => st.isCompleted).length;
    });

    if (totalSubtopics === 0) return 0;
    return Math.round((completedSubtopics / totalSubtopics) * 100);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h3 className="text-2xl font-bold tracking-tight text-zinc-900">Planejamento</h3>
           <p className="text-zinc-500 text-sm">Organize seus estudos por períodos.</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} variant="default" className="rounded-full px-6">
          {isAdding ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {isAdding ? "Cancelar" : "Novo Mês"}
        </Button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleAddMonth}
            className="flex gap-3 mb-8 overflow-hidden bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm"
          >
            <Input
              value={newMonthName}
              onChange={(e) => setNewMonthName(e.target.value)}
              placeholder="Ex: Março - Reta Final"
              className="flex-1 bg-white h-12 text-lg px-4 border-zinc-200"
              autoFocus
            />
            <Button type="submit" size="lg" className="rounded-xl h-12 px-8">Salvar</Button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {months.map((month) => {
          const progress = getMonthProgress(month.id);
          const isEditing = editingId === month.id;
          
          return (
            <motion.div
              key={month.id}
              whileHover={!isEditing ? { y: -4, scale: 1.01 } : {}}
              className={cn(
                "group relative border border-zinc-100 bg-white rounded-[2rem] p-6 transition-all duration-300",
                "hover:shadow-2xl hover:shadow-zinc-200/50 hover:border-zinc-200"
              )}
            >
              <div className="flex justify-between items-start mb-8 h-10">
                {isEditing ? (
                  <div className="flex gap-2 w-full">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-9"
                    />
                    <Button size="icon" variant="default" className="h-9 w-9 rounded-full shrink-0" onClick={() => saveEdit(month.id)}>
                      <Check className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                     <div 
                        className="w-10 h-10 rounded-full bg-zinc-900 text-zinc-50 flex items-center justify-center shadow-lg shadow-zinc-500/10 group-hover:scale-110 transition-transform duration-300"
                     >
                        <Calendar className="w-5 h-5" />
                     </div>
                     <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full hover:bg-zinc-100"
                          onClick={(e) => { e.stopPropagation(); handleEdit(month); }}
                        >
                          <Edit2 className="w-3.5 h-3.5 text-zinc-500" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full hover:bg-red-50"
                          onClick={(e) => { e.stopPropagation(); setDeleteId(month.id); }}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-zinc-400 hover:text-red-500" />
                        </Button>
                      </div>
                  </>
                )}
              </div>

              <div 
                className="cursor-pointer space-y-4" 
                onClick={() => !isEditing && onSelectMonth(month.id)}
              >
                <div>
                   <h4 className="font-bold text-xl text-zinc-900 group-hover:text-black transition-colors">{month.name}</h4>
                   <p className="text-zinc-500 text-sm mt-1 flex items-center gap-2 group-hover:gap-3 transition-all">
                      {getSubjectsByMonthId(month.id).length} tópicos
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                   </p>
                </div>
                
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs font-semibold tracking-wide text-zinc-400 uppercase">
                    <span>Progresso</span>
                    <span className="text-zinc-900">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-1 bg-zinc-100" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {months.length === 0 && !isAdding && (
         <div className="text-center py-20">
           <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
             <Calendar className="w-8 h-8 text-zinc-300" />
           </div>
           <h3 className="text-lg font-semibold text-zinc-900">Comece sua jornada</h3>
           <p className="text-zinc-500 max-w-xs mx-auto mt-2 mb-6">Crie seu primeiro mês de estudos para organizar suas metas.</p>
           <Button onClick={() => setIsAdding(true)} variant="default" size="lg" className="rounded-full">Criar Mês</Button>
         </div>
      )}

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-sm p-4"
            onClick={() => setDeleteId(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-zinc-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                 <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-bold text-xl text-zinc-900 mb-2">Excluir Mês?</h3>
              <p className="text-zinc-500 leading-relaxed mb-8">
                Esta ação é irreversível. Todos os dados associados a este mês serão apagados.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-12" onClick={() => setDeleteId(null)}>Voltar</Button>
                <Button variant="destructive" className="h-12" onClick={confirmDelete}>Confirmar</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MonthGrid;
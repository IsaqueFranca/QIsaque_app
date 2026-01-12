
import React, { useState } from "react";
import { Subject } from "../../types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ArrowLeft, Plus, Trash2, BookOpen, Clock, Tag as TagIcon, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStudyStore } from "../../hooks/useStudyStore";

interface SubjectListProps {
  monthId: string;
  subjects: Subject[];
  onBack: () => void;
}

const SubjectList: React.FC<SubjectListProps> = ({
  monthId,
  subjects,
  onBack,
}) => {
  const { addSubject, deleteSubject, getTimeBySubject } = useStudyStore();
  const [newSubjectName, setNewSubjectName] = useState("");
  const [deleteSubjectId, setDeleteSubjectId] = useState<string | null>(null);

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubjectName.trim()) {
      addSubject(newSubjectName, monthId);
      setNewSubjectName("");
    }
  };

  const confirmDelete = () => {
    if (deleteSubjectId) {
      deleteSubject(deleteSubjectId);
      setDeleteSubjectId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 pb-2 border-b border-zinc-100">
        <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2 hover:bg-zinc-100 rounded-full">
            <ArrowLeft className="w-6 h-6 text-zinc-500" />
        </Button>
        <div>
            <h2 className="text-2xl font-bold text-zinc-900">Gerenciar Matérias</h2>
            <div className="text-xs text-zinc-400 font-bold uppercase tracking-widest">
                {subjects.length} Itens nesta categoria
            </div>
        </div>
      </div>

      <div className="bg-white p-2 rounded-[2rem] border border-zinc-200 shadow-sm">
          <form onSubmit={handleAddSubject} className="relative flex items-center">
             <div className="absolute left-6 text-zinc-300 pointer-events-none">
                 <BookOpen className="w-5 h-5" />
             </div>
             <Input 
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                placeholder="Ex: Anatomia Clínica"
                className="pl-14 h-16 border-none shadow-none text-lg bg-transparent focus-visible:ring-0"
             />
             <Button 
                type="submit" 
                size="lg" 
                className="h-12 px-8 rounded-2xl mr-2 font-bold bg-zinc-900 text-white"
                disabled={!newSubjectName.trim()}
             >
                Adicionar
             </Button>
          </form>
      </div>

      <div className="grid gap-4">
        {subjects.length === 0 ? (
          <div className="text-center py-20 bg-zinc-50 rounded-[2.5rem] border-2 border-dashed border-zinc-200">
            <BookOpen className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-zinc-900">Lista Vazia</h3>
            <p className="text-zinc-500 max-w-xs mx-auto mt-2">
                Comece adicionando as disciplinas que você pretende estudar.
            </p>
          </div>
        ) : (
          subjects.map((subject) => (
            <motion.div
              key={subject.id}
              className="group border border-zinc-200 rounded-3xl bg-white p-6 shadow-sm flex items-center justify-between hover:border-zinc-900 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-900 font-bold border border-zinc-100 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-zinc-900">{subject.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400 font-medium uppercase tracking-tighter">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {(getTimeBySubject(subject.id) / 3600).toFixed(1)}h estudadas
                    </span>
                    {subject.tag && (
                      <span className="flex items-center gap-1">
                        <TagIcon className="w-3 h-3" /> {subject.tag}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl text-zinc-300 hover:text-red-500 hover:bg-red-50"
                onClick={() => setDeleteSubjectId(subject.id)}
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {deleteSubjectId && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/30 backdrop-blur-sm p-4"
            onClick={() => setDeleteSubjectId(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 10 }}
              className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-zinc-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
                  <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-bold text-xl text-zinc-900 mb-2">Excluir Matéria?</h3>
              <p className="text-zinc-500 mb-8 text-sm leading-relaxed">
                Todo o histórico de horas desta matéria será removido permanentemente.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setDeleteSubjectId(null)}>Cancelar</Button>
                <Button variant="destructive" className="rounded-xl px-6" onClick={confirmDelete}>Excluir</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SubjectList;

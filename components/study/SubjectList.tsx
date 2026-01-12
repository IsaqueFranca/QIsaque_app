
import React, { useState } from "react";
import { Subject } from "../../types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ArrowLeft, Plus, Trash2, BookOpen, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStudyStore } from "../../hooks/useStudyStore";

interface SubjectListProps {
  monthId: string;
  subjects: Subject[];
  onBack: () => void;
}

const SubjectList: React.FC<SubjectListProps> = ({ monthId, subjects, onBack }) => {
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 border-b border-zinc-100 pb-2">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-7 w-7 rounded-full">
            <ArrowLeft className="w-4 h-4 text-zinc-500" />
        </Button>
        <div>
            <h2 className="text-sm font-bold text-zinc-900">Gerenciar Matérias</h2>
            <div className="text-[9px] text-zinc-400 font-black uppercase tracking-widest">{subjects.length} Ativas</div>
        </div>
      </div>

      <div className="bg-white p-1 rounded-xl border border-zinc-200 shadow-sm">
          <form onSubmit={handleAddSubject} className="flex items-center gap-2 p-1">
             <Input value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} placeholder="Nova matéria..." className="h-8 text-xs border-none shadow-none focus-visible:ring-0" />
             <Button type="submit" size="sm" className="h-7 px-3 rounded-lg text-[10px] font-black uppercase" disabled={!newSubjectName.trim()}>
                Adicionar
             </Button>
          </form>
      </div>

      <div className="grid gap-2">
        {subjects.length === 0 ? (
          <div className="text-center py-10 bg-zinc-50 rounded-xl border-2 border-dashed border-zinc-100 text-zinc-300 text-xs italic">Lista vazia</div>
        ) : (
          subjects.map((subject) => (
            <div key={subject.id} className="group border border-zinc-100 rounded-lg bg-white p-2.5 flex items-center justify-between hover:border-zinc-300 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded bg-zinc-50 flex items-center justify-center border border-zinc-100 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-zinc-900 leading-none">{subject.title}</h3>
                  <span className="flex items-center gap-1 text-[9px] text-zinc-400 font-bold uppercase mt-1">
                    <Clock className="w-2 h-2" /> {(getTimeBySubject(subject.id) / 3600).toFixed(1)}h total
                  </span>
                </div>
              </div>
              <button onClick={() => setDeleteSubjectId(subject.id)} className="h-7 w-7 rounded-lg text-zinc-200 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {deleteSubjectId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/20 backdrop-blur-sm p-4" onClick={() => setDeleteSubjectId(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-xl p-5 max-w-xs w-full shadow-2xl border border-zinc-100" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-bold text-sm text-zinc-900 mb-1">Excluir Matéria?</h3>
              <p className="text-zinc-500 text-[10px] mb-4">Todo o histórico de horas desta matéria será removido.</p>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" className="text-[10px]" onClick={() => setDeleteSubjectId(null)}>Cancelar</Button>
                <Button variant="destructive" size="sm" className="text-[10px]" onClick={() => { deleteSubject(deleteSubjectId); setDeleteSubjectId(null); }}>Excluir</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SubjectList;


import React, { useState, useMemo } from "react";
import { Month } from "../../types";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, Check, X, FileText, ArrowRight, Copy } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useStudyStore } from "../../hooks/useStudyStore";
import { cn } from "../../lib/utils";

interface MonthGridProps {
  months: Month[];
  onSelectMonth: (monthId: string) => void;
}

const MonthGrid: React.FC<MonthGridProps> = ({ months, onSelectMonth }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newMonthName, setNewMonthName] = useState("");
  const [newMonthYear, setNewMonthYear] = useState(new Date().getFullYear());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { addMonth, editMonth, deleteMonth, duplicateMonth, getSubjectsByMonthId } = useStudyStore();

  const handleAddMonth = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMonthName.trim()) {
      addMonth(newMonthName, newMonthYear);
      setNewMonthName("");
      setIsAdding(false);
    }
  };

  const saveEdit = (id: string) => {
    if (editName.trim()) editMonth(id, editName);
    setEditingId(null);
  };

  const sortedMonths = useMemo(() => {
    return [...months].sort((a, b) => (b.year || 0) - (a.year || 0));
  }, [months]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div>
           <h3 className="text-base font-bold text-zinc-900 tracking-tight">Categorias de Matérias</h3>
           <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-tighter">Organização Geral</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} size="sm" className="h-8 rounded-lg text-[10px] uppercase font-black">
          {isAdding ? <X className="w-3 h-3 mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
          {isAdding ? "Cancelar" : "Nova Categoria"}
        </Button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            onSubmit={handleAddMonth}
            className="flex gap-2 mb-4 bg-white p-3 rounded-xl border border-zinc-100 shadow-sm"
          >
            <Input value={newMonthName} onChange={(e) => setNewMonthName(e.target.value)} placeholder="Ex: Ciclo Clínico" className="flex-[2] h-9 text-xs" autoFocus />
            <Input type="number" value={newMonthYear} onChange={(e) => setNewMonthYear(parseInt(e.target.value))} className="w-20 h-9 text-xs" />
            <Button type="submit" size="sm" className="h-9 px-4 rounded-lg text-[10px] uppercase font-bold">Criar</Button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sortedMonths.map((month) => {
          const isEditing = editingId === month.id;
          const subjectsCount = getSubjectsByMonthId(month.id).length;
          
          return (
            <div key={month.id} className="group relative border border-zinc-100 bg-white rounded-xl p-3 hover:border-zinc-300 transition-all flex flex-col justify-between min-h-[100px]">
              <div className="flex justify-between items-start mb-2">
                {isEditing ? (
                  <div className="flex gap-1 w-full">
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-7 text-xs" autoFocus />
                    <Button size="icon" className="h-7 w-7" onClick={() => saveEdit(month.id)}><Check className="w-3 h-3" /></Button>
                  </div>
                ) : (
                  <>
                     <div className="flex items-center gap-2">
                        <FileText className="w-3 h-3 text-zinc-300" />
                        <span className="text-[10px] font-black text-zinc-300 uppercase">{month.year}</span>
                     </div>
                     <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => duplicateMonth(month.id)} className="p-1 text-zinc-300 hover:text-indigo-500"><Copy className="w-3 h-3" /></button>
                        <button onClick={() => { setEditName(month.name); setEditingId(month.id); }} className="p-1 text-zinc-300 hover:text-zinc-600"><Edit2 className="w-3 h-3" /></button>
                        <button onClick={() => deleteMonth(month.id)} className="p-1 text-zinc-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                      </div>
                  </>
                )}
              </div>

              <div className="cursor-pointer" onClick={() => !isEditing && onSelectMonth(month.id)}>
                <h4 className="font-bold text-xs text-zinc-900 truncate">{month.name}</h4>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter flex items-center gap-1">
                    {subjectsCount} Matérias <ArrowRight className="w-2 h-2" />
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthGrid;

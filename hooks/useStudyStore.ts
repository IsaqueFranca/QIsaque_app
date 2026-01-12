
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Subject, Session, Settings, Month, User, SubjectSchedule } from '../types';
import { generateId, formatDate, calculateStreaks } from '../lib/utils';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface StudyState {
  user: User | null;
  months: Month[];
  subjects: Subject[];
  sessions: Session[];
  settings: Settings;
  activeScheduleMonths: string[];
  activeSubjectId: string | null;
  guestMode: boolean;
  setGuestMode: (mode: boolean) => void;

  setUser: (user: User | null) => void;
  loadFromCloud: (uid: string) => Promise<void>;
  
  addMonth: (name: string, year?: number) => void;
  editMonth: (id: string, name: string) => void;
  deleteMonth: (id: string) => void;
  duplicateMonth: (id: string) => void;

  addActiveScheduleMonth: (monthStr: string) => void;
  removeActiveScheduleMonth: (monthStr: string) => void;

  addSubject: (title: string, monthId: string, tag?: string) => string;
  updateSubject: (id: string, updates: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  toggleSubtopic: (subjectId: string, subtopicId: string) => void;
  
  toggleSubjectInMonth: (subjectId: string, monthStr: string) => void;
  updateSubjectSchedule: (subjectId: string, monthStr: string, updates: Partial<SubjectSchedule>) => void;
  toggleSubjectPlannedDay: (subjectId: string, monthStr: string, dateStr: string) => void;
  
  setActiveSubjectId: (id: string | null) => void;
  addSession: (session: Omit<Session, 'id'>) => void;
  deleteSession: (sessionId: string) => void;
  updateSessionStatus: (sessionId: string, status: 'completed' | 'incomplete') => void;
  updateSettings: (updates: Partial<Settings>) => void;

  getSubjectsByMonthId: (monthId: string) => Subject[];
  getSessionsByMonthId: (monthId: string) => Session[];
  getTimeBySubject: (subjectId: string) => number;
  getStreakStats: () => { currentStreak: number; longestStreak: number; totalActiveDays: number; dayMap: Map<string, number> };
}

let saveTimeout: ReturnType<typeof setTimeout>;
const saveToCloud = (state: StudyState) => {
  if (!db || !state.user?.uid) return;
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    try {
      const dataToSave = {
        months: state.months,
        subjects: state.subjects,
        sessions: state.sessions,
        settings: state.settings,
        activeScheduleMonths: state.activeScheduleMonths,
        lastUpdated: new Date().toISOString()
      };
      await setDoc(doc(db, "users", state.user!.uid), dataToSave, { merge: true });
    } catch (e) {
      console.error("Erro ao sincronizar:", e);
    }
  }, 2000);
};

export const useStudyStore = create<StudyState>()(
  persist(
    (set, get) => ({
      user: null,
      months: [{ id: 'default-1', name: 'Geral', year: new Date().getFullYear() }],
      subjects: [],
      sessions: [],
      settings: {
        pomodoroDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        monthlyGoalHours: 40,
        userName: '',
        finalGoal: 'Foco no Estudo',
        healthDegree: 'Medicine',
      },
      activeScheduleMonths: [formatDate(new Date()).slice(0, 7)],
      activeSubjectId: null,
      guestMode: false,
      setGuestMode: (mode) => set({ guestMode: mode }),

      setUser: (user) => set({ user }),
      
      loadFromCloud: async (uid) => {
        if (!db) return;
        try {
          const docRef = doc(db, "users", uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            set((state) => ({
              months: data.months || state.months,
              subjects: data.subjects || state.subjects,
              sessions: data.sessions || state.sessions,
              settings: data.settings || state.settings,
              activeScheduleMonths: data.activeScheduleMonths || state.activeScheduleMonths
            }));
          }
        } catch (e) { console.error(e); }
      },

      addMonth: (name, year) => {
        set((state) => ({
          months: [...state.months, { id: generateId(), name, year: year || new Date().getFullYear() }]
        }));
        saveToCloud(get());
      },

      editMonth: (id, name) => {
        set((state) => ({
          months: state.months.map(m => m.id === id ? { ...m, name } : m)
        }));
        saveToCloud(get());
      },

      deleteMonth: (id) => {
        set((state) => ({
          months: state.months.filter(m => m.id !== id),
          subjects: state.subjects.filter(s => s.monthId !== id)
        }));
        saveToCloud(get());
      },

      duplicateMonth: (id) => {
        const monthToDup = get().months.find(m => m.id === id);
        if (!monthToDup) return;
        
        const newMonthId = generateId();
        const newMonth = { ...monthToDup, id: newMonthId, name: `${monthToDup.name} (Cópia)` };
        
        const monthSubjects = get().subjects.filter(s => s.monthId === id);
        const newSubjects = monthSubjects.map(s => ({
          ...s,
          id: generateId(),
          monthId: newMonthId,
          studiedDates: [],
          schedules: {},
          subtopics: s.subtopics.map(st => ({ ...st, id: generateId() }))
        }));

        set((state) => ({
          months: [...state.months, newMonth],
          subjects: [...state.subjects, ...newSubjects]
        }));
        saveToCloud(get());
      },

      addActiveScheduleMonth: (monthStr) => {
        set((state) => {
           if (state.activeScheduleMonths.includes(monthStr)) return state;
           return { activeScheduleMonths: [...state.activeScheduleMonths, monthStr].sort() };
        });
        saveToCloud(get());
      },

      removeActiveScheduleMonth: (monthStr) => {
        set((state) => ({
           activeScheduleMonths: state.activeScheduleMonths.filter(m => m !== monthStr)
        }));
        saveToCloud(get());
      },

      addSubject: (title, monthId, tag) => {
        const newId = generateId();
        set((state) => ({
          subjects: [...state.subjects, {
            id: newId,
            title,
            monthId,
            tag,
            color: 'bg-zinc-900',
            studiedDates: [],
            schedules: {},
            subtopics: []
          }]
        }));
        saveToCloud(get());
        return newId;
      },

      updateSubject: (id, updates) => {
        set((state) => ({
          subjects: state.subjects.map(s => s.id === id ? { ...s, ...updates } : s)
        }));
        saveToCloud(get());
      },

      deleteSubject: (id) => {
        set((state) => ({
          subjects: state.subjects.filter(s => s.id !== id),
          sessions: state.sessions.filter(sess => sess.subjectId !== id)
        }));
        saveToCloud(get());
      },

      toggleSubtopic: (subjectId, subtopicId) => {
        set((state) => ({
          subjects: state.subjects.map(s => {
            if (s.id !== subjectId) return s;
            return {
              ...s,
              subtopics: s.subtopics.map(st => 
                st.id === subtopicId ? { ...st, isCompleted: !st.isCompleted } : st
              )
            };
          })
        }));
        saveToCloud(get());
      },

      toggleSubjectInMonth: (subjectId, monthStr) => {
        set((state) => ({
          subjects: state.subjects.map(s => {
            if (s.id !== subjectId) return s;
            const newSchedules = { ...s.schedules };
            if (newSchedules[monthStr]) {
              delete newSchedules[monthStr];
            } else {
              newSchedules[monthStr] = { monthlyGoal: 0, plannedDays: [], notes: '' };
            }
            return { ...s, schedules: newSchedules };
          })
        }));
        saveToCloud(get());
      },

      updateSubjectSchedule: (subjectId, monthStr, updates) => {
        set((state) => ({
          subjects: state.subjects.map(s => {
            if (s.id !== subjectId) return s;
            const currentSchedule = s.schedules?.[monthStr];
            if (!currentSchedule) return s;
            return {
              ...s,
              schedules: { ...s.schedules, [monthStr]: { ...currentSchedule, ...updates } }
            };
          })
        }));
        saveToCloud(get());
      },

      toggleSubjectPlannedDay: (subjectId, monthStr, dateStr) => {
        set((state) => ({
          subjects: state.subjects.map(s => {
            if (s.id !== subjectId) return s;
            const currentSchedule = s.schedules?.[monthStr];
            if (!currentSchedule) return s;
            const currentDays = currentSchedule.plannedDays || [];
            const isPlanned = currentDays.includes(dateStr);
            return {
              ...s,
              schedules: {
                ...s.schedules,
                [monthStr]: {
                  ...currentSchedule,
                  plannedDays: isPlanned ? currentDays.filter(d => d !== dateStr) : [...currentDays, dateStr].sort()
                }
              }
            };
          })
        }));
        saveToCloud(get());
      },

      setActiveSubjectId: (id) => set({ activeSubjectId: id }),

      addSession: (sessionData) => {
        set((state) => ({
          sessions: [...state.sessions, { ...sessionData, id: generateId() }]
        }));
        saveToCloud(get());
      },

      deleteSession: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.filter(s => s.id !== sessionId)
        }));
        saveToCloud(get());
      },

      updateSessionStatus: (sessionId, status) => {
        set((state) => ({
          sessions: state.sessions.map(sess => 
            sess.id === sessionId ? { ...sess, status } : sess
          )
        }));
        saveToCloud(get());
      },

      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates }
        }));
        saveToCloud(get());
      },

      getSubjectsByMonthId: (monthId) => get().subjects.filter(s => s.monthId === monthId),
      getSessionsByMonthId: (monthId) => {
        const monthSubjects = get().subjects.filter(s => s.monthId === monthId).map(s => s.id);
        return get().sessions.filter(s => monthSubjects.includes(s.subjectId));
      },
      getTimeBySubject: (subjectId) => {
        const sessions = get().sessions.filter(s => s.subjectId === subjectId && s.status === 'completed');
        return sessions.reduce((acc, curr) => acc + curr.duration, 0);
      },
      getStreakStats: () => calculateStreaks(get().sessions.filter(s => s.status === 'completed'))
    }),
    {
      name: 'study-store',
      partialize: (state) => ({
        months: state.months,
        subjects: state.subjects,
        sessions: state.sessions,
        settings: state.settings,
        user: state.user,
        activeScheduleMonths: state.activeScheduleMonths,
        guestMode: state.guestMode
      })
    }
  )
);
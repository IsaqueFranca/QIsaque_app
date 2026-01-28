
export interface Subtopic {
  id: string;
  title: string;
  isCompleted: boolean;
}

export type HealthDegree = 
  | 'Pharmacy'
  | 'Medicine'
  | 'Nursing'
  | 'Dentistry'
  | 'Physiotherapy'
  | 'Biomedicine'
  | 'Nutrition'
  | 'Clinical Analysis'
  | 'Radiology';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface Month {
  id: string;
  name: string;
  year?: number; 
}

export interface SubjectSchedule {
  monthlyGoal: number; 
  plannedDays: string[]; 
  notes: string; 
  isCompleted?: boolean;
}

export interface Subject {
  id: string;
  title: string;
  monthId: string; 
  tag?: string;
  color: string;
  studiedDates: string[]; 
  schedules: Record<string, SubjectSchedule>;
  subtopics: Subtopic[];
}

export interface Session {
  id: string;
  subjectId: string;
  startTime: number; 
  duration: number; // Seconds
  date: string; // ISO Date YYYY-MM-DD
  status: 'completed' | 'incomplete';
  questionsSolved?: number; // New field for exercise count
}

export interface Settings {
  pomodoroDuration: number; 
  shortBreakDuration: number; 
  longBreakDuration: number; 
  monthlyGoalHours: number;
  userName: string;
  finalGoal: string;
  healthDegree: HealthDegree; 
}

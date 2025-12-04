
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

export interface Subtopic {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Month {
  id: string;
  name: string;
  year?: number; 
}

export interface SubjectSchedule {
  monthlyGoal: number; // Goal for this specific month
  plannedDays: string[]; // Days planned for this specific month
  isCompleted: boolean; // Completion status for this specific month
  notes: string; // Notes for this specific month
}

export interface Subject {
  id: string;
  title: string;
  monthId: string; // Links to the Exam/Group ID (e.g., "Residency USP")
  tag?: string;
  color: string;
  subtopics: Subtopic[];
  studiedDates: string[]; // ISO date strings (YYYY-MM-DD)
  
  // New: Dictionary to hold data for specific schedule months (Key: YYYY-MM)
  schedules: Record<string, SubjectSchedule>;
}

export interface Session {
  id: string;
  subjectId: string;
  startTime: number; 
  duration: number; // Seconds
  date: string; // ISO Date YYYY-MM-DD
  status: 'completed' | 'incomplete';
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

export interface WeeklyProgress {
  week: number;
  total: number;
  completed: number;
}

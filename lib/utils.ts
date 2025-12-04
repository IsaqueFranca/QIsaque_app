import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { eachDayOfInterval } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function subDays(date: Date, amount: number): Date {
  const newDate = new Date(date);
  newDate.setDate(date.getDate() - amount);
  return newDate;
}

function subYears(date: Date, amount: number): Date {
  const newDate = new Date(date);
  newDate.setFullYear(date.getFullYear() - amount);
  return newDate;
}

export const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// --- Heatmap & Streak Utilities ---

export interface DayStat {
  date: Date;
  count: number; // minutes
  level: 0 | 1 | 2 | 3 | 4;
}

export const getIntensityLevel = (minutes: number): 0 | 1 | 2 | 3 | 4 => {
  if (minutes === 0) return 0;
  if (minutes < 30) return 1;
  if (minutes < 60) return 2;
  if (minutes < 120) return 3;
  return 4;
};

export const generateYearDays = (): Date[] => {
  const today = new Date();
  const oneYearAgo = subYears(today, 1);
  return eachDayOfInterval({ start: oneYearAgo, end: today });
};

export const calculateStreaks = (sessions: { date: string, duration: number }[]) => {
  // 1. Map days to total minutes
  const dayMap = new Map<string, number>();
  sessions.forEach(s => {
    // Ensure date string is YYYY-MM-DD
    const dayStr = s.date.split('T')[0]; 
    const current = dayMap.get(dayStr) || 0;
    dayMap.set(dayStr, current + (s.duration / 60)); // Store in minutes
  });

  // 2. Sort dates
  const sortedDates = Array.from(dayMap.keys()).sort();
  
  // 3. Calculate Logic
  let currentStreak = 0;
  let longestStreak = 0;
  let totalActiveDays = sortedDates.length;

  // Check current streak (working backwards from today)
  const today = new Date();
  const todayStr = formatDate(today);
  const yesterdayStr = formatDate(subDays(today, 1));
  
  let checkDate = today;
  let checkStr = formatDate(checkDate);

  // If we haven't studied today yet, we might still have a streak from yesterday
  if (!dayMap.has(todayStr) && dayMap.has(yesterdayStr)) {
    checkDate = subDays(today, 1);
    checkStr = yesterdayStr;
  } else if (!dayMap.has(todayStr) && !dayMap.has(yesterdayStr)) {
     // Streak broken or not started
     checkDate = today; // Will fail loop immediately
  }

  // Iterate backwards for current streak
  while (true) {
    const str = formatDate(checkDate);
    if (dayMap.has(str) && (dayMap.get(str) || 0) > 0) {
      currentStreak++;
      checkDate = subDays(checkDate, 1);
    } else {
      break;
    }
  }

  // Calculate Longest Streak
  let tempStreak = 0;
  // Create a continuous timeline of the last 365 days to check gaps
  const timeline = generateYearDays();
  
  timeline.forEach(day => {
    const str = formatDate(day);
    if (dayMap.has(str) && (dayMap.get(str) || 0) > 0) {
      tempStreak++;
    } else {
      if (tempStreak > longestStreak) longestStreak = tempStreak;
      tempStreak = 0;
    }
  });
  // Final check in case the streak ends on today
  if (tempStreak > longestStreak) longestStreak = tempStreak;

  return {
    currentStreak,
    longestStreak,
    totalActiveDays,
    dayMap
  };
};
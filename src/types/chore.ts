export interface Chore {
  id: string;
  name: string;
  frequencyDays?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChoreCompletion {
  id: string;
  choreId: string;
  choreName: string;
  completedAt: Date;
  notes?: string;
}

export function getLastCompletion(choreId: string, completions: ChoreCompletion[]): ChoreCompletion | undefined {
  return completions
    .filter(c => c.choreId === choreId)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0];
}

export function getDaysSinceLastDone(choreId: string, completions: ChoreCompletion[]): number | null {
  const last = getLastCompletion(choreId, completions);
  if (!last) return null;
  const now = new Date();
  const lastDate = new Date(last.completedAt);
  return Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
}

/** Returns the next due date for a scheduled chore, or null for log-only. */
export function getNextDueDate(chore: Chore, completions: ChoreCompletion[]): Date | null {
  if (!chore.frequencyDays) return null;
  const last = getLastCompletion(chore.id, completions);
  const baseDate = last ? new Date(last.completedAt) : new Date(chore.createdAt);
  const due = new Date(baseDate);
  due.setDate(due.getDate() + chore.frequencyDays);
  return due;
}

export function isOverdue(chore: Chore, completions: ChoreCompletion[]): boolean {
  if (!chore.frequencyDays) return false;
  const daysSince = getDaysSinceLastDone(chore.id, completions);
  if (daysSince === null) return true; // Never done = overdue
  return daysSince > chore.frequencyDays;
}

export function isDueSoon(chore: Chore, completions: ChoreCompletion[]): boolean {
  if (!chore.frequencyDays) return false;
  if (isOverdue(chore, completions)) return false;
  const daysSince = getDaysSinceLastDone(chore.id, completions);
  if (daysSince === null) return false; // Already caught by isOverdue
  return daysSince >= chore.frequencyDays - 2;
}

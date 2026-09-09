export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Monday of the week containing `date` (weeks start Monday, not Sunday). */
export function getMonday(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

/**
 * Every day shown on a month calendar grid for `monthDate`'s month — includes the
 * trailing days of the previous/next month needed to fill complete Monday-start weeks.
 */
export function getMonthGridDays(monthDate: Date): Date[] {
  const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const gridStart = getMonday(firstOfMonth);
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

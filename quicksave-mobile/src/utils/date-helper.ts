import { format, isToday, isYesterday } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';


export const getDayLabel = (date: Date | string) => {
  const d = new Date(date);
  if (isToday(d)) return 'TODAY';
  if (isYesterday(d)) return 'YESTERDAY';
  return format(d, 'MMMM dd, yyyy').toUpperCase();
};
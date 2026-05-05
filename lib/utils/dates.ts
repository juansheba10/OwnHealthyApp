import { startOfWeek, endOfWeek, addWeeks, format } from "date-fns";
import { es } from "date-fns/locale";

export function getWeekRange(weekOffset: number = 0) {
  const today = new Date();
  const target = addWeeks(today, weekOffset);
  const start = startOfWeek(target, { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(target, { weekStartsOn: 1 }); // Sunday

  return {
    start: format(start, "yyyy-MM-dd"),
    end: format(end, "yyyy-MM-dd"),
    label: `${format(start, "d MMM", { locale: es })} – ${format(end, "d MMM", { locale: es })}`,
  };
}

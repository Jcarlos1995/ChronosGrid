/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, DollarSign, CheckSquare, Clock } from 'lucide-react';
import { Task, AppSettings } from '../../types';
import { formatCurrency } from '../../currencies';
import { getTaskColor } from '../../utils/taskColor';
import { motion } from 'motion/react';
import { useLanguage } from '../../i18n/LanguageContext';
import { getLocale } from '../../i18n/translations';

interface CalendarGridProps {
  tasks: Task[];
  settings: AppSettings;
  onDayClick: (date: string) => void;
  onAddTaskClick: (date: string) => void;
  selectedDate: string | null;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  tasks,
  settings,
  onDayClick,
  onAddTaskClick,
  selectedDate,
}) => {
  const { t, language } = useLanguage();
  const locale = getLocale(language);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [pickerOpen, setPickerOpen] = useState<'month' | 'year' | null>(null);
  const currentYearRef = useRef<HTMLButtonElement | null>(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed

  const monthNames = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { month: 'long' });
    return Array.from({ length: 12 }, (_, i) => formatter.format(new Date(2000, i, 1)));
  }, [locale]);

  // Helper to format date into YYYY-MM-DD
  const formatDateString = (year: number, month: number, day: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  // Month/year navigation. Functional updates keep rapid clicks correct
  // (each click builds on the latest date, not a stale closure value).
  const prevMonth = () => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  // Jump directly to a chosen month or year via the header pickers
  const selectMonth = (monthIdx: number) => {
    setCurrentDate((d) => new Date(d.getFullYear(), monthIdx, 1));
    setPickerOpen(null);
  };

  const selectYear = (year: number) => {
    setCurrentDate((d) => new Date(year, d.getMonth(), 1));
    setPickerOpen(null);
  };

  // Years offered by the year picker (±60 around today)
  const years = useMemo(() => {
    const base = new Date().getFullYear();
    return Array.from({ length: 121 }, (_, i) => base - 60 + i);
  }, []);

  // Scroll the current year into view when the year picker opens
  useEffect(() => {
    if (pickerOpen === 'year' && currentYearRef.current) {
      currentYearRef.current.scrollIntoView({ block: 'center' });
    }
  }, [pickerOpen]);

  // Reset to today
  const goToToday = () => {
    setCurrentDate(new Date());
    const todayStr = formatDateString(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    onDayClick(todayStr);
  };

  // Get total days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Get starting day index of the month
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday, 1 is Monday...

  // Adjust first day index depending on starting day of the week setting (Monday or Sunday)
  let adjustedFirstDayIndex = firstDayIndex;
  if (settings.weekStartMonday) {
    adjustedFirstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
  }

  // Days from previous month to display
  const prevMonthDaysCount = new Date(currentYear, currentMonth, 0).getDate();
  const prevMonthDays: Array<{ day: number; isCurrentMonth: false; dateStr: string }> = [];
  for (let i = adjustedFirstDayIndex - 1; i >= 0; i--) {
    const day = prevMonthDaysCount - i;
    const prevMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYearIdx = currentMonth === 0 ? currentYear - 1 : currentYear;
    prevMonthDays.push({
      day,
      isCurrentMonth: false,
      dateStr: formatDateString(prevYearIdx, prevMonthIdx, day)
    });
  }

  // Days of current month
  const currentMonthDays: Array<{ day: number; isCurrentMonth: true; dateStr: string }> = [];
  for (let i = 1; i <= daysInMonth; i++) {
    currentMonthDays.push({
      day: i,
      isCurrentMonth: true,
      dateStr: formatDateString(currentYear, currentMonth, i)
    });
  }

  // Days from next month to fill the grid (standard 42 slots calendar grid)
  const totalSlots = 42;
  const remainingSlots = totalSlots - (prevMonthDays.length + currentMonthDays.length);
  const nextMonthDays: Array<{ day: number; isCurrentMonth: false; dateStr: string }> = [];
  for (let i = 1; i <= remainingSlots; i++) {
    const nextMonthIdx = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYearIdx = currentMonth === 11 ? currentYear + 1 : currentYear;
    nextMonthDays.push({
      day: i,
      isCurrentMonth: false,
      dateStr: formatDateString(nextYearIdx, nextMonthIdx, i)
    });
  }

  const allGridDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];

  // Week days label ordered based on start of week setting (locale-aware short names)
  const weekDays = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    // Jan 2, 2000 is a Sunday - build Sun..Sat then rotate if needed
    const sundayFirst = Array.from({ length: 7 }, (_, i) => formatter.format(new Date(2000, 0, 2 + i)));
    return settings.weekStartMonday ? [...sundayFirst.slice(1), sundayFirst[0]] : sundayFirst;
  }, [locale, settings.weekStartMonday]);

  // Group tasks by date for fast lookup
  const tasksByDate = tasks.reduce((acc: Record<string, Task[]>, task) => {
    if (!acc[task.date]) acc[task.date] = [];
    acc[task.date].push(task);
    return acc;
  }, {});

  const todayStr = formatDateString(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
      {/* Calendar Header Controls */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-3 relative">
          <CalendarIcon className="w-5 h-5 text-indigo-600 shrink-0" />
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPickerOpen((p) => (p === 'month' ? null : 'month'))}
              className="text-xl font-bold text-slate-900 font-sans tracking-tight capitalize px-2 py-0.5 rounded-lg hover:bg-slate-200/70 transition-colors cursor-pointer"
              title={t('calendar.selectMonth')}
            >
              {monthNames[currentMonth]}
            </button>
            <button
              onClick={() => setPickerOpen((p) => (p === 'year' ? null : 'year'))}
              className="text-xl font-bold text-slate-900 font-sans tracking-tight px-2 py-0.5 rounded-lg hover:bg-slate-200/70 transition-colors cursor-pointer"
              title={t('calendar.selectYear')}
            >
              {currentYear}
            </button>
          </div>

          {/* Month / Year picker popover */}
          {pickerOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setPickerOpen(null)} />
              <div className="absolute top-full left-8 mt-2 z-40 bg-white border border-slate-200 rounded-xl shadow-lg p-3 w-72">
                {pickerOpen === 'month' ? (
                  <div className="grid grid-cols-3 gap-1.5">
                    {monthNames.map((m, i) => (
                      <button
                        key={i}
                        onClick={() => selectMonth(i)}
                        className={`px-2 py-2 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                          i === currentMonth
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-1.5 max-h-56 overflow-y-auto">
                    {years.map((y) => (
                      <button
                        key={y}
                        ref={y === currentYear ? currentYearRef : null}
                        onClick={() => selectYear(y)}
                        className={`px-2 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          y === currentYear
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm active:scale-95 cursor-pointer"
          >
            {t('calendar.today')}
          </button>
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-slate-50 rounded text-slate-600 transition-colors cursor-pointer"
              title={t('calendar.prevMonth')}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="h-4 w-[1px] bg-slate-200 mx-1" />
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-slate-50 rounded text-slate-600 transition-colors cursor-pointer"
              title={t('calendar.nextMonth')}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Week Day Labels */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {weekDays.map((day, idx) => (
          <div
            key={day}
            className={`py-2 text-center text-[11px] font-bold tracking-wider uppercase font-sans ${
              idx >= 5 ? 'text-indigo-500' : 'text-slate-400'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grid Days */}
      <div className="grid grid-cols-7 grid-rows-6 flex-1 divide-x divide-y divide-slate-100 bg-slate-50/50">
        {allGridDays.map(({ day, isCurrentMonth, dateStr }, index) => {
          const dayTasks = tasksByDate[dateStr] || [];
          const isSelected = selectedDate === dateStr;
          const isToday = todayStr === dateStr;

          // Calculate total daily cost
          const dailyCost = dayTasks
              .filter((t) => t.hasCost && t.cost)
              .reduce((sum, t) => sum + (t.cost || 0), 0);

          return (
            <div
              key={`${dateStr}-${index}`}
              onClick={() => onDayClick(dateStr)}
              className={`relative group flex flex-col justify-between p-2 min-h-[95px] lg:min-h-[115px] transition-all cursor-pointer select-none border-b border-r border-slate-100 ${
                isToday
                  ? 'bg-indigo-500 text-white'
                  : isSelected
                  ? 'ring-2 ring-indigo-500 ring-inset bg-white z-10'
                  : !isCurrentMonth
                  ? 'bg-slate-50/50 text-slate-300'
                  : 'bg-white hover:bg-indigo-50/40'
              }`}
            >
              {/* Day Number and Badges */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold font-sans ${
                    isToday
                      ? 'text-white'
                      : isSelected
                      ? 'text-indigo-600 font-extrabold'
                      : !isCurrentMonth
                      ? 'text-slate-300'
                      : 'text-slate-800'
                  }`}
                >
                  {day}
                  {isToday && (
                    <div className="mt-0.5 text-[8px] uppercase font-black tracking-widest opacity-80 leading-none">{t('calendar.today')}</div>
                  )}
                </span>

                {/* Daily Cost Indicator */}
                {dailyCost > 0 && (
                  <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm text-[9px] font-bold font-mono ${
                    isToday
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  }`}>
                    {formatCurrency(dailyCost, settings.currency)}
                  </span>
                )}
              </div>

              {/* Day Tasks List (Up to 3 shown) */}
              <div className="flex-1 mt-2 space-y-1 overflow-hidden">
                {dayTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[9px] font-bold leading-normal truncate ${
                      isToday ? 'bg-white/10 text-white border-l-2 border-white' : ''
                    }`}
                    style={isToday ? {} : {
                      backgroundColor: `${getTaskColor(task, settings)}15`,
                      color: getTaskColor(task, settings),
                      borderLeft: `2px solid ${getTaskColor(task, settings)}`,
                    }}
                  >
                    <span className="font-mono text-[8px] opacity-75 shrink-0">
                      {task.endTime ? `${task.time}-${task.endTime}` : task.time}
                    </span>
                    <span className={`truncate ${task.completed ? 'line-through opacity-50' : ''}`}>
                      {task.title}
                    </span>
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className={`text-[8px] font-bold pl-1 font-mono ${isToday ? 'text-white/80' : 'text-slate-400'}`}>
                    {t('calendar.more', { count: dayTasks.length - 3 })}
                  </div>
                )}
              </div>

              {/* Quick Add Button on Hover */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddTaskClick(dateStr);
                }}
                className={`absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded transition-all duration-200 cursor-pointer ${
                  isToday 
                    ? 'bg-white/25 text-white hover:bg-white/40' 
                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 shadow-xs'
                }`}
                title={t('calendar.addTaskTitle')}
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

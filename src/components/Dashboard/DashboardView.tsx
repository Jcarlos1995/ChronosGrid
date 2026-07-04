/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { Download, Calendar, CheckSquare, DollarSign, Percent, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import { Task, AppSettings } from '../../types';
import { formatCurrency, currencies } from '../../currencies';
import { motion } from 'motion/react';
import { useLanguage } from '../../i18n/LanguageContext';
import { getLocale } from '../../i18n/translations';
import { getTaskColor } from '../../utils/taskColor';

interface DashboardViewProps {
  tasks: Task[];
  settings: AppSettings;
  addToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ tasks, settings, addToast }) => {
  const { t, language } = useLanguage();
  const locale = getLocale(language);

  const categoryLabel = (cat: string): string => {
    switch (cat) {
      case 'Appointment': return t('taskModal.categoryAppointment');
      case 'Work': return t('taskModal.categoryWork');
      case 'Personal': return t('taskModal.categoryPersonal');
      default: return t('taskModal.categoryOther');
    }
  };

  // Retrieve the rate of the selected currency to EUR, so we can convert cost inputs properly
  const selectedCurrencyConfig = useMemo(() => {
    return currencies.find(c => c.code === settings.currency) || currencies[0];
  }, [settings.currency]);

  // KPIs
  const kpis = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Convert all costs to the user's active currency for visual accuracy
    let totalCostInActiveCurrency = 0;
    let costTaskCount = 0;

    tasks.forEach(task => {
      if (task.hasCost && task.cost) {
        costTaskCount++;
        // If task is in same currency, just add
        if (task.currency === settings.currency) {
          totalCostInActiveCurrency += task.cost;
        } else {
          // Convert from task currency to EUR, then from EUR to active currency
          const taskCurrencyConfig = currencies.find(c => c.code === task.currency) || currencies[0];
          const costInEUR = task.cost * taskCurrencyConfig.rateToEUR;
          const costInActive = costInEUR / selectedCurrencyConfig.rateToEUR;
          totalCostInActiveCurrency += costInActive;
        }
      }
    });

    const averageCost = costTaskCount > 0 ? totalCostInActiveCurrency / costTaskCount : 0;

    return {
      total,
      completed,
      completionRate,
      totalCost: totalCostInActiveCurrency,
      averageCost,
      costTaskCount
    };
  }, [tasks, settings.currency, selectedCurrencyConfig]);

  // Data for Charts: Tasks & Cost by Category
  const categoryChartData = useMemo(() => {
    const dataMap: Record<string, { name: string; count: number; cost: number; color: string }> = {
      'Appointment': { name: categoryLabel('Appointment'), count: 0, cost: 0, color: settings.categoryColors['Appointment'] || '#3b82f6' },
      'Work': { name: categoryLabel('Work'), count: 0, cost: 0, color: settings.categoryColors['Work'] || '#ef4444' },
      'Personal': { name: categoryLabel('Personal'), count: 0, cost: 0, color: settings.categoryColors['Personal'] || '#10b981' },
      'Other': { name: categoryLabel('Other'), count: 0, cost: 0, color: settings.categoryColors['Other'] || '#8b5cf6' }
    };

    tasks.forEach(task => {
      const cat = task.category || 'Other';
      if (dataMap[cat]) {
        dataMap[cat].count++;
        if (task.hasCost && task.cost) {
          // Convert to active currency
          if (task.currency === settings.currency) {
            dataMap[cat].cost += task.cost;
          } else {
            const taskCurrencyConfig = currencies.find(c => c.code === task.currency) || currencies[0];
            const costInEUR = task.cost * taskCurrencyConfig.rateToEUR;
            const costInActive = costInEUR / selectedCurrencyConfig.rateToEUR;
            dataMap[cat].cost += costInActive;
          }
        }
      }
    });

    return Object.values(dataMap);
  }, [tasks, settings.currency, selectedCurrencyConfig, settings.categoryColors, language]);

  // Data for Charts: Daily Cost Trend (Last 7 active days with costs)
  const dailyCostTrendData = useMemo(() => {
    const dailyMap: Record<string, number> = {};

    tasks.forEach(task => {
      if (task.hasCost && task.cost) {
        let activeCost = task.cost;
        if (task.currency !== settings.currency) {
          const taskCurrencyConfig = currencies.find(c => c.code === task.currency) || currencies[0];
          const costInEUR = task.cost * taskCurrencyConfig.rateToEUR;
          activeCost = costInEUR / selectedCurrencyConfig.rateToEUR;
        }
        dailyMap[task.date] = (dailyMap[task.date] || 0) + activeCost;
      }
    });

    // Sort dates
    const sortedDates = Object.keys(dailyMap).sort();
    
    // Fallback if no costs tracked yet
    if (sortedDates.length === 0) {
      return [
        { date: '-', cost: 0 }
      ];
    }

    return sortedDates.map(date => {
      // Format date beautifully (e.g. "Jul 03")
      const d = new Date(date + 'T00:00:00');
      const formattedDate = d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
      return {
        date: formattedDate,
        rawDate: date,
        cost: parseFloat(dailyMap[date].toFixed(2))
      };
    }).slice(-10); // Show last 10 days
  }, [tasks, settings.currency, selectedCurrencyConfig, locale]);

  // Export tasks to Excel compatible CSV
  const handleExportCSV = () => {
    if (tasks.length === 0) {
      addToast('info', t('dashboard.errorNoTasksExport'));
      return;
    }

    try {
      // CSV Columns Header
      const headers = [
        t('dashboard.csvTaskTitle'), t('dashboard.csvDate'), t('dashboard.csvTime'), t('dashboard.csvCategory'),
        t('dashboard.csvCompleted'), t('dashboard.csvInvolvesCost'), t('dashboard.csvCostAmount'),
        t('dashboard.csvCurrencyCode'), t('dashboard.csvDescription'), t('dashboard.csvCreatedAt')
      ];

      const csvRows = [headers.join(',')];

      tasks.forEach(task => {
        const row = [
          `"${task.title.replace(/"/g, '""')}"`,
          `"${task.date}"`,
          `"${task.time}"`,
          `"${categoryLabel(task.category)}"`,
          `"${task.completed ? t('dashboard.csvYes') : t('dashboard.csvNo')}"`,
          `"${task.hasCost ? t('dashboard.csvYes') : t('dashboard.csvNo')}"`,
          `"${task.cost !== undefined ? task.cost.toFixed(2) : '0.00'}"`,
          `"${task.currency}"`,
          `"${(task.description || '').replace(/"/g, '""')}"`,
          `"${new Date(task.createdAt).toISOString()}"`
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvRows.join('\n'));

      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', csvContent);
      downloadAnchor.setAttribute('download', `task_calendar_data_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);

      addToast('success', t('dashboard.successExport'));
    } catch (e) {
      console.error(e);
      addToast('error', t('dashboard.errorExport'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('dashboard.title')}</h1>
          <p className="text-sm text-slate-500 mt-1 font-sans">
            {t('dashboard.subtitle', { currency: `${selectedCurrencyConfig.name} (${selectedCurrencyConfig.symbol})` })}
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs tracking-wider uppercase transition-all shadow-sm active:scale-95 duration-200 cursor-pointer"
        >
          <Download className="w-4 h-4" /> {t('dashboard.exportExcel')}
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Scheduled Tasks */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              {t('dashboard.totalTasks')}
            </span>
            <p className="text-2xl font-bold text-slate-900">
              {kpis.total}
            </p>
          </div>
          <div className="p-2.5 bg-slate-100 text-slate-700 rounded-lg">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              {t('dashboard.completionRate')}
            </span>
            <p className="text-2xl font-bold text-slate-900">
              {kpis.completionRate}%
            </p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <Percent className="w-5 h-5" />
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              {t('dashboard.trackedCosts')}
            </span>
            <p className="text-2xl font-bold text-emerald-600">
              {formatCurrency(kpis.totalCost, settings.currency)}
            </p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Average Cost */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              {t('dashboard.avgCostPerTask')}
            </span>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(kpis.averageCost, settings.currency)}
            </p>
          </div>
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Recharts Data Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Expense Breakdown by Category */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
            {t('dashboard.expenseBreakdown')}
          </h3>
          <div className="flex-1 min-h-[300px]">
            {kpis.totalCost === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center py-12">
                <AlertCircle className="w-12 h-12 text-slate-300 mb-2 stroke-[1.5]" />
                <p className="text-sm font-medium">{t('dashboard.noCostTasksTitle')}</p>
                <p className="text-xs text-slate-400 mt-1">{t('dashboard.noCostTasksSubtitle')}</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} fontStyle="sans-serif" tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} fontStyle="sans-serif" tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value, settings.currency), t('dashboard.tooltipExpenses')]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                  />
                  <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                    {categoryChartData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Daily Cost Trend */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
            {t('dashboard.dailyExpenseTrend')}
          </h3>
          <div className="flex-1 min-h-[300px]">
            {kpis.totalCost === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center py-12">
                <AlertCircle className="w-12 h-12 text-slate-300 mb-2 stroke-[1.5]" />
                <p className="text-sm font-medium">{t('dashboard.noCostTrendsTitle')}</p>
                <p className="text-xs text-slate-400 mt-1 font-sans">{t('dashboard.noCostTrendsSubtitle')}</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyCostTrendData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value, settings.currency), t('dashboard.tooltipCost')]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cost" 
                    stroke="#6366f1" 
                    strokeWidth={3} 
                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Breakdown Metrics & Up Next List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Share Stats */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
            {t('dashboard.categoryShare')}
          </h3>
          <div className="space-y-4">
            {categoryChartData.map((cat) => {
              const pct = kpis.total > 0 ? Math.round((cat.count / kpis.total) * 100) : 0;
              return (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="font-semibold text-slate-800">{cat.name}</span>
                    </div>
                    <span className="text-slate-500 font-mono text-xs">{t('dashboard.taskCountPct', { count: cat.count, pct })}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ width: `${pct}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Immediate Upcoming Tasks */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
              {t('dashboard.upcomingTasks')}
            </h3>
            <div className="space-y-3">
              {tasks.filter(task => !task.completed).slice(0, 3).length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">{t('dashboard.noUpcomingTasks')}</p>
              ) : (
                tasks.filter(task => !task.completed).slice(0, 3).map(task => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50"
                    style={{ borderLeft: `3px solid ${getTaskColor(task, settings)}` }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate text-xs">{task.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{task.date} at {task.time}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-white border border-slate-200 text-slate-500 font-sans shrink-0">
                      {categoryLabel(task.category)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

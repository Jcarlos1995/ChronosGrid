/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, Clock, DollarSign, Trash2, Edit2, CheckCircle, Circle, Save, Tag } from 'lucide-react';
import { Task, AppSettings } from '../../types';
import { formatCurrency, currencies } from '../../currencies';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../../i18n/LanguageContext';
import { getLocale } from '../../i18n/translations';

interface TaskModalProps {
  dateStr: string;
  tasks: Task[];
  settings: AppSettings;
  onClose: () => void;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  addToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  dateStr,
  tasks,
  settings,
  onClose,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  addToast,
}) => {
  const { t, language } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('09:00');
  const [category, setCategory] = useState('Appointment');
  const [hasCost, setHasCost] = useState(false);
  const [cost, setCost] = useState('');
  const [isEditing, setIsEditing] = useState<string | null>(null);

  // Close the modal when the Escape key is pressed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const categoryLabel = (cat: string): string => {
    switch (cat) {
      case 'Appointment': return t('taskModal.categoryAppointment');
      case 'Work': return t('taskModal.categoryWork');
      case 'Personal': return t('taskModal.categoryPersonal');
      default: return t('taskModal.categoryOther');
    }
  };

  // Filter tasks for this day
  const dailyTasks = tasks.filter((t) => t.date === dateStr);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      addToast('error', t('taskModal.errorTitleRequired'));
      return;
    }

    const costNum = hasCost ? parseFloat(cost) : undefined;
    if (hasCost && (isNaN(costNum as number) || (costNum as number) < 0)) {
      addToast('error', t('taskModal.errorInvalidCost'));
      return;
    }

    try {
      if (isEditing) {
        await onUpdateTask(isEditing, {
          title,
          description,
          time,
          category,
          hasCost,
          cost: costNum,
          currency: settings.currency,
        });
        addToast('success', t('taskModal.successUpdated'));
        setIsEditing(null);
      } else {
        await onAddTask({
          title,
          description,
          date: dateStr,
          time,
          category,
          hasCost,
          cost: costNum,
          currency: settings.currency,
          completed: false,
          userId: settings.userId,
        });
        addToast('success', t('taskModal.successAdded'));
      }

      // Reset form fields
      resetForm();
    } catch (e) {
      console.error(e);
      addToast('error', t('taskModal.errorSave'));
    }
  };

  const startEdit = (task: Task) => {
    setIsEditing(task.id);
    setTitle(task.title);
    setDescription(task.description);
    setTime(task.time);
    setCategory(task.category);
    setHasCost(task.hasCost);
    setCost(task.cost ? task.cost.toString() : '');
  };

  const cancelEdit = () => {
    resetForm();
  };

  const resetForm = () => {
    setIsEditing(null);
    setTitle('');
    setDescription('');
    setTime('09:00');
    setCategory('Appointment');
    setHasCost(false);
    setCost('');
  };

  const toggleComplete = async (task: Task) => {
    try {
      await onUpdateTask(task.id, { completed: !task.completed });
      addToast('success', task.completed ? t('taskModal.successMarkedActive') : t('taskModal.successMarkedComplete'));
    } catch (e) {
      addToast('error', t('taskModal.errorUpdateStatus'));
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('taskModal.confirmDelete'))) {
      try {
        await onDeleteTask(id);
        addToast('success', t('taskModal.successDeleted'));
        if (isEditing === id) resetForm();
      } catch (e) {
        addToast('error', t('taskModal.errorDelete'));
      }
    }
  };

  // Human readable date header
  const getReadableDate = () => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(getLocale(language), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const activeCurrency = currencies.find(c => c.code === settings.currency) || currencies[0];

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-40 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-lg border border-slate-200 max-w-4xl w-full overflow-hidden flex flex-col md:flex-row h-full max-h-[85vh]"
      >
        {/* Left Side: Daily Tasks List */}
        <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col min-h-0 bg-slate-50">
          <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-200">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-indigo-600 uppercase">
                {t('taskModal.scheduleForDay')}
              </span>
              <h3 className="text-lg font-bold text-slate-900 font-sans mt-0.5">
                {getReadableDate()}
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded bg-slate-200 text-slate-700 text-xs font-bold font-mono">
              {t('taskModal.taskCount', { count: dailyTasks.length })}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-0">
            {dailyTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400 text-center">
                <Calendar className="w-12 h-12 text-slate-300 stroke-[1.5] mb-2" />
                <p className="text-sm font-medium">{t('taskModal.noTasksTitle')}</p>
                <p className="text-xs text-slate-400 mt-1">{t('taskModal.noTasksSubtitle')}</p>
              </div>
            ) : (
              dailyTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-lg border bg-white transition-all shadow-xs ${
                    task.completed ? 'border-slate-100 opacity-70' : 'border-slate-200 hover:shadow-sm'
                  }`}
                  style={{
                    borderLeft: `4px solid ${settings.categoryColors[task.category] || '#6366f1'}`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleComplete(task)}
                      className="text-slate-400 hover:text-indigo-600 transition-colors shrink-0 mt-0.5 cursor-pointer"
                    >
                      {task.completed ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500 fill-emerald-50" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={`font-semibold text-slate-900 truncate ${task.completed ? 'line-through text-slate-400' : ''}`}>
                          {task.title}
                        </h4>
                        <span className="flex items-center gap-1 font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {task.time}
                        </span>
                      </div>
                      {task.description && (
                        <p className={`text-sm text-slate-500 mt-1 line-clamp-2 ${task.completed ? 'line-through text-slate-400' : ''}`}>
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border"
                          style={{
                            borderColor: `${settings.categoryColors[task.category] || '#6366f1'}25`,
                            color: settings.categoryColors[task.category] || '#6366f1',
                            backgroundColor: `${settings.categoryColors[task.category] || '#6366f1'}08`,
                          }}
                        >
                          {categoryLabel(task.category)}
                        </span>
                        {task.hasCost && task.cost !== undefined && (
                          <span className="flex items-center gap-0.5 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-700 font-mono text-[10px] font-bold">
                            {t('taskModal.cost', { amount: formatCurrency(task.cost, task.currency) })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => startEdit(task)}
                      className="p-1.5 hover:bg-slate-50 rounded text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                      title={t('taskModal.editTaskTitle')}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="p-1.5 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title={t('taskModal.deleteTaskTitle')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Add/Edit Task Form */}
        <div className="w-full md:w-[380px] p-6 flex flex-col min-h-0">
          <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 font-sans">
              {isEditing ? t('taskModal.editTaskDetails') : t('taskModal.addNewTask')}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between space-y-4 overflow-y-auto pr-1">
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">{t('taskModal.taskTitle')}</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('taskModal.taskTitlePlaceholder')}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all shadow-xs"
                />
              </div>

              {/* Time and Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">{t('taskModal.startTime')}</label>
                  <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Clock className="h-4 w-4" />
                    </div>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                      className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono transition-all shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">{t('taskModal.category')}</label>
                  <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Tag className="h-4 w-4" />
                    </div>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all shadow-xs"
                    >
                      <option value="Appointment">{t('taskModal.categoryAppointment')}</option>
                      <option value="Work">{t('taskModal.categoryWork')}</option>
                      <option value="Personal">{t('taskModal.categoryPersonal')}</option>
                      <option value="Other">{t('taskModal.categoryOther')}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">{t('taskModal.description')}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('taskModal.descriptionPlaceholder')}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all shadow-xs resize-none"
                />
              </div>

              {/* Cost Toggle Checkbox */}
              <div className="pt-2">
                <label className="relative flex items-center gap-3 cursor-pointer p-3 border border-slate-200 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors select-none">
                  <input
                    type="checkbox"
                    checked={hasCost}
                    onChange={(e) => setHasCost(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                  />
                  <div className="text-sm">
                    <p className="font-semibold text-slate-800">{t('taskModal.involvesCost')}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{t('taskModal.involvesCostHint')}</p>
                  </div>
                </label>
              </div>

              {/* Cost Value Input */}
              <AnimatePresence>
                {hasCost && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    className="overflow-hidden"
                  >
                    <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                      {t('taskModal.amount', { code: activeCurrency.code, symbol: activeCurrency.symbol })}
                    </label>
                    <div className="relative mt-1 rounded-md shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-slate-400 font-mono text-sm">{activeCurrency.symbol}</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                        required={hasCost}
                        placeholder="0.00"
                        className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono transition-all shadow-xs"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-slate-200">
              {isEditing && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="flex-1 py-2 px-4 border border-slate-200 rounded-lg text-xs font-bold tracking-wider uppercase text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {t('taskModal.cancel')}
                </button>
              )}
              <button
                type="submit"
                className="flex-1 flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-xs font-bold tracking-wider uppercase text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all active:scale-95 duration-200 gap-1.5 cursor-pointer"
              >
                {isEditing ? (
                  <>
                    <Save className="w-3.5 h-3.5" /> {t('taskModal.saveChanges')}
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" /> {t('taskModal.addTaskBtn')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

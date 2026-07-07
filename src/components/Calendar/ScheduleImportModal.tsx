/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Sparkles, Loader2, Check, ImagePlus, User, AlertTriangle, CalendarPlus } from 'lucide-react';
import { motion } from 'motion/react';
import { Task, AppSettings, WorkShift } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';
import { getLocale } from '../../i18n/translations';

const GEMINI_MODEL = 'gemini-2.5-flash';

interface ScheduleImportModalProps {
  settings: AppSettings;
  onClose: () => void;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  addToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

// One recognized cell of the user's row in the photographed shift table
interface ParsedEntry {
  date: string; // YYYY-MM-DD
  label: string; // raw cell text (e.g. "14,30-21,00", "RIPOSO", "ferie")
  start: string | null; // HH:MM
  end: string | null; // HH:MM
  shift: WorkShift | null; // matched configured shift, if any
}

// "7.00" / "7,00" / "07:00" / "24.00" -> "07:00" / "24:00"
function normalizeTime(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const m = String(raw).trim().match(/^(\d{1,2})[.,:h]?(\d{2})?$/);
  if (!m) return null;
  const h = m[1].padStart(2, '0');
  const min = (m[2] || '00').padStart(2, '0');
  return `${h}:${min}`;
}

// DD/MM -> YYYY-MM-DD, picking the year that puts the date closest to today
function resolveDate(dayMonth: string): string | null {
  const m = dayMonth.trim().match(/^(\d{1,2})[\/\-.](\d{1,2})(?:[\/\-.](\d{2,4}))?$/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  let year = m[3] ? parseInt(m[3].length === 2 ? `20${m[3]}` : m[3], 10) : new Date().getFullYear();
  if (!m[3]) {
    const now = new Date();
    const candidate = new Date(year, month - 1, day);
    const diffDays = (candidate.getTime() - now.getTime()) / 86400000;
    if (diffDays < -182) year += 1;
    if (diffDays > 182) year -= 1;
  }
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export const ScheduleImportModal: React.FC<ScheduleImportModalProps> = ({
  settings,
  onClose,
  onAddTask,
  onUpdateSettings,
  addToast,
}) => {
  const { t, language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [workerName, setWorkerName] = useState(settings.scheduleWorkerName || '');
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState<ParsedEntry[] | null>(null);
  const [checked, setChecked] = useState<boolean[]>([]);

  const apiKey = (settings.geminiApiKey || '').trim();
  const workShifts = settings.workShifts || [];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleFile = (file: File | undefined | null) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(reader.result as string);
    reader.readAsDataURL(file);
    setEntries(null);
  };

  // Match a recognized cell against the user's configured shifts
  const matchShift = (label: string, start: string | null, end: string | null): WorkShift | null => {
    if (start && end) {
      const byTime = workShifts.find((s) => s.start === start && s.end === end);
      if (byTime) return byTime;
    }
    const lower = label.trim().toLowerCase();
    return (
      workShifts.find((s) => s.name.trim().toLowerCase() === lower) ||
      workShifts.find((s) => lower.includes(s.name.trim().toLowerCase())) ||
      null
    );
  };

  const handleAnalyze = async () => {
    if (!apiKey) {
      addToast('error', t('import.errorNoApiKey'));
      return;
    }
    if (!imageDataUrl) {
      addToast('error', t('import.errorNoImage'));
      return;
    }
    if (!workerName.trim()) {
      addToast('error', t('import.errorNoName'));
      return;
    }

    setAnalyzing(true);
    setEntries(null);
    try {
      // Remember the worker name for next time (fire and forget)
      if (workerName.trim() !== (settings.scheduleWorkerName || '')) {
        onUpdateSettings({ scheduleWorkerName: workerName.trim() }).catch(() => {});
      }

      const [meta, base64] = imageDataUrl.split(',');
      const mimeType = meta.match(/data:(.*?);/)?.[1] || 'image/jpeg';

      const prompt = `This photo shows a work shift table. Rows are employee names; columns are days. Column headers contain the day and date, e.g. "lun.06/07" means day 06, month 07.

Find the row for the employee whose name best matches "${workerName.trim()}" (case-insensitive, allow partial/fuzzy match).

For each day column, read that employee's cell and output one object:
- "date": the day and month from the column header, as "DD/MM"
- "label": the exact cell text (e.g. "14,30-21,00", "RIPOSO", "ferie", "congedo", "B.ORE")
- "start": start time as "HH:MM" (24h) if the cell contains a time range, else null
- "end": end time as "HH:MM" (24h) if present, else null ("24.00" becomes "24:00")

Important — crossed-out cells: some employees have an extra narrow row directly ABOVE their row, with words like "ferie" or "permesso" written over specific day columns. When the employee's cell for a day is crossed out (strikethrough line over the time), the real schedule is the word written directly above that cell in the same column: use that word as the label with null times, and ignore the crossed-out time. Only if there is no text above the crossed-out cell, use the crossed-out content itself. Cells that are NOT crossed out are normal: use their own content and ignore any annotation row.

Normalize times written with dots or commas (7.00 / 7,00 -> "07:00").

Respond with ONLY a JSON array of these objects, one per day column, in day order. If you cannot find the employee, respond with [].`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { inline_data: { mime_type: mimeType, data: base64 } },
                  { text: prompt },
                ],
              },
            ],
            generationConfig: { response_mime_type: 'application/json', temperature: 0 },
          }),
        }
      );

      if (!res.ok) {
        const errBody = await res.text();
        console.error('Gemini API error:', res.status, errBody);
        throw new Error(`Gemini API ${res.status}`);
      }

      const data = await res.json();
      const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      const cleaned = text.replace(/^```(json)?/m, '').replace(/```\s*$/m, '').trim();
      const raw: Array<{ date?: string; label?: string; start?: string | null; end?: string | null }> =
        JSON.parse(cleaned);

      const parsed: ParsedEntry[] = [];
      for (const item of raw) {
        const date = item.date ? resolveDate(item.date) : null;
        if (!date || !item.label) continue;
        const start = normalizeTime(item.start);
        const end = normalizeTime(item.end);
        parsed.push({
          date,
          label: String(item.label).trim(),
          start,
          end,
          shift: matchShift(String(item.label), start, end),
        });
      }

      if (parsed.length === 0) {
        addToast('info', t('import.noResults'));
      }
      setEntries(parsed);
      setChecked(parsed.map(() => true));
    } catch (e) {
      console.error(e);
      addToast('error', t('import.errorAnalyze'));
    } finally {
      setAnalyzing(false);
    }
  };

  const selectedCount = entries ? checked.filter(Boolean).length : 0;

  const handleConfirm = async () => {
    if (!entries || selectedCount === 0) return;
    setSaving(true);
    try {
      for (let i = 0; i < entries.length; i++) {
        if (!checked[i]) continue;
        const entry = entries[i];
        const title = entry.shift
          ? entry.shift.name
          : entry.label.charAt(0).toUpperCase() + entry.label.slice(1).toLowerCase();
        await onAddTask({
          title,
          description: '',
          date: entry.date,
          time: entry.shift ? entry.shift.start : entry.start || '00:00',
          endTime: entry.shift ? entry.shift.end : entry.end || undefined,
          shiftId: entry.shift?.id,
          category: 'Work',
          hasCost: false,
          cost: undefined,
          currency: settings.currency,
          completed: false,
          userId: settings.userId,
        });
      }
      addToast('success', t('import.success', { count: String(selectedCount) }));
      onClose();
    } catch (e) {
      console.error(e);
      addToast('error', t('import.errorSave'));
    } finally {
      setSaving(false);
    }
  };

  const readableDate = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString(getLocale(language), {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-40 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-lg border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-sans">{t('import.title')}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {!apiKey && (
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">{t('import.errorNoApiKey')}</p>
            </div>
          )}

          <p className="text-sm text-slate-500">{t('import.description')}</p>

          {/* Image chooser */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer bg-slate-50/60"
          >
            {imageDataUrl ? (
              <img src={imageDataUrl} alt="schedule" className="max-h-48 rounded-lg border border-slate-200 object-contain" />
            ) : (
              <>
                <ImagePlus className="w-8 h-8" />
                <span className="text-xs font-semibold">{t('import.selectImage')}</span>
              </>
            )}
          </button>

          {/* Worker name */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">{t('import.workerName')}</label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={workerName}
                onChange={(e) => setWorkerName(e.target.value)}
                placeholder="CARLOS"
                className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all shadow-xs"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analyzing || !apiKey}
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold tracking-wider uppercase text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> {t('import.analyzing')}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> {t('import.analyze')}
              </>
            )}
          </button>

          {/* Preview */}
          {entries && entries.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {t('import.previewTitle')}
              </div>
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {entries.map((entry, idx) => (
                  <label
                    key={idx}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={checked[idx]}
                      onChange={() =>
                        setChecked((prev) => prev.map((c, i) => (i === idx ? !c : c)))
                      }
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-700 w-24 shrink-0 capitalize">
                      {readableDate(entry.date)}
                    </span>
                    <span className="text-xs font-mono text-slate-500 flex-1 truncate">{entry.label}</span>
                    {entry.shift ? (
                      <span
                        className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded border shrink-0"
                        style={{
                          color: entry.shift.color,
                          borderColor: `${entry.shift.color}40`,
                          backgroundColor: `${entry.shift.color}10`,
                        }}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.shift.color }} />
                        {entry.shift.name}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 text-slate-400 shrink-0">
                        {t('import.noShiftMatch')}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {entries && entries.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold tracking-wider uppercase text-slate-600 hover:bg-white transition-colors cursor-pointer"
            >
              {t('taskModal.cancel')}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={saving || selectedCount === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs tracking-wider uppercase transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CalendarPlus className="w-4 h-4" />
              )}
              {t('import.confirm', { count: String(selectedCount) })}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

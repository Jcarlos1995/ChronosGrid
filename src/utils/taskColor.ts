/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Task, AppSettings } from '../types';

// Color shown for a task across the app: the work shift's color when the task
// was created with a shift (and that shift still exists), otherwise the
// category color.
export function getTaskColor(task: Task, settings: AppSettings): string {
  if (task.shiftId) {
    const shift = (settings.workShifts || []).find((s) => s.id === task.shiftId);
    if (shift) return shift.color;
  }
  return settings.categoryColors[task.category] || '#6366f1';
}

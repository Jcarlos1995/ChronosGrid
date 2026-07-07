/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

// Base pulsing block used to compose all skeleton layouts
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
);

// Mirrors the CalendarGrid layout: header controls + weekday row + 6x7 day grid
export const CalendarSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
    <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-slate-50">
      <div className="flex items-center gap-3">
        <Skeleton className="w-5 h-5 rounded-md" />
        <Skeleton className="w-40 h-6" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="w-28 h-8 rounded-lg" />
        <Skeleton className="w-16 h-8 rounded-lg" />
        <Skeleton className="w-20 h-8 rounded-lg" />
      </div>
    </div>
    <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 px-2 py-2 gap-2">
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton key={i} className="h-3 mx-auto w-8" />
      ))}
    </div>
    <div className="grid grid-cols-7 grid-rows-6 flex-1 divide-x divide-y divide-slate-100">
      {Array.from({ length: 42 }).map((_, i) => (
        <div key={i} className="p-2 min-h-[95px] lg:min-h-[115px] space-y-2">
          <Skeleton className="w-5 h-4" />
          {i % 3 === 0 && <Skeleton className="w-full h-3" />}
          {i % 5 === 0 && <Skeleton className="w-4/5 h-3" />}
        </div>
      ))}
    </div>
  </div>
);

// Mirrors the DashboardView layout: title + KPI cards + charts + lower cards
export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="w-64 h-7" />
        <Skeleton className="w-80 h-4" />
      </div>
      <Skeleton className="w-40 h-10 rounded-lg" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="w-20 h-3" />
            <Skeleton className="w-16 h-7" />
          </div>
          <Skeleton className="w-10 h-10 rounded-lg" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <Skeleton className="w-52 h-4" />
          <Skeleton className="w-full h-64 rounded-lg" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <Skeleton className="w-44 h-4" />
          <Skeleton className="w-full h-10 rounded-lg" />
          <Skeleton className="w-full h-10 rounded-lg" />
          <Skeleton className="w-3/4 h-10 rounded-lg" />
        </div>
      ))}
    </div>
  </div>
);

// Mirrors the SettingsView layout: title + two columns of setting cards
export const SettingsSkeleton: React.FC = () => (
  <div className="space-y-6 max-w-4xl">
    <div className="space-y-2">
      <Skeleton className="w-56 h-7" />
      <Skeleton className="w-96 max-w-full h-4" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-5">
          <Skeleton className="w-44 h-4" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="w-28 h-3" />
              <Skeleton className="w-full h-10 rounded-lg" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="w-full h-12 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-3">
          <Skeleton className="w-40 h-4" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="w-full h-12 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <Skeleton className="w-44 h-4" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="w-full h-10" />
            <Skeleton className="w-full h-10" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <Skeleton className="w-44 h-4" />
          <Skeleton className="w-full h-10 rounded-lg" />
          <Skeleton className="w-full h-10 rounded-lg" />
          <div className="flex justify-end">
            <Skeleton className="w-44 h-9 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Row skeletons for the admin user list
export const UserListSkeleton: React.FC = () => (
  <div className="space-y-3">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-slate-100">
        <div className="flex items-center gap-3.5 flex-1">
          <Skeleton className="w-10 h-10 rounded" />
          <div className="space-y-2 flex-1 max-w-[200px]">
            <Skeleton className="w-3/4 h-4" />
            <Skeleton className="w-full h-3" />
          </div>
        </div>
        <Skeleton className="w-16 h-6 rounded" />
      </div>
    ))}
  </div>
);

// Full app shell shown while the auth state is being restored on startup:
// dark sidebar placeholder (desktop) + header + calendar skeleton
export const AppShellSkeleton: React.FC = () => (
  <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row overflow-x-hidden">
    <aside className="w-64 bg-slate-900 hidden md:flex flex-col border-r border-slate-800 shrink-0">
      <div className="p-6 border-b border-slate-800 space-y-2">
        <div className="animate-pulse bg-slate-700 rounded w-36 h-6" />
        <div className="animate-pulse bg-slate-800 rounded w-28 h-3" />
      </div>
      <div className="flex-1 py-6 px-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="animate-pulse bg-slate-700 rounded w-5 h-5" />
            <div className="animate-pulse bg-slate-800 rounded h-4 flex-1" />
          </div>
        ))}
      </div>
      <div className="p-6 space-y-3">
        <div className="animate-pulse bg-slate-800 rounded-xl w-full h-16" />
        <div className="animate-pulse bg-slate-800 rounded-xl w-full h-10" />
      </div>
    </aside>
    <header className="md:hidden bg-slate-900 px-4 py-4 flex items-center justify-between">
      <div className="animate-pulse bg-slate-700 rounded w-32 h-6" />
      <div className="flex gap-2">
        <div className="animate-pulse bg-slate-800 rounded-xl w-9 h-9" />
        <div className="animate-pulse bg-slate-800 rounded-xl w-9 h-9" />
      </div>
    </header>
    <main className="flex-1 flex flex-col min-h-screen">
      <div className="h-16 bg-white border-b border-slate-200 hidden md:flex items-center justify-between px-8">
        <Skeleton className="w-48 h-5" />
        <div className="flex items-center gap-2.5">
          <div className="space-y-1.5">
            <Skeleton className="w-28 h-4" />
            <Skeleton className="w-12 h-3" />
          </div>
          <Skeleton className="w-10 h-10 rounded-full" />
        </div>
      </div>
      <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
        <CalendarSkeleton />
      </div>
    </main>
  </div>
);

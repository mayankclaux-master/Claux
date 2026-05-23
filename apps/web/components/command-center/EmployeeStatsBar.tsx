/**
 * Employee Stats Bar Component
 * Displays employee statistics at top of Command Centre
 */

'use client';

interface EmployeeStatsBarProps {
  pendingTasks: number;
  completedToday: number;
  criticalTasks: number;
  clientHealthScore: number;
}

export function EmployeeStatsBar({
  pendingTasks,
  completedToday,
  criticalTasks,
  clientHealthScore,
}: EmployeeStatsBarProps) {
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-blue-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 mb-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-100">{pendingTasks}</div>
          <div className="text-xs text-slate-400 mt-1">Pending Tasks</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{completedToday}</div>
          <div className="text-xs text-slate-400 mt-1">Completed Today</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">{criticalTasks}</div>
          <div className="text-xs text-slate-400 mt-1">Critical Tasks</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${getHealthColor(clientHealthScore)}`}>
            {clientHealthScore}%
          </div>
          <div className="text-xs text-slate-400 mt-1">Client Health</div>
        </div>
      </div>
    </div>
  );
}

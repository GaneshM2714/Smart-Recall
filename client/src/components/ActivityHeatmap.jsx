import React, { useMemo } from 'react';

const ActivityHeatmap = ({ activityLog }) => {
  // Generate the last 365 days of dates
  const days = useMemo(() => {
    const dates = [];
    const today = new Date();
    // Shift to end of week (Saturday) to align grid nicely like GitHub
    for (let i = 364; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dates.push(dateStr);
    }
    return dates;
  }, []);

  // Determine color based on count
  const getColor = (count) => {
    // 👇 FIX: changed dark mode color from gray-800 to gray-700 so it's visible on cards
    if (!count || count === 0) return 'bg-gray-200 dark:bg-gray-700/50'; 
    
    if (count <= 2) return 'bg-emerald-300 dark:bg-emerald-900';      // Low
    if (count <= 5) return 'bg-emerald-400 dark:bg-emerald-700';      // Med
    return 'bg-emerald-600 dark:bg-emerald-500';                      // High
  };

  return (
    <div className="w-full overflow-x-auto pb-2 custom-scrollbar">
      <div className="min-w-[600px] flex flex-col gap-1">
        {/* Render Grid: We interpret the 1D array as columns (weeks) */}
        <div className="flex gap-[3px]">
           {/* We chunk days into weeks for column-based rendering */}
           {Array.from({ length: Math.ceil(days.length / 7) }).map((_, weekIndex) => (
             <div key={weekIndex} className="flex flex-col gap-[3px]">
               {days.slice(weekIndex * 7, (weekIndex * 7) + 7).map((date) => {
                 const count = activityLog[date] || 0;
                 return (
                   <div
                     key={date}
                     title={`${date}: ${count} reviews`} // Native Tooltip
                     className={`w-3 h-3 rounded-[2px] ${getColor(count)} hover:ring-1 hover:ring-white/50 transition-all`}
                   />
                 );
               })}
             </div>
           ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-3 text-xs text-gray-400 font-mono">
        <span>Less</span>
        {/* Update Legend Colors too */}
        <div className="w-3 h-3 rounded-[2px] bg-gray-200 dark:bg-gray-700/50"></div>
        <div className="w-3 h-3 rounded-[2px] bg-emerald-300 dark:bg-emerald-900"></div>
        <div className="w-3 h-3 rounded-[2px] bg-emerald-400 dark:bg-emerald-700"></div>
        <div className="w-3 h-3 rounded-[2px] bg-emerald-600 dark:bg-emerald-500"></div>
        <span>More</span>
      </div>
    </div>
  );
};

export default ActivityHeatmap;
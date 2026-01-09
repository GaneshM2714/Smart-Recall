import React, { useMemo } from 'react';

const ActivityHeatmap = ({ activityLog }) => {
  
  // Generate data grouped by month for the last 12 months
  const months = useMemo(() => {
    const today = new Date();
    const result = [];

    // Iterate backwards 11 times + current month = 12 months
    for (let i = 11; i >= 0; i--) {
      // Create a date object for the 1st of the target month
      const currentMonthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
      
      const year = currentMonthStart.getFullYear();
      const monthIndex = currentMonthStart.getMonth(); // 0-11
      const monthName = currentMonthStart.toLocaleString('default', { month: 'short' });
      
      // Calculate number of days in this month
      // (Month + 1, Day 0 gives the last day of the previous index)
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
      
      // Calculate which day of the week the month starts on (0=Sun, 1=Mon, etc.)
      const startDayOffset = new Date(year, monthIndex, 1).getDay();

      const days = [];

      // 1. Add null placeholders for empty days before the 1st of the month
      for (let j = 0; j < startDayOffset; j++) {
        days.push(null);
      }

      // 2. Add actual dates
      for (let day = 1; day <= daysInMonth; day++) {
        // Construct YYYY-MM-DD string manually to avoid timezone issues with toISOString
        const dateObj = new Date(year, monthIndex, day);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        days.push(dateStr);
      }

      result.push({
        id: `${monthName}-${year}`,
        label: `${monthName} ${year}`,
        days: days
      });
    }

    return result;
  }, []);

  // Determine color based on count
  const getColor = (count) => {
    if (!count || count === 0) return 'bg-gray-200 dark:bg-gray-700/50'; 
    if (count <= 2) return 'bg-emerald-300 dark:bg-emerald-900';       // Low
    if (count <= 5) return 'bg-emerald-400 dark:bg-emerald-700';       // Med
    return 'bg-emerald-600 dark:bg-emerald-500';                       // High
  };

  return (
    <div className="w-full flex flex-col gap-4">
      
      {/* Scrollable Container for the Blocks */}
      <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-6 min-w-max px-1">
          
          {months.map((month) => (
            <div key={month.id} className="flex flex-col gap-2">
              
              {/* Days Grid (7 cols for days of week) */}
              <div className="grid grid-cols-7 gap-[3px]">
                {month.days.map((dateStr, index) => {
                  // Render invisible placeholder for empty start days
                  if (!dateStr) {
                    return <div key={`empty-${index}`} className="w-3 h-3" />;
                  }

                  const count = activityLog[dateStr] || 0;
                  
                  return (
                    <div
                      key={dateStr}
                      title={`${dateStr}: ${count} reviews`}
                      className={`w-3 h-3 rounded-[2px] ${getColor(count)} hover:ring-1 hover:ring-offset-1 hover:ring-emerald-500 transition-all cursor-default`}
                    />
                  );
                })}
              </div>

              {/* Month Name & Year Below */}
              <span className="text-[10px] font-mono font-medium text-gray-500 dark:text-gray-400 text-center uppercase tracking-wide">
                {month.label}
              </span>

            </div>
          ))}

        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 text-xs text-gray-400 font-mono border-t border-gray-100 dark:border-gray-800 pt-3">
        <span>Less</span>
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
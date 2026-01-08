import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Edit2, Trash2 } from 'lucide-react';

const VirtualCardList = ({ cards = [], onDelete, onEdit }) => {
  const parentRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: cards.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // row height
    overscan: 5,
  });

  return (
    <div
      ref={parentRef}
      className="flex-1 h-full min-h-[500px] overflow-auto"
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const card = cards[virtualRow.index];
          if (!card) return null;

          return (
            <div
              key={virtualRow.key}
              ref={rowVirtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="px-6 py-2"
            >
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-between hover:shadow-sm transition-shadow group h-full">

                {/* CONTENT */}
                <div className="flex-1 pr-4 overflow-hidden">
                  {card.topicName && (
                    <div className="text-xs font-bold text-indigo-500 mb-1 uppercase tracking-wider">
                      {card.topicName}
                    </div>
                  )}

                  <div className="font-medium text-gray-900 dark:text-gray-100 mb-1 truncate">
                    {card.front}
                  </div>

                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {card.back}
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEdit(card)}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition"
                    aria-label="Edit card"
                  >
                    <Edit2 size={16} />
                  </button>

                  <button
                    onClick={() => onDelete(card.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                    aria-label="Delete card"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VirtualCardList;

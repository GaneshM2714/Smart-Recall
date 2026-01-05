// --- FIX IMPORTS START ---
// We import the entire modules as wildcards to handle CommonJS/ESM interop issues in Vite production builds
import * as ReactWindow from 'react-window';
import * as AutoSizerPkg from 'react-virtualized-auto-sizer';
import { Edit2, Trash2 } from 'lucide-react';

// Safely extract the components, checking both standard and default exports
const List = ReactWindow.FixedSizeList || ReactWindow.default?.FixedSizeList;
const AutoSizer = AutoSizerPkg.default || AutoSizerPkg;
// --- FIX IMPORTS END ---

const VirtualCardList = ({ cards, onDelete, onEdit }) => {
  
  // The renderer for a SINGLE row
  const Row = ({ index, style }) => {
    const card = cards[index];
    
    return (
      <div style={style} className="px-6 py-2">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-between hover:shadow-sm transition-shadow group h-full">
          
          <div className="flex-1 pr-4 overflow-hidden">
            {/* Show Topic Name if it exists (for Subject View flattening) */}
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

          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => onEdit(card)} 
              className="p-2 text-gray-400 hover:text-indigo-600 transition hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg"
            >
              <Edit2 size={16} />
            </button>
            <button 
              onClick={() => onDelete(card.id)} 
              className="p-2 text-gray-400 hover:text-red-600 transition hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
            >
              <Trash2 size={16} />
            </button>
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 h-full min-h-[500px]"> 
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            width={width}
            itemCount={cards.length}
            itemSize={100} 
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </div>
  );
};

export default VirtualCardList;
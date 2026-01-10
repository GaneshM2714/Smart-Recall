import { useState } from 'react';
import { MoreVertical, Edit, Trash2, Zap } from 'lucide-react';

function SubjectMenu({ onEdit, onDelete, onCram }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Trigger Button - Increased hit area */}
      <button 
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400 transition"
      >
        <MoreVertical size={20} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close click */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-20 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            
            {/* 1. CRAM OPTION */}
            <button 
              onClick={(e) => { e.stopPropagation(); onCram(); setIsOpen(false); }}
              className="w-full text-left px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center gap-3 transition-colors"
            >
              <Zap size={18} />
              <span className="text-base font-medium">Cram (Study All)</span>
            </button>

            {/* 2. RENAME OPTION */}
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(); setIsOpen(false); }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center gap-3 transition-colors"
            >
              <Edit size={18} /> 
              <span className="text-base">Rename</span>
            </button>

            <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />

            {/* 3. DELETE OPTION */}
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); setIsOpen(false); }}
              className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-3 transition-colors"
            >
              <Trash2 size={18} /> 
              <span className="text-base">Delete</span>
            </button>

          </div>
        </>
      )}
    </div>
  );
}

export default SubjectMenu;
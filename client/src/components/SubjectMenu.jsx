import { useState } from 'react';
import { MoreVertical, Edit, Trash2, Zap } from 'lucide-react';

function SubjectMenu({ onEdit, onDelete, onCram }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button 
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="p-1 hover:bg-gray-100 rounded-full text-gray-500 transition"
      >
        <MoreVertical size={20} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close click */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-20 py-1 text-sm overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <button 
              onClick={(e) => { e.stopPropagation(); onCram(); setIsOpen(false); }}
              className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-indigo-600 flex items-center gap-2"
            >
              <Zap size={16} /> Cram (Study All)
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(); setIsOpen(false); }}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
            >
              <Edit size={16} /> Rename
            </button>
            <div className="h-px bg-gray-100 my-1" />
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); setIsOpen(false); }}
              className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default SubjectMenu;
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';

function InputModal({ isOpen, onClose, onSubmit, title, placeholder }) {
  const [value, setValue] = useState('');

  // Reset value when modal opens
  useEffect(() => {
    if (isOpen) setValue('');
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-2xl p-6 m-4 animate-scale-in border border-gray-200 dark:border-gray-700">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <input
            autoFocus
            type="text"
            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all
            bg-white text-gray-900 placeholder-gray-400" 
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && value.trim()) {
                onSubmit(value);
                onClose();
              }
            }}
          />

          <div className="flex justify-end gap-3 pt-2">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition"
            >
              Cancel
            </button>
            <button
              disabled={!value.trim()}
              onClick={() => {
                onSubmit(value);
                onClose();
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-indigo-200 dark:shadow-none"
            >
              Confirm
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default InputModal;
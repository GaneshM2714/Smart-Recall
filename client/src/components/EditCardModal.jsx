import { useState } from 'react';
import { X, Save, Type } from 'lucide-react';
import MarkdownToolbar from './MarkdownToolbar';
import API from '../api';
import toast from 'react-hot-toast';

function EditCardModal (card, onClose, onUpdate){
  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return toast.error("Fields cannot be empty");
    
    setSaving(true);
    try {
      // 1. Update in Backend
      await API.put(`/content/cards/${card.id}`, { front, back });
      
      // 2. Update locally in the parent list
      onUpdate({ ...card, front, back });
      
      toast.success("Card updated!");
      onClose();
    } catch (error) {
      // Handle the duplicate error we added earlier!
      if (error.response?.status === 409) {
        toast.error("A card with this question already exists.");
      } else {
        toast.error("Failed to update card");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Type className="text-indigo-500" /> Edit Card
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Front Input */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Front (Question)</label>
            <div className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                <MarkdownToolbar textAreaId="editFront" onInsert={setFront} />
                <textarea 
                    id="editFront"
                    value={front}
                    onChange={(e) => setFront(e.target.value)}
                    className="w-full p-4 h-32 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none resize-none font-mono text-sm"
                />
            </div>
          </div>

          {/* Back Input */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Back (Answer)</label>
            <div className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                <MarkdownToolbar textAreaId="editBack" onInsert={setBack} />
                <textarea 
                    id="editBack"
                    value={back}
                    onChange={(e) => setBack(e.target.value)}
                    className="w-full p-4 h-40 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none resize-none font-mono text-sm"
                />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-medium transition"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 font-bold shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50"
          >
            {saving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditCardModal;
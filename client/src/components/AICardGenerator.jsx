import React, { useState, useEffect } from 'react';
import API from '../api';
import { Sparkles, Loader, Check, X, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

const AICardGenerator = ({ isOpen, onClose, onSaveCards, subjects = [] }) => {
  const [topic, setTopic] = useState('');
  const [amount, setAmount] = useState(5);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedCards, setGeneratedCards] = useState([]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen && subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [isOpen, subjects]);

  const handleGenerate = async () => {
    if (!topic) return toast.error("Please enter a topic");
    const selectedSubject = subjects.find(s => s.id == selectedSubjectId);
    const subjectName = selectedSubject ? selectedSubject.title : "";

    setLoading(true);
    setGeneratedCards([]);

    try {
      // Call Backend
      const { data } = await API.post('/ai/generate', { topic, amount, subject: subjectName });
      
      // Update cards
      setGeneratedCards(data.cards);
      
      if (data.topic) {
          setTopic(data.topic);
      }
      
      toast.success("Cards Generated! Review them below.");
    } catch (error) {
      toast.error("AI Generation Failed");
      console.error(error);
    }
    setLoading(false);
  };

  const handleTriggerSave = () => {
    if (!selectedSubjectId) return toast.error("Please select a Subject to save to!");
    if (!topic) return toast.error("Topic is missing!");
    
    onSaveCards(selectedSubjectId, topic, generatedCards);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-700 overflow-hidden flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-indigo-50 dark:bg-gray-900">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
              <Sparkles className="fill-indigo-400" size={20} />
              AI Card Generator
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
          <p className="text-sm text-gray-500">Enter a topic and let Gemini create flashcards for you.</p>
        </div>

        {/* Inputs */}
        <div className="p-6 space-y-4">

          {/* Subject Dropdown */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Save to Subject</label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-3 text-gray-400" size={18} />
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full pl-10 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
              >
                {subjects.length === 0 && <option value="">No subjects found</option>}
                {subjects.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Topic / Prompt</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Photosynthesis, React Hooks..."
              className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount</label>
              <select
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none"
              >
                <option value={3}>3 Cards</option>
                <option value={5}>5 Cards</option>
                <option value={10}>10 Cards</option>
              </select>
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex-1 mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader className="animate-spin" size={18} /> : <><Sparkles size={18} /> Generate</>}
            </button>
          </div>
        </div>

        {/* Preview Area */}
        {generatedCards.length > 0 && (
          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3 custom-scrollbar">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Preview ({generatedCards.length})</h3>
            {generatedCards.map((card, i) => (
              <div key={i} className="p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
                <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Q: {card.front}</div>
                <div className="text-gray-500 dark:text-gray-400">A: {card.back}</div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {generatedCards.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <button
              onClick={handleTriggerSave} 
              className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
            >
              <Check size={20} /> Save to {subjects.find(s => s.id == selectedSubjectId)?.title || 'Subject'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default AICardGenerator;
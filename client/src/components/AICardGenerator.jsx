import React, { useState, useEffect } from 'react';
import API from '../api';
import { Sparkles, Loader, Check, X, BookOpen, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const AICardGenerator = ({ isOpen, onClose, onSaveCards, subjects = [] }) => {
  const [topic, setTopic] = useState('');
  const [amount, setAmount] = useState(5);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState(""); 
  const [generatedCards, setGeneratedCards] = useState([]);

  // Reset selection when opening
  useEffect(() => {
    if (isOpen && subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0].id);
    }
    // Clear state when reopening
    if (isOpen) {
      setGeneratedCards([]);
      setStatusText("");
    }
  }, [isOpen, subjects]);

  // Helper: Poll the backend for job status
  const pollJobStatus = async (jobId) => {
    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          const { data } = await API.get(`/ai/status/${jobId}`);
          
          if (data.state === 'completed') {
            clearInterval(interval);
            resolve(data.result); // Returns { cards: [...], topic: "..." }
          } else if (data.state === 'failed') {
            clearInterval(interval);
            reject(new Error("AI Generation Failed"));
          } else {
            // Still running
            setStatusText("AI is thinking... (This takes ~10s)");
          }
        } catch (error) {
          clearInterval(interval);
          reject(error);
        }
      }, 2000); // Check every 2 seconds
    });
  };

  const handleGenerate = async () => {
    if (!topic) return toast.error("Please enter a topic");
    
    setLoading(true);
    setGeneratedCards([]);
    setStatusText("Queueing job...");

    try {
      // 1. Fire: Start the background job
      const { data: startData } = await API.post('/ai/generate', { 
        topic, 
        amount, 
        subjectId: selectedSubjectId 
      });

      setStatusText("Job Queued! Waiting for worker...");

      // 2. Poll: Wait for result
      const result = await pollJobStatus(startData.jobId);

      // 3. Preview: Show cards (do not save yet)
      setGeneratedCards(result.cards);
      setTopic(result.topic); // Update topic to the "clean" one from AI
      
      toast.success("Cards Ready! Review them below.");

    } catch (error) {
      toast.error(error.message || "Generation Failed");
      console.error(error);
    } finally {
      setLoading(false);
      setStatusText("");
    }
  };

  const handleTriggerSave = () => {
    if (!selectedSubjectId) return toast.error("Please select a Subject to save to!");
    if (generatedCards.length === 0) return toast.error("No cards to save!");
    
    // Call the parent function to save these cards to the DB
    onSaveCards(selectedSubjectId, topic, generatedCards);
    onClose();
  };

  // Helper to remove a specific card from the preview
  const removeCard = (indexToRemove) => {
    setGeneratedCards(cards => cards.filter((_, idx) => idx !== indexToRemove));
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
              {loading ? (
                <>
                  <Loader className="animate-spin" size={18} /> 
                  <span className="text-sm ml-1 truncate max-w-[100px]">{statusText}</span>
                </>
              ) : (
                <><Sparkles size={18} /> Generate</>
              )}
            </button>
          </div>
        </div>

        {/* Preview Area */}
        {generatedCards.length > 0 && (
          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3 custom-scrollbar border-t border-gray-100 dark:border-gray-700 pt-4">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Preview ({generatedCards.length})</h3>
                <span className="text-xs text-gray-400 italic">Review before saving</span>
            </div>
            
            {generatedCards.map((card, i) => (
              <div key={i} className="group relative p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition">
                <div className="font-bold text-gray-700 dark:text-gray-300 mb-1 pr-6">Q: {card.front}</div>
                <div className="text-gray-500 dark:text-gray-400">A: {card.back}</div>
                
                {/* Delete Button (Hover Only) */}
                <button 
                    onClick={() => removeCard(i)}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition opacity-0 group-hover:opacity-100"
                    title="Remove this card"
                >
                    <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Footer (Save Button) */}
        {generatedCards.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <button
              onClick={handleTriggerSave} 
              className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
            >
              <Check size={20} /> Save {generatedCards.length} Cards to {subjects.find(s => s.id == selectedSubjectId)?.title || 'Subject'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default AICardGenerator;
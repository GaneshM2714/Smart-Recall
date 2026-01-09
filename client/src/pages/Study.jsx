import { useState, useEffect, useCallback } from 'react';
import API from '../api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Loader, RotateCw, Keyboard } from 'lucide-react';
import RichText from '../components/RichText';
import toast from 'react-hot-toast';

function Study() {
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const subjectId = searchParams.get('subjectId');
  const type = searchParams.get('type');
  
  const navigate = useNavigate();

  useEffect(() => { loadQueue(); }, []);

  const loadQueue = async () => {
    try {
      let endpoint = '/study/queue';

      if (mode === 'cram') {
        if (type === 'global') {
            endpoint = '/study/cram/global';
        } else if (subjectId) {
            endpoint = `/study/cram/${subjectId}`;
        }
      } else {
        if (subjectId) {
            endpoint = `/study/queue?subjectId=${subjectId}`;
        }
      }
      
      const { data } = await API.get(endpoint);

      if (mode === 'cram') {
        // Simple shuffle for cram mode
        data.sort(() => Math.random() - 0.5);
      }

      setQueue(data);
      setLoading(false);
    } catch (error) {
      console.error("Load Error:", error);
      toast.error("Failed to load cards");
      setLoading(false);
    }
  };

  const handleRate = async (rating) => {
    const currentCard = queue[currentIndex];
    
    // 1. Instant Visual Feedback
    setIsFlipped(false); 

    // 2. Delay slightly for animation to finish before switching content
    setTimeout(async () => {
      try {
        // Fire and forget (don't await response to keep UI snappy)
        API.post('/study/review', { cardId: currentCard.id, rating, durationMs: 5000 });

        // Logic for "Again" (Re-queue mechanism)
        if (rating === 'AGAIN') {
          setQueue(prev => {
            const newQueue = [...prev];
            // Insert back into queue ~6 cards later (or at end if shorter)
            const reInsertIndex = Math.min(currentIndex + 6, newQueue.length);
            newQueue.splice(reInsertIndex, 0, { ...currentCard, isRetry: true });
            return newQueue;
          });
          toast("Card re-queued!", { icon: '🔄', duration: 1500 });
        }

        // Move to next card or finish
        if (currentIndex < queue.length - 1 || (rating === 'AGAIN' && queue.length > 1)) {
          setCurrentIndex(prev => prev + 1);
        } else {
          // End of session
          toast.success("Session Complete! 🎉");
          navigate('/dashboard');
        }
      } catch (error) { console.error("Review failed"); }
    }, 300); // Matches CSS transition duration
  };

  // Keyboard Shortcuts
  const handleKeyDown = useCallback((event) => {
    if (loading || queue.length === 0) return;
    
    if (!isFlipped) {
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault();
        setIsFlipped(true);
      }
    } else {
      switch (event.key) {
        case '1': handleRate('AGAIN'); break;
        case '2': handleRate('HARD'); break;
        case '3': handleRate('GOOD'); break;
        case '4': handleRate('EASY'); break;
        case ' ': // Space to rate Good (common Anki behavior) or ignore
             // Optional: handleRate('GOOD'); 
             break;
        default: break;
      }
    }
  }, [isFlipped, loading, queue, currentIndex]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // --- RENDER: LOADING ---
  if (loading) return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <Loader className="animate-spin text-indigo-600 dark:text-indigo-400" size={32} />
    </div>
  );

  // --- RENDER: EMPTY/DONE ---
  if (queue.length === 0) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center transition-colors">
      <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-xl text-center border-b-4 border-gray-200 dark:border-gray-700 max-w-md w-full mx-4">
        <div className="bg-green-100 dark:bg-green-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          {mode === 'cram' ? 'Cram Session Complete!' : 'All Caught Up!'}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
            You've reviewed all due cards for now.
        </p>
        <button onClick={() => navigate('/dashboard')} className="w-full px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition transform active:scale-95">
            Back to Dashboard
        </button>
      </div>
    </div>
  );

  const card = queue[currentIndex];
  // Safe calculation for progress
  const progress = queue.length > 0 ? Math.min(100, Math.round(((currentIndex) / queue.length) * 100)) : 0;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center p-4 font-sans transition-colors">

      {/* HEADER: Progress & Exit */}
      <div className="w-full max-w-2xl mb-6 mt-2 flex flex-col gap-2">
        <div className="flex justify-between items-center px-1">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="flex items-center gap-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Exit</span>
          </button>
          
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 dark:text-gray-500 tracking-wider">
             <Keyboard size={14} />
             <span>HOTKEYS ENABLED</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-indigo-500 transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }} 
          />
        </div>
        <div className="text-right text-xs font-mono text-gray-400">
            {currentIndex + 1} / {queue.length}
        </div>
      </div>

      {/* 3D CARD CONTAINER */}
      {/* Added perspective to parent */}
      <div className="relative w-full max-w-2xl h-[28rem] perspective-1000 group">
        
        {/* The Card Inner (Rotates) */}
        <div className={`relative w-full h-full transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>

          {/* === FRONT FACE (Question) === */}
          <div className="absolute inset-0 w-full h-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border-b-[6px] border-gray-200 dark:border-gray-700 p-8 flex flex-col items-center justify-center backface-hidden z-10">
            
            {/* Retry Badge */}
            {card.isRetry && (
              <div className="absolute top-6 right-6 flex items-center gap-1 bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wide shadow-sm animate-pulse">
                <RotateCw size={12} />
                Re-Learning
              </div>
            )}

            <h3 className="text-xs uppercase text-gray-400 dark:text-gray-500 font-extrabold mb-8 tracking-[0.2em]">Question</h3>
            
            {/* Content Area */}
            {/* [&_*] forces children to inherit color, fixing dark mode rendering issues */}
            <div className="w-full text-center overflow-y-auto max-h-64 custom-scrollbar px-4">
               <div className="text-2xl md:text-3xl font-medium text-gray-800 dark:text-gray-100 [&_*]:text-gray-800 dark:[&_*]:text-gray-100 leading-relaxed">
                  <RichText content={card.front} />
               </div>
            </div>
            
            <div className="absolute bottom-6 text-gray-300 dark:text-gray-600 text-xs font-mono bg-gray-100 dark:bg-gray-800/50 px-3 py-1 rounded-full">
                Press [Space] to flip
            </div>
          </div>

          {/* === BACK FACE (Answer) === */}
          <div className="absolute inset-0 w-full h-full bg-indigo-50 dark:bg-gray-800 rounded-3xl shadow-2xl border-b-[6px] border-indigo-200 dark:border-indigo-900 p-8 flex flex-col items-center justify-center backface-hidden rotate-y-180 z-20">
            
            <h3 className="text-xs uppercase text-indigo-400 dark:text-indigo-400 font-extrabold mb-8 tracking-[0.2em]">Answer</h3>
            
            <div className="w-full text-center overflow-y-auto max-h-64 custom-scrollbar px-4">
               <div className="text-xl md:text-2xl text-gray-800 dark:text-gray-100 [&_*]:text-gray-800 dark:[&_*]:text-gray-100 leading-relaxed">
                 <RichText content={card.back} />
               </div>
            </div>

          </div>

        </div>
      </div>

      {/* CONTROLS AREA */}
      <div className="mt-8 w-full max-w-2xl h-20">
        {!isFlipped ? (
          <button
            onClick={() => setIsFlipped(true)}
            className="w-full h-full bg-indigo-600 text-white rounded-2xl font-bold text-xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 dark:shadow-none transition transform active:scale-[0.98] flex items-center justify-center gap-3"
          >
            Show Answer
          </button>
        ) : (
          <div className="grid grid-cols-4 gap-3 h-full">
            
            <button onClick={() => handleRate('AGAIN')} className="group relative flex flex-col items-center justify-center bg-white dark:bg-gray-800 border-2 border-red-100 dark:border-red-900/30 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 transition active:scale-95">
              <span className="text-red-600 dark:text-red-400 font-bold text-lg">Again</span>
              <span className="text-[10px] text-gray-400 font-mono mt-1 group-hover:text-red-500">Key: 1</span>
            </button>

            <button onClick={() => handleRate('HARD')} className="group relative flex flex-col items-center justify-center bg-white dark:bg-gray-800 border-2 border-orange-100 dark:border-orange-900/30 rounded-2xl hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-200 transition active:scale-95">
              <span className="text-orange-600 dark:text-orange-400 font-bold text-lg">Hard</span>
              <span className="text-[10px] text-gray-400 font-mono mt-1 group-hover:text-orange-500">Key: 2</span>
            </button>

            <button onClick={() => handleRate('GOOD')} className="group relative flex flex-col items-center justify-center bg-white dark:bg-gray-800 border-2 border-blue-100 dark:border-blue-900/30 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 transition active:scale-95">
              <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">Good</span>
              <span className="text-[10px] text-gray-400 font-mono mt-1 group-hover:text-blue-500">Key: 3</span>
            </button>

            <button onClick={() => handleRate('EASY')} className="group relative flex flex-col items-center justify-center bg-white dark:bg-gray-800 border-2 border-green-100 dark:border-green-900/30 rounded-2xl hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-200 transition active:scale-95">
              <span className="text-green-600 dark:text-green-400 font-bold text-lg">Easy</span>
              <span className="text-[10px] text-gray-400 font-mono mt-1 group-hover:text-green-500">Key: 4</span>
            </button>

          </div>
        )}
      </div>

      {/* HINT TEXT */}
      <div className="mt-6 text-gray-400 text-xs hidden md:block">
         Pro Tip: Use number keys <span className="font-mono bg-gray-200 dark:bg-gray-800 px-1 rounded">1-4</span> to rate cards instantly.
      </div>

    </div>
  );
}

export default Study;
import { useState, useEffect, useCallback } from 'react';
import API from '../api';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Loader } from 'lucide-react';
import RichText from '../components/RichText';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

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
    setIsFlipped(false); 

    setTimeout(async () => {
      try {
        API.post('/study/review', { cardId: currentCard.id, rating, durationMs: 5000 });

        if (rating === 'AGAIN') {
          setQueue(prev => {
            const newQueue = [...prev];
            const reInsertIndex = Math.min(currentIndex + 6, newQueue.length);
            newQueue.splice(reInsertIndex, 0, { ...currentCard, isRetry: true });
            return newQueue;
          });
          toast("Card re-queued!", { icon: '🔄', duration: 1500 });
        }

        if (currentIndex < queue.length - 1 || rating === 'AGAIN') {
          setCurrentIndex(prev => prev + 1);
        } else {
          toast.success("Session Complete! 🎉");
          navigate('/dashboard');
        }
      } catch (error) { console.error("Review failed"); }
    }, 300);
  };

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
        default: break;
      }
    }
  }, [isFlipped, loading, queue, currentIndex]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (loading) return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <Loader className="animate-spin text-indigo-600 dark:text-indigo-400" size={32} />
    </div>
  );

  if (queue.length === 0) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center transition-colors">
      <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-xl text-center border-b-4 border-gray-200 dark:border-gray-700">
        <div className="bg-green-100 dark:bg-green-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          {mode === 'cram' ? 'Cram Session Complete!' : 'All Caught Up!'}
        </h2>
        <button onClick={() => navigate('/dashboard')} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">Back to Dashboard</button>
      </div>
    </div>
  );

  const card = queue[currentIndex];
  const progress = Math.round(((currentIndex) / queue.length) * 100);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center p-4 font-sans transition-colors">

      {/* Header */}
      <div className="w-full max-w-2xl mb-6 mt-4">
        <div className="flex justify-between items-center mb-2">
          <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition">
            <ArrowLeft />
          </button>
          <span className="text-xs font-bold text-gray-400 dark:text-gray-500 tracking-wider">
            {currentIndex + 1} / {queue.length}
          </span>
        </div>
        <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* 3D CARD CONTAINER */}
      <div className="relative w-full max-w-2xl h-[28rem] perspective-1000">
        <div className={`relative w-full h-full transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>

          {/* === FRONT FACE (Question) === */}
          <div className="absolute inset-0 w-full h-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-b-8 border-gray-200 dark:border-gray-700 p-8 flex flex-col items-center justify-center backface-hidden transition-colors">
            {card.isRetry && (
              <div className="absolute top-4 right-4 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                Re-Learning
              </div>
            )}

            <h3 className="text-xs uppercase text-gray-400 dark:text-gray-500 font-bold mb-6 tracking-widest">Question</h3>
            
            {/* FIX: Force all child elements ([&_*]) to inherit the correct color */}
            <div className="text-gray-800 dark:text-gray-100 [&_*]:text-gray-800 dark:[&_*]:text-gray-100 text-xl font-medium text-center w-full overflow-y-auto max-h-60 custom-scrollbar">
              <RichText content={card.front} />
            </div>
            
            <div className="absolute bottom-6 text-gray-300 dark:text-gray-600 text-xs font-mono">Press [Space] to flip</div>
          </div>

          {/* === BACK FACE (Answer) === */}
          <div className="absolute inset-0 w-full h-full bg-indigo-50 dark:bg-gray-800 rounded-2xl shadow-xl border-b-8 border-indigo-200 dark:border-indigo-900 p-8 flex flex-col items-center justify-center backface-hidden rotate-y-180 transition-colors">
            <h3 className="text-xs uppercase text-indigo-400 dark:text-indigo-400 font-bold mb-6 tracking-widest">Answer</h3>
            
            {/* FIX: Force all child elements ([&_*]) to inherit the correct color */}
            <div className="text-gray-800 dark:text-gray-100 [&_*]:text-gray-800 dark:[&_*]:text-gray-100 text-lg text-center w-full overflow-y-auto max-h-60 custom-scrollbar">
              <RichText content={card.back} />
            </div>
          </div>

        </div>
      </div>

      {/* CONTROLS */}
      <div className="mt-8 w-full max-w-2xl h-20">
        {!isFlipped ? (
          <button
            onClick={() => setIsFlipped(true)}
            className="w-full h-full bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition transform active:scale-[0.98]"
          >
            Show Answer
          </button>
        ) : (
          <div className="grid grid-cols-4 gap-4 h-full">
            <button onClick={() => handleRate('AGAIN')} className="btn-rate bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-b-4 border-red-200 dark:border-red-800 hover:bg-red-200 dark:hover:bg-red-900/50 transition">
              <span className="font-bold block">Again</span>
              <span className="text-[10px] opacity-60">Key: 1</span>
            </button>
            <button onClick={() => handleRate('HARD')} className="btn-rate bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-b-4 border-orange-200 dark:border-orange-800 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition">
              <span className="font-bold block">Hard</span>
              <span className="text-[10px] opacity-60">Key: 2</span>
            </button>
            <button onClick={() => handleRate('GOOD')} className="btn-rate bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-b-4 border-blue-200 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition">
              <span className="font-bold block">Good</span>
              <span className="text-[10px] opacity-60">Key: 3</span>
            </button>
            <button onClick={() => handleRate('EASY')} className="btn-rate bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-b-4 border-green-200 dark:border-green-800 hover:bg-green-200 dark:hover:bg-green-900/50 transition">
              <span className="font-bold block">Easy</span>
              <span className="text-[10px] opacity-60">Key: 4</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Study;
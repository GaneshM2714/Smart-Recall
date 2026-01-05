import { useState, useEffect, useCallback } from 'react';
import API from '../api';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
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
      let endpoint = '/study/queue'; // Default

      if (mode === 'cram') {
        if (type === 'global') {
            endpoint = '/study/cram/global'; // New Global Shuffle
        } else if (subjectId) {
            endpoint = `/study/cram/${subjectId}`; // Subject Cram
        }
      }

      const { data } = await API.get(endpoint);

      // Shuffle for cram mode so it's not predictable
      if (mode === 'cram') {
        data.sort(() => Math.random() - 0.5);
      }

      setQueue(data);
      setLoading(false);
    } catch (error) {
      toast.error("Failed to load cards");
      setLoading(false);
    }
  };

  const handleRate = async (rating) => {
    const currentCard = queue[currentIndex];
    setIsFlipped(false); // Reset flip instantly for logic

    // Tiny delay to allow the flip animation to reset visually before content changes
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
    }, 300); // Wait for half the flip animation (optional smoothness)
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

  if (loading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;

  if (queue.length === 0) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="bg-white p-10 rounded-2xl shadow-xl text-center border-b-4 border-gray-200">
        <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {mode === 'cram' ? 'Cram Session Complete!' : 'All Caught Up!'}
        </h2>
        <button onClick={() => navigate('/dashboard')} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">Back to Dashboard</button>
      </div>
    </div>
  );

  const card = queue[currentIndex];
  const progress = Math.round(((currentIndex) / queue.length) * 100);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4 font-sans">

      {/* Header */}
      <div className="w-full max-w-2xl mb-6 mt-4">
        <div className="flex justify-between items-center mb-2">
          <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-700"><ArrowLeft /></button>
          <span className="text-xs font-bold text-gray-400 tracking-wider">{currentIndex + 1} / {queue.length}</span>
        </div>
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* 3D CARD CONTAINER */}
      <div className="relative w-full max-w-2xl h-[28rem] perspective-1000">

        {/* THE FLIPPING CARD WRAPPER */}
        <div
          className={`relative w-full h-full transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
        >

          {/* === FRONT FACE (Question) === */}
          <div className="absolute inset-0 w-full h-full bg-white rounded-2xl shadow-xl border-b-8 border-gray-200 p-8 flex flex-col items-center justify-center backface-hidden">
            {/* Retry Badge */}
            {card.isRetry && (
              <div className="absolute top-4 right-4 bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                Re-Learning
              </div>
            )}

            <h3 className="text-xs uppercase text-gray-400 font-bold mb-6 tracking-widest">Question</h3>
            <div className="text-gray-800 text-xl font-medium text-center">
              <RichText content={card.front} />
            </div>
            <div className="absolute bottom-6 text-gray-300 text-xs font-mono">Press [Space] to flip</div>
          </div>

          {/* === BACK FACE (Answer) === */}
          <div className="absolute inset-0 w-full h-full bg-indigo-50 rounded-2xl shadow-xl border-b-8 border-indigo-200 p-8 flex flex-col items-center justify-center backface-hidden rotate-y-180">
            <h3 className="text-xs uppercase text-indigo-400 font-bold mb-6 tracking-widest">Answer</h3>
            <div className="text-gray-800 text-lg text-center">
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
            className="w-full h-full bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition transform active:scale-[0.98]"
          >
            Show Answer
          </button>
        ) : (
          <div className="grid grid-cols-4 gap-4 h-full">
            <button onClick={() => handleRate('AGAIN')} className="btn-rate bg-red-100 text-red-700 border-b-4 border-red-200 hover:bg-red-200 hover:border-red-300">
              <span className="font-bold block">Again</span>
              <span className="text-[10px] opacity-60">Key: 1</span>
            </button>
            <button onClick={() => handleRate('HARD')} className="btn-rate bg-orange-100 text-orange-700 border-b-4 border-orange-200 hover:bg-orange-200 hover:border-orange-300">
              <span className="font-bold block">Hard</span>
              <span className="text-[10px] opacity-60">Key: 2</span>
            </button>
            <button onClick={() => handleRate('GOOD')} className="btn-rate bg-blue-100 text-blue-700 border-b-4 border-blue-200 hover:bg-blue-200 hover:border-blue-300">
              <span className="font-bold block">Good</span>
              <span className="text-[10px] opacity-60">Key: 3</span>
            </button>
            <button onClick={() => handleRate('EASY')} className="btn-rate bg-green-100 text-green-700 border-b-4 border-green-200 hover:bg-green-200 hover:border-green-300">
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
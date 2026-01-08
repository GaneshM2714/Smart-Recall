import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';
import { ArrowLeft, Search, Plus, Settings } from 'lucide-react'; // Added Settings icon
import toast from 'react-hot-toast';
import VirtualCardList from '../components/VirtualCardList'; 
import EditCardModal from '../components/EditCardModal';      // <--- IMPORTED
import TopicManagerModal from '../components/TopicManagerModal'; // <--- IMPORTED

function SubjectView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // UI States
  const [editingCard, setEditingCard] = useState(null);
  const [showTopicManager, setShowTopicManager] = useState(false);

  useEffect(() => { fetchDetails(); }, [id]);

  const fetchDetails = async () => {
    try {
      const { data } = await API.get(`/content/subjects/${id}/cards`);
      setTopics(data);
      setLoading(false);
    } catch (error) {
      toast.error("Failed to load cards");
      navigate('/dashboard');
    }
  };

  const handleDeleteCard = async (cardId) => {
    if(!confirm("Delete this card?")) return;
    try {
      await API.delete(`/content/cards/${cardId}`);
      toast.success("Card deleted");
      fetchDetails();
    } catch (err) { toast.error("Failed to delete"); }
  };

  // Callback when a card is updated in the modal
  const handleCardUpdated = (updatedCard) => {
    fetchDetails(); // Refresh list to show changes
  };

  // 1. Filter topics based on search
  const filteredTopics = topics.map(topic => ({
    ...topic,
    Cards: topic.Cards.filter(c => 
      c.front.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.back.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(t => t.Cards.length > 0 || searchTerm === '');

  // 2. Flatten for Virtual List
  const allCards = filteredTopics.flatMap(t => 
    t.Cards.map(c => ({ ...c, topicName: t.title }))
  );

  if (loading) return <div className="p-8 text-center">Loading Library...</div>;

  return (
    <div className="h-screen flex flex-col p-6 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
                <ArrowLeft size={24} className="text-gray-600 dark:text-gray-300" />
            </button>
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subject Details</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your cards and topics</p>
            </div>
        </div>
        
        <div className="flex gap-2">
            {/* Manage Topics Button */}
            <button 
                onClick={() => setShowTopicManager(true)}
                className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition font-medium border border-gray-200 dark:border-gray-700"
            >
                <Settings size={18} /> Topics
            </button>

            {/* Add Card Button */}
            <button 
                onClick={() => navigate('/add-card')}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-medium shadow-md shadow-indigo-200 dark:shadow-none"
            >
                <Plus size={18} /> Add Card
            </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative shrink-0">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input 
            type="text"
            placeholder="Search for a question or answer..."
            className="w-full pl-10 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Virtual List Container */}
      <div className="flex-1 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900/50">
        {allCards.length > 0 ? (
           <VirtualCardList 
             cards={allCards} 
             onDelete={handleDeleteCard}
             onEdit={(card) => setEditingCard(card)} // <--- CONNECTED HERE
           />
        ) : (
           <div className="flex flex-col items-center justify-center h-full text-gray-500">
             <p>No cards found.</p>
           </div>
        )}
      </div>

      {/* --- MODALS --- */}
      
      {/* 1. Edit Card Modal */}
      {editingCard && (
        <EditCardModal 
            card={editingCard}
            onClose={() => setEditingCard(null)}
            onUpdate={handleCardUpdated}
        />
      )}

      {/* 2. Topic Manager Modal */}
      {showTopicManager && (
        <TopicManagerModal 
            topics={topics} // Pass original unfiltered topics
            onClose={() => setShowTopicManager(false)}
            onTopicDeleted={() => {
                fetchDetails(); // Refresh list if a topic is deleted
            }}
        />
      )}

    </div>
  );
}

export default SubjectView;
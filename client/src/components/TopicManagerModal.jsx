import { X, Trash2, FolderOpen } from 'lucide-react';
import API from '../api';
import toast from 'react-hot-toast';

const TopicManagerModal = ({ topics, onClose, onTopicDeleted }) => {
  
  const handleDelete = async (topicId) => {
    if (!confirm("Delete this topic? All cards inside it will be lost forever.")) return;

    try {
      await API.delete(`/content/topics/${topicId}`); // Using the route we created
      toast.success("Topic deleted");
      onTopicDeleted(); // Refresh the parent
    } catch (error) {
      toast.error("Failed to delete topic");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
            <FolderOpen className="text-indigo-500" size={20} /> Manage Topics
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>

        <div className="p-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {topics.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No topics found.</div>
          ) : (
            topics.map(topic => (
              <div key={topic.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg group transition-colors">
                <div>
                  <div className="font-medium text-gray-800 dark:text-gray-200">{topic.title}</div>
                  <div className="text-xs text-gray-500">{topic.Cards?.length || 0} cards</div>
                </div>
                <button 
                  onClick={() => handleDelete(topic.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  title="Delete Topic"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 text-center">
            <button onClick={onClose} className="text-sm text-indigo-600 hover:underline">
                Done
            </button>
        </div>
      </div>
    </div>
  );
};

export default TopicManagerModal;
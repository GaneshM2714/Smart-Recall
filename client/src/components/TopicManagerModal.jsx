import { X, Trash2, FolderOpen, AlertTriangle } from 'lucide-react';
import API from '../api';
import toast from 'react-hot-toast';

const TopicManagerModal = ({ topics, onClose, onTopicDeleted }) => {
  
  // 1. Core Delete Logic
  const executeDelete = async (topicId) => {
    try {
      await API.delete(`/content/topics/${topicId}`); 
      toast.success("Topic deleted successfully", {
        style: { borderRadius: '10px', background: '#333', color: '#fff' },
      });
      onTopicDeleted(); 
    } catch (error) {
      toast.error("Failed to delete topic", {
        style: { borderRadius: '10px', background: '#333', color: '#fff' },
      });
    }
  };

  // 👇 2. FIXED: Dark Mode Compatible Delete Toast
  const handleDelete = (topicId) => {
    toast((t) => (
      <div className="relative w-full max-w-sm bg-gray-800 border border-gray-700 shadow-xl rounded-xl p-4 flex gap-4">
        
        {/* Close Button (Absolute Top-Right) */}
        <button
          onClick={() => toast.dismiss(t.id)}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        {/* Icon Column */}
        <div className="shrink-0">
          <div className="h-10 w-10 rounded-full bg-red-900/30 flex items-center justify-center border border-red-900/50">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
        </div>

        {/* Content Column */}
        <div className="flex-1 pr-4"> {/* Added right padding to avoid text hitting the X */}
          <h4 className="font-bold text-white text-sm">Delete this topic?</h4>
          <p className="mt-1 text-sm text-gray-400 leading-relaxed">
            This action cannot be undone. All cards inside will be lost.
          </p>

          {/* Buttons Row */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => {
                executeDelete(topicId);
                toast.dismiss(t.id);
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-bold rounded-lg transition-colors border border-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    ), {
      duration: Infinity,
      position: 'top-center',
      // Reset default styles so our Tailwind classes take full control
      style: {
        background: 'transparent',
        boxShadow: 'none',
        border: 'none',
        padding: 0,
        maxWidth: '100%' // Allow our div to control width
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      
      {/* Modal Container */}
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
          <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
            <FolderOpen className="text-indigo-600 dark:text-indigo-400" size={20} /> 
            Manage Topics
          </h3>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* List Content */}
        <div className="p-2 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-gray-900">
          {topics.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500 gap-2">
              <FolderOpen size={40} className="opacity-20" />
              <p className="text-sm">No topics found in this subject.</p>
            </div>
          ) : (
            topics.map(topic => (
              <div 
                key={topic.id} 
                className="flex items-center justify-between p-3 mb-1 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl group transition-all duration-200 border border-transparent hover:border-gray-100 dark:hover:border-gray-700"
              >
                <div className="pl-1">
                  <div className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                    {topic.title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {topic.Cards?.length || 0} cards
                  </div>
                </div>

                <button 
                  onClick={() => handleDelete(topic.id)} 
                  className="p-2 text-gray-300 dark:text-gray-600 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Delete Topic"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 text-center shrink-0">
            <button 
                onClick={onClose} 
                className="text-sm font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline transition-all"
            >
                Done
            </button>
        </div>

      </div>
    </div>
  );
};

export default TopicManagerModal;
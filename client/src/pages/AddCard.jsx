import { useState, useEffect } from 'react';
import API from '../api';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Save, Layers, Eye, Edit2 } from 'lucide-react';
import Card from '../components/ui/Card';
import toast from 'react-hot-toast';
import RichText from '../components/RichText';
import MarkdownToolbar from '../components/MarkdownToolbar'; // <--- IMPORT THIS

function AddCard() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  
  // Content State
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [status, setStatus] = useState('');
  
  // Toggle for Preview Mode
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => { fetchStructure(); }, []);

  const fetchStructure = async () => {
    try {
      const { data } = await API.get('/content/subjects');
      setSubjects(data);
      if (data.length > 0 && !selectedSubject) {
        setSelectedSubject(data[0].id);
      }
    } catch (error) { console.error("Failed to load subjects"); }
  };

  const handleCreateTopic = async () => {
    if (!selectedSubject) return toast.error("Please select a Subject first.");
    const title = prompt("Enter new Topic name:"); 
    if (!title) return;
    try {
      await API.post(`/content/topics/${selectedSubject}`, { title });
      await fetchStructure();
      toast.success("Topic Created!");
    } catch (error) { toast.error("Failed to create topic."); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedTopic || !front.trim() || !back.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await API.post('/content/cards', { 
        topicId: selectedTopic, 
        front, 
        back, 
        cardType: 'BASIC' 
      });

      setFront('');
      setBack('');
      setStatus('Card Saved!');
      toast.success('Card Saved!');
      setTimeout(() => setStatus(''), 2000);
      document.getElementById('frontInput')?.focus();
    } catch (error) { 
      console.error(error);
      toast.error("Error saving card"); 
    }
  };

  const activeSubject = subjects.find(s => s.id === selectedSubject);
  const activeTopics = activeSubject?.Topics || [];

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-10">
      
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
         <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Add New Card</h1>
         <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center gap-2 transition-colors">
            <ArrowLeft size={20} /> Back to Dashboard
         </button>
      </div>

      <Card className="p-8">
        
        {/* Selection Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 border-b border-gray-100 dark:border-gray-700 pb-8">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">Subject</label>
            <div className="relative">
              <Layers className="absolute left-3 top-3 text-gray-400" size={18} />
              <select 
                className="w-full pl-10 p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                value={selectedSubject}
                onChange={(e) => { setSelectedSubject(e.target.value); setSelectedTopic(''); }}
              >
                <option value="">Select Subject...</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">Topic</label>
            <div className="flex gap-2">
              <select 
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                disabled={!selectedSubject}
              >
                <option value="">{selectedSubject ? 'Select Topic...' : 'Choose Subject First'}</option>
                {activeTopics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>

              <button 
                type="button"
                onClick={handleCreateTopic}
                disabled={!selectedSubject}
                className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 transition-colors"
                title="Create New Topic"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Tabs for Write / Preview */}
          <div className="flex justify-end gap-2">
            <button
                type="button"
                onClick={() => setIsPreview(false)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${!isPreview ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
            >
                <Edit2 size={14} /> Write
            </button>
            <button
                type="button"
                onClick={() => setIsPreview(true)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${isPreview ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
            >
                <Eye size={14} /> Preview
            </button>
          </div>

          {/* FRONT */}
          <div>
             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
                Front (Question)
             </label>
             {isPreview ? (
                <div className="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-lg min-h-[100px] bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100">
                    <RichText content={front || "*(Empty)*"} />
                </div>
             ) : (
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow">
                    {/* Toolbar */}
                    <MarkdownToolbar textAreaId="frontInput" onInsert={setFront} />
                    
                    <textarea
                        id="frontInput"
                        className="w-full p-4 h-32 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none resize-none transition-colors font-mono text-sm"
                        placeholder="Type your question..."
                        value={front}
                        onChange={(e) => setFront(e.target.value)}
                    />
                </div>
             )}
          </div>

          {/* BACK */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
                Back (Answer)
            </label>
            {isPreview ? (
                <div className="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-lg min-h-[120px] bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100">
                    <RichText content={back || "*(Empty)*"} />
                </div>
             ) : (
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow">
                    {/* Toolbar */}
                    <MarkdownToolbar textAreaId="backInput" onInsert={setBack} />
                    
                    <textarea
                        id="backInput"
                        className="w-full p-4 h-40 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none resize-none transition-colors font-mono text-sm"
                        placeholder="Type your answer..."
                        value={back}
                        onChange={(e) => setBack(e.target.value)}
                    />
                </div>
             )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-700">
            <span className="text-green-600 dark:text-green-400 font-medium text-sm animate-fade-in">
                {status}
            </span>
            <button 
              type="submit" 
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2 font-bold shadow-lg shadow-indigo-200 dark:shadow-none"
            >
              <Save size={18} /> Save Card
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default AddCard;
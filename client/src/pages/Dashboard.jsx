import { useState, useEffect } from 'react';
import API from '../api';
import { BookOpen, Plus, TrendingUp, Layers, Zap, Network, Flame, Calendar } from 'lucide-react'; // 👈 Added Flame & Calendar
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer 
} from 'recharts';
import InputModal from '../components/InputModal';
import Card from '../components/ui/Card';
import SubjectMenu from '../components/SubjectMenu';
import SubjectVisualizer from '../components/SubjectVisualizer'; 
import ActivityHeatmap from '../components/ActivityHeatmap'; // 👈 Import the Heatmap
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';

function Dashboard() {
  const [subjects, setSubjects] = useState([]);
  
  // --- GAMIFICATION STATE ---
  const [heatmapData, setHeatmapData] = useState({});
  const [streak, setStreak] = useState(0);

  // MODAL STATE
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); 
  const [activeSubjectId, setActiveSubjectId] = useState(null);
  const [modalDefaultText, setModalDefaultText] = useState('');

  // VISUALIZER STATE
  const [graphSubjectId, setGraphSubjectId] = useState(null); 

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchData();
  }, [location.key]);

  const fetchData = async () => {
    try {
      const [subRes, chartRes] = await Promise.all([
        API.get('/content/subjects'),
        API.get('/study/analytics')
      ]);
      setSubjects(subRes.data);
      
      // 👈 Set Gamification Data from Backend
      setHeatmapData(chartRes.data.heatmap || {}); 
      setStreak(chartRes.data.streak || 0);

    } catch (error) { toast.error("Failed to load dashboard data"); }
  };

  // --- ACTIONS ---

  const openCreateModal = () => {
    setModalMode('create');
    setModalDefaultText('');
    setIsModalOpen(true);
  };

  const openRenameModal = (id, currentTitle) => {
    setModalMode('rename');
    setActiveSubjectId(id);
    setModalDefaultText(currentTitle);
    setIsModalOpen(true);
  };

  const handleSaveSubject = async (title) => {
    try {
      if (modalMode === 'create') {
        const { data } = await API.post('/content/subjects', { title });
        
        if (data.created) {
            toast.success('Subject Created!');
        } else {
            toast('Subject already exists', { icon: 'ℹ️' });
        }

      } else {
        const { data } = await API.put(`/content/subjects/${activeSubjectId}`, { title });
        if(!data.created){
          toast("Subject already exists", {icon : 'ℹ️'});
        }
        else toast.success('Subject Renamed!');
      }
      fetchData();
    } catch (error) {
      toast.error(modalMode === 'create' ? 'Failed to create' : 'Failed to rename');
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure? This will delete all cards in this subject.")) {
      await API.delete(`/content/subjects/${id}`);
      toast.success("Deleted");
      fetchData();
    }
  };

  const handleCram = (id) => {
    navigate(`/study?mode=cram&subjectId=${id}`);
  };

  // --- CALCULATE MASTERY DATA ---
  const totalMastered = subjects.reduce((acc, s) => acc + (s.masteredCount || 0), 0);
  const totalLearning = subjects.reduce((acc, s) => acc + (s.learningCount || 0), 0);
  const totalNew = subjects.reduce((acc, s) => acc + (s.newCount || 0), 0);
  const totalCards = totalMastered + totalLearning + totalNew || 1; 

  // Data for the Donut Chart
  const masteryData = [
    { name: 'Mastered', value: totalMastered || 1, color: '#10b981' }, 
    { name: 'Learning', value: totalLearning || 1, color: '#6366f1' }, 
    { name: 'New', value: totalNew || 1, color: '#e5e7eb' }, 
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto animate-fade-in relative pb-10">

      {/* --- VISUALIZER OVERLAY --- */}
      {graphSubjectId && (
         <SubjectVisualizer 
            subjectId={graphSubjectId} 
            onClose={() => setGraphSubjectId(null)} 
         />
      )}

      {/* Header Section */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1 dark:text-gray-400">Overview of your learning progress</p>
        </div>
        
        <div className="flex items-center gap-4">
            {/* 🔥 STREAK BADGE */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold shadow-sm transition-all ${streak > 0 ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>
                <Flame size={20} className={streak > 0 ? "fill-orange-500 animate-pulse" : ""} />
                <span>{streak} Day Streak</span>
            </div>

            <span className="hidden sm:block text-sm font-mono text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-full">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
        </div>
      </div>

      {/* TOP ROW: Analytics (Left) + Widgets (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">

        {/* 1. Analytics Chart: BRAIN MASTERY */}
        <Card className="xl:col-span-2 p-6 flex flex-col justify-between relative overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                <TrendingUp size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">Brain Mastery</h2>
                <p className="text-xs text-gray-500">Distribution of your knowledge</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center h-full">
            
            {/* DONUT CHART */}
            <div className="h-64 w-full md:w-1/2 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={masteryData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {masteryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1f2937', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Center Text Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-gray-800 dark:text-white">
                    {totalCards === 1 && totalMastered === 0 ? 0 : totalCards}
                </span>
                <span className="text-xs text-gray-400 uppercase tracking-wider">Total Cards</span>
              </div>
            </div>

            {/* LEGEND / DETAILS */}
            <div className="w-full md:w-1/2 pl-0 md:pl-8 mt-4 md:mt-0 space-y-4">
              
              {/* Item 1: Mastered */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mastered</span>
                </div>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {Math.round((totalMastered / totalCards) * 100)}%
                </span>
              </div>

              {/* Item 2: Learning */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50"></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Learning</span>
                </div>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {Math.round((totalLearning / totalCards) * 100)}%
                </span>
              </div>

              {/* Item 3: New */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">New</span>
                </div>
                <span className="font-bold text-gray-500 dark:text-gray-400">
                      {Math.round((totalNew / totalCards) * 100)}%
                </span>
              </div>

            </div>
          </div>
        </Card>

        {/* 2. Action Widgets */}
        <div className="flex flex-col gap-4">
          <button
            onClick={() => navigate('/study?mode=cram&type=global')}
            className="flex-1 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-left shadow-lg relative overflow-hidden group transition-all hover:scale-[1.02] min-h-[140px]"
          >
            <Zap size={100} className="absolute -right-4 -bottom-4 text-white opacity-20 group-hover:rotate-12 transition-transform" />
            <div className="relative z-10 text-white flex flex-col h-full justify-between">
              <div className="bg-white/20 w-fit p-2 rounded-lg">
                <Zap size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-1">Random Mix</h3>
                <p className="opacity-90 text-sm">Shuffle 20 cards from all subjects</p>
              </div>
            </div>
          </button>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/add-card')}
              className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-500 hover:shadow-sm transition-all text-center group"
            >
              <Plus className="mx-auto mb-2 text-indigo-600 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Add Card</span>
            </button>
            <button
              onClick={openCreateModal}
              className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-500 hover:shadow-sm transition-all text-center group"
            >
              <Layers className="mx-auto mb-2 text-indigo-600 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200">New Subject</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* --- ROW 2: HABIT TRACKER (HEATMAP) --- */}
      <Card className="p-6 mb-8 border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2 mb-4">
           <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                <Calendar size={20} />
            </div>
            <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">Study Consistency</h2>
                <p className="text-xs text-gray-500">Every green square is a step towards mastery</p>
            </div>
        </div>
        
        {/* THE HEATMAP COMPONENT */}
        <ActivityHeatmap activityLog={heatmapData} />
      </Card>

      {/* 3. Subjects Grid */}
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Your Library</h2>

      {subjects.length === 0 ? (
        <Card className="text-center py-12 border-dashed">
          <p className="text-gray-500 dark:text-gray-400">No subjects yet. Create one above!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8">
          {subjects.map((sub) => (
            <Card key={sub.id} className="p-6 hover:shadow-md transition-all duration-200 group relative flex flex-col justify-between h-full">

              {/* Subject Info */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3
                    className="text-lg font-bold text-gray-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors cursor-pointer"
                    onClick={() => navigate(`/subject/${sub.id}`)}
                  >
                    {sub.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{sub.Topics?.length || 0} Topics</p>
                </div>

                <div className="flex items-center gap-2">
                  
                  {/* GRAPH BUTTON */}
                  <button 
                      onClick={() => setGraphSubjectId(sub.id)}
                      className="p-1.5 text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition"
                      title="Visualize Knowledge Space"
                  >
                      <Network size={18} />
                  </button>

                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${sub.dueCount > 0 ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-300'}`}>
                    {sub.dueCount > 0 ? `${sub.dueCount}` : 'Done'}
                  </span>
                  
                  <SubjectMenu
                    onEdit={() => openRenameModal(sub.id, sub.title)}
                    onDelete={() => handleDelete(sub.id)}
                    onCram={() => handleCram(sub.id)}
                  />
                </div>
              </div>

              {/* Split Buttons */}
              <div className="flex items-center gap-2 mt-auto">
                <button
                  onClick={() => navigate(`/study?mode=normal&subjectId=${sub.id}`)}
                  className="flex-1 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition shadow-sm hover:shadow active:scale-[0.98] flex items-center justify-center gap-2"
                  title="Start spaced repetition session"
                >
                  <BookOpen size={18} />
                  Study
                </button>

                <button
                  onClick={() => navigate(`/subject/${sub.id}`)}
                  className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition active:scale-[0.98] flex items-center justify-center"
                  title="View list of cards"
                >
                  <div className="flex items-center gap-2">
                    <Layers size={18} />
                    <span className="hidden xl:inline">View</span>
                  </div>
                </button>
              </div>

            </Card>
          ))}

          
        </div>
      )}

      {/* Modal */}
      <InputModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveSubject}
        title={modalMode === 'create' ? "New Subject" : "Rename Subject"}
        placeholder={modalDefaultText || "e.g., Data Structures"}
      />
    </div>
  );
}

export default Dashboard;
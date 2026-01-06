import { useState, useEffect } from 'react';
import API from '../api';
import { BookOpen, Plus, TrendingUp, Layers, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import InputModal from '../components/InputModal';
import Card from '../components/ui/Card';
import SubjectMenu from '../components/SubjectMenu';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom'

function Dashboard() {
  const [subjects, setSubjects] = useState([]);
  const [chartData, setChartData] = useState([]);

  // MODAL STATE
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'rename'
  const [activeSubjectId, setActiveSubjectId] = useState(null);
  const [modalDefaultText, setModalDefaultText] = useState('');

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
      setChartData(chartRes.data);
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
        await API.post('/content/subjects', { title });
        toast.success('Subject Created!');
      } else {
        await API.put(`/content/subjects/${activeSubjectId}`, { title });
        toast.success('Subject Renamed!');
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

  return (
    <div className="w-full max-w-[1600px] mx-auto animate-fade-in">

      {/* Header Section */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1 dark:text-gray-400">Overview of your learning progress</p>
        </div>
        <span className="hidden sm:block text-sm font-mono text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      {/* TOP ROW: Analytics (Left) + Widgets (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">

        {/* 1. Analytics Chart (Takes 2/3rds width on large screens) */}
        <Card className="xl:col-span-2 p-6 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <TrendingUp size={20} />
            </div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Weekly Activity</h2>
          </div>
          {/* Fixed Height Container for Chart */}
          <div className="h-64 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', backgroundColor: '#1f2937', color: '#fff', border: 'none' }}
                  />
                  <Bar dataKey="reviews" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">Start studying to see your stats here!</div>
            )}
          </div>
        </Card>

        {/* 2. Action Widgets (Takes 1/3rd width) */}
        <div className="flex flex-col gap-4">
          {/* Big Random Mix Button */}
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

          {/* Smaller Actions Row */}
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

      {/* 3. Subjects Grid (Expanded Columns) */}
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
                  onClick={() => navigate('/study')}
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
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import { BookOpen, Brain, Zap, BarChart3, ChevronRight, Layers, LayoutDashboard, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

function Landing() {
  const navigate = useNavigate();
  // Simple check: Do we have a token?
  const isLoggedIn = !!localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors selection:bg-indigo-500 selection:text-white">
      
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-2xl text-gray-900 dark:text-white">
          <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
            <BookOpen size={24} />
          </div>
          <span>Smart Recall</span>
        </div>
        
        {/* CONDITIONAL NAV BUTTONS */}
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
               {/* User is Logged In: Show Dashboard & Logout */}
              <Link 
                to="/dashboard" 
                className="hidden md:flex items-center gap-2 text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-white font-medium transition"
              >
                <LayoutDashboard size={18} /> Dashboard
              </Link>
              <button 
                onClick={handleLogout}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium transition flex items-center gap-2"
              >
                <LogOut size={18} /> Logout
              </button>
            </>
          ) : (
            <>
               {/* Guest: Show Login & Register */}
              <Link to="/login" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium transition">
                Log in
              </Link>
              <Link to="/register" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition shadow-lg shadow-indigo-200 dark:shadow-none">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-7xl mx-auto px-6 py-20 md:py-32 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-sm font-medium mb-6 animate-fade-in">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          v1.0 is now live
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-8 leading-tight">
          Master any subject with <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
            Spaced Repetition
          </span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Stop forgetting what you learn. Our AI-powered algorithm schedules your reviews at the perfect moment, so you learn faster and remember longer.
        </p>
        
        {/* CONDITIONAL HERO BUTTONS */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {isLoggedIn ? (
             <Link to="/dashboard" className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 hover:scale-105 transition transform flex items-center justify-center gap-2 shadow-xl shadow-indigo-200 dark:shadow-none">
                <LayoutDashboard size={20} /> Go to Dashboard
             </Link>
          ) : (
            <>
              <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-lg hover:scale-105 transition transform flex items-center justify-center gap-2">
                Start Learning Free <ChevronRight size={20} />
              </Link>
              <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-bold text-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                View Demo
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Features Grid (Stays the same) */}
      <section className="bg-gray-50 dark:bg-gray-800/50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Why Smart Recall?</h2>
            <p className="text-gray-600 dark:text-gray-400">Everything you need to ace your exams and master your skills.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Brain size={32} className="text-indigo-600 dark:text-indigo-400" />}
              title="FSRS Algorithm"
              desc="Our advanced scheduling engine adapts to your memory, ensuring you only review what you're about to forget."
            />
            <FeatureCard 
              icon={<Layers size={32} className="text-purple-600 dark:text-purple-400" />}
              title="Structured Learning"
              desc="Organize complex topics into Subjects and Chapters. Perfect for university courses or coding bootcamps."
            />
            <FeatureCard 
              icon={<Zap size={32} className="text-yellow-600 dark:text-yellow-400" />}
              title="Cram Mode"
              desc="Exam tomorrow? Override the schedule and review an entire deck instantly with our dedicated Cram Mode."
            />
            <FeatureCard 
              icon={<BarChart3 size={32} className="text-green-600 dark:text-green-400" />}
              title="Visual Analytics"
              desc="Track your daily progress with detailed heatmaps and charts. Watch your knowledge grow over time."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-12 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-xl text-gray-900 dark:text-white">
            <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 p-1 rounded">
              <BookOpen size={16} />
            </div>
            <span>Smart Recall</span>
          </div>
          <p className="text-gray-500 text-sm">© 2026 Smart Recall. Built for Students.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition">
      <div className="mb-4 bg-gray-50 dark:bg-gray-700/50 w-16 h-16 rounded-xl flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{desc}</p>
    </div>
  );
}

export default Landing;
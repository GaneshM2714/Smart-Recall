import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  User, 
  LogOut, 
  BookOpen, 
  Zap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

function Sidebar({ isCollapsed, toggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const isActive = (path) => location.pathname === path;
  
  // Dynamic class for links
  const navItemClass = (path) => 
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium cursor-pointer ${
      isActive(path) 
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none' 
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
    } ${isCollapsed ? 'justify-center px-2' : ''}`; // Center icons when collapsed

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <aside 
      className={`h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col fixed left-0 top-0 z-50 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      
      {/* 1. Logo Area */}
      <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} transition-all`}>
        <div className="bg-indigo-600 text-white p-2 rounded-lg shrink-0">
          <BookOpen size={20} />
        </div>
        {!isCollapsed && (
          <span className="font-bold text-xl text-gray-800 dark:text-white whitespace-nowrap overflow-hidden animate-fade-in">
            Memory-Forged
          </span>
        )}
      </div>

      {/* 2. Navigation Links */}
      <nav className="flex-1 px-4 space-y-2 mt-4 overflow-hidden">
        {!isCollapsed && <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2 whitespace-nowrap">Menu</div>}
        
        <Link to="/dashboard" className={navItemClass('/dashboard')} title="Dashboard">
          <LayoutDashboard size={20} className="shrink-0" /> 
          {!isCollapsed && <span className="whitespace-nowrap">Dashboard</span>}
        </Link>
        
        <Link to="/add-card" className={navItemClass('/add-card')} title="Add Card">
          <PlusCircle size={20} className="shrink-0" /> 
          {!isCollapsed && <span className="whitespace-nowrap">Add Card</span>}
        </Link>

        <Link to="/profile" className={navItemClass('/profile')} title="Profile">
           <User size={20} className="shrink-0" /> 
           {!isCollapsed && <span className="whitespace-nowrap">Profile</span>}
        </Link>

        {/* Separator */}
        <div className="my-6 border-t border-gray-100 dark:border-gray-800"></div>

        {!isCollapsed && <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2 whitespace-nowrap">Study</div>}
        
        <button 
            onClick={() => navigate('/study?mode=cram&type=global')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors font-medium ${isCollapsed ? 'justify-center px-2' : ''}`}
            title="Random Mix"
        >
            <Zap size={20} className="shrink-0" /> 
            {!isCollapsed && <span className="whitespace-nowrap">Random Mix</span>}
        </button>
      </nav>

      {/* 3. Collapse Toggle Button (Floating on Border) */}
      <button 
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1.5 text-gray-500 hover:text-indigo-600 shadow-sm transition-transform hover:scale-110"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* 4. Bottom Actions (Logout) */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <button 
            onClick={handleLogout} 
            className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/10 dark:hover:text-red-400 transition-colors font-medium ${isCollapsed ? 'justify-center px-2' : ''}`}
            title="Logout"
        >
            <LogOut size={20} className="shrink-0" />
            {!isCollapsed && <span className="whitespace-nowrap">Logout</span>}
        </button>
      </div>

    </aside>
  );
}

export default Sidebar;
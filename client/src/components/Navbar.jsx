import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, User, LogOut, BookOpen } from 'lucide-react';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const isActive = (path) => location.pathname === path;
  
  const linkClass = (path) => 
    `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
      isActive(path) 
        ? 'bg-indigo-50 text-indigo-700 font-medium dark:bg-indigo-900/50 dark:text-indigo-300' 
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white' 
    }`;

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 dark:bg-gray-900 dark:border-gray-700 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-gray-800 hover:opacity-80 transition dark:text-white">
          <div className="bg-indigo-600 text-white p-1.5 rounded-lg shadow-sm">
            <BookOpen size={20} />
          </div>
          <span>Memory-Forged</span>
        </Link>

        {/* Links */}
        <div className="hidden md:flex items-center gap-2">
          <Link to="/dashboard" className={linkClass('/dashboard')}>
            <LayoutDashboard size={18} /> Dashboard
          </Link>
          <Link to="/add-card" className={linkClass('/add-card')}>
            <PlusCircle size={18} /> Add Card
          </Link>
          <Link to="/profile" className={linkClass('/profile')}>
             <User size={18} /> Profile & Settings
          </Link>
        </div>

        {/* Logout */}
        <div className="flex items-center gap-4">
            <div className="h-6 w-px bg-gray-200 hidden md:block dark:bg-gray-700"></div>
            <button 
                onClick={handleLogout} 
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition dark:text-gray-400 dark:hover:text-red-400"
            >
                <LogOut size={16} />
                <span className="hidden md:inline">Logout</span>
            </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
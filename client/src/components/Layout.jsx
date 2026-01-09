import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, User, LogOut } from 'lucide-react'; 
import Sidebar from './Sidebar';

function Layout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Define Mobile Nav Items
  const navItems = [
    { icon: LayoutDashboard, label: 'Home', path: '/dashboard' },
    { icon: BookOpen, label: 'Study', path: '/study' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 font-sans text-gray-900 dark:text-white transition-colors duration-300">
      
      {/* 1. DESKTOP SIDEBAR (Hidden on Mobile) */}
      <div className="hidden md:block">
        <Sidebar isCollapsed={isCollapsed} toggleSidebar={() => setIsCollapsed(!isCollapsed)} />
      </div>

      {/* 2. MAIN CONTENT AREA */}
      {/* - Desktop: Uses your existing ml-20 / ml-64 logic
          - Mobile: Sets ml-0 (no sidebar margin) and mb-20 (space for bottom bar)
      */}
      <main 
        className={`flex-1 p-4 md:p-8 overflow-y-auto min-h-screen transition-all duration-300 ease-in-out 
          ${isCollapsed ? 'md:ml-20' : 'md:ml-64'} 
          ml-0 mb-20 md:mb-0
        `}
      >
        <Outlet />
      </main>

      {/* 3. MOBILE BOTTOM NAVIGATION (Hidden on Desktop) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50 px-6 py-2 flex justify-between items-center shadow-[0_-4px_10px_rgba(0,0,0,0.05)] pb-safe">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
              isActive(item.path) 
                ? 'text-indigo-600 dark:text-indigo-400' 
                : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <item.icon size={24} strokeWidth={isActive(item.path) ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
        
        {/* Mobile Logout Button (Optional, or put inside Profile) */}
        <button
           onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}
           className="flex flex-col items-center gap-1 p-2 text-red-400"
        >
           <LogOut size={24} />
           <span className="text-[10px] font-medium">Logout</span>
        </button>
      </nav>

    </div>
  );
}

export default Layout;
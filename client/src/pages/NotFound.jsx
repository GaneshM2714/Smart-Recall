import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Home } from 'lucide-react';

function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4 transition-colors">
      
      <div className="text-center max-w-md">
        {/* Icon Animation */}
        <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full mb-6 animate-bounce">
          <AlertCircle size={48} className="text-red-500 dark:text-red-400" />
        </div>

        {/* Text */}
        <h1 className="text-6xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
          404
        </h1>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          Ouch! Page not found.
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to="/dashboard" 
            className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition shadow-lg shadow-indigo-200 dark:shadow-none"
          >
            <Home size={20} /> Go to Dashboard
          </Link>
          
          <Link 
            to="/" 
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl font-medium transition"
          >
            <ArrowLeft size={20} /> Go Home
          </Link>
        </div>
      </div>
      
    </div>
  );
}

export default NotFound;
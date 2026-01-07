import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';
import Card from '../components/ui/Card';
import PasswordInput from '../components/PasswordInput'; // Import the new component
import toast from 'react-hot-toast';
import { Lock } from 'lucide-react';

function ResetPassword() {
  const { token } = useParams(); // Get token from URL
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false); // Added loading state

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (password !== confirmPassword) return toast.error("Passwords do not match");
    if (password.length < 8) return toast.error("Password must be at least 8 characters");

    setLoading(true);

    try {
      await API.post(`/auth/reset-password/${token}`, { password });
      toast.success('Password reset successfully!');
      
      // Delay redirect slightly so user sees the success message
      setTimeout(() => navigate('/login'), 1500);
      
    } catch (error) {
      toast.error(error.response?.data?.error || "Invalid or expired token");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors">
      <Card className="max-w-md w-full p-8 animate-scale-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-4">
            <Lock size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Set new password</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Must be at least 8 characters.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
            <PasswordInput 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              name="new-password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
            <PasswordInput 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              name="confirm-password"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-indigo-200 dark:shadow-none"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </Card>
    </div>
  );
}

export default ResetPassword;
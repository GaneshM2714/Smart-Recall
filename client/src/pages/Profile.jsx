import { useState, useEffect } from 'react';
import { User, Mail, Shield, AlertTriangle, Save, X, Trash2 } from 'lucide-react'; // Added Trash2
import { jwtDecode } from 'jwt-decode';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import API from '../api';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

function Profile() {
  const [user, setUser] = useState({ email: 'Loading...', id: '' });
  const [memberSince, setMemberSince] = useState('Recently');
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // --- Password State ---
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

  // --- NEW: Delete Modal State ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  // ... (Keep your existing useEffect for loading user data) ...
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser({ email: decoded.email, id: decoded.id });
        if (decoded.iat) {
            const date = new Date(decoded.iat * 1000);
            setMemberSince(date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }));
        }
      } catch (error) { console.error("Invalid token"); }
    }
  }, []);

  // ... (Keep your existing handleSavePassword function) ...
  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!passwords.current || !passwords.new) return toast.error("Please fill all fields");
    if (passwords.new !== passwords.confirm) return toast.error("New passwords don't match");
    if (passwords.new.length < 6) return toast.error("Password must be at least 6 chars");
  
    try {
      await API.post('/auth/change-password', {
        currentPassword: passwords.current,
        newPassword: passwords.new
      });
      toast.success("Password updated successfully!");
      setPasswords({ current: '', new: '', confirm: '' });
      setIsEditingPassword(false);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update password");
    }
  };

  // --- NEW: Handle Account Deletion ---
  const handleConfirmDelete = async () => {
    if (deleteInput !== 'DELETE') return; // Safety check

    try {
      await API.delete('/auth/delete-account');
      
      // Cleanup
      localStorage.removeItem('token');
      toast.success("Account deleted. Goodbye!");
      
      // Redirect
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete account");
      setIsDeleteModalOpen(false); // Close modal on error
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in relative"> 
      {/* ^ Added 'relative' just in case */}

      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Account Settings</h1>

      {/* ... (Your existing Profile Card & Password UI remains exactly the same) ... */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8 transition-colors">
         {/* ... (Same as before) ... */}
         {/* ... Include the Password Form here ... */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 border-b border-indigo-100 dark:border-indigo-800 flex items-center gap-4">
            <div className="bg-indigo-100 dark:bg-indigo-800 p-4 rounded-full text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700">
                <User size={32} />
            </div>
            <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">My Account</h2>
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-sm">
                    <span className="bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs px-2 py-0.5 rounded-full font-bold">PRO</span>
                    <span>Member since {memberSince}</span>
                </div>
            </div>
        </div>
        
        <div className="p-6 space-y-6">
            {/* Email Row */}
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <Mail size={18} />
                    <span>Email Address</span>
                </div>
                <span className="font-medium text-gray-800 dark:text-gray-200 font-mono bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded">
                    {user.email}
                </span>
            </div>

            {/* Password Logic & UI */}
            <div className="border-b border-gray-100 dark:border-gray-700 pb-4">
                <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                        <Shield size={18} />
                        <span>Password</span>
                    </div>
                    {!isEditingPassword && (
                        <button 
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium" 
                            onClick={() => setIsEditingPassword(true)}
                        >
                            Change Password
                        </button>
                    )}
                </div>

                {/* EXPANDABLE PASSWORD FORM */}
                {isEditingPassword && (
                    <form onSubmit={handleSavePassword} className="mt-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4 animate-fade-in-down">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Current Password</label>
                            <input 
                                type="password" 
                                className="w-full p-2 rounded border dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm"
                                placeholder="Enter current password"
                                value={passwords.current}
                                onChange={e => setPasswords({...passwords, current: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">New Password</label>
                                <input 
                                    type="password" 
                                    className="w-full p-2 rounded border dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm"
                                    placeholder="Min 6 chars"
                                    value={passwords.new}
                                    onChange={e => setPasswords({...passwords, new: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirm</label>
                                <input 
                                    type="password" 
                                    className="w-full p-2 rounded border dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm"
                                    placeholder="Repeat new password"
                                    value={passwords.confirm}
                                    onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button 
                                type="button"
                                onClick={() => {
                                    setIsEditingPassword(false);
                                    setPasswords({ current: '', new: '', confirm: '' });
                                }}
                                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 rounded transition"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                className="px-3 py-1.5 text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded transition flex items-center gap-2"
                            >
                                <Save size={14} /> Update Password
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* ID Row */}
            <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3 text-gray-400">
                    <User size={18} />
                    <span className="text-sm">User ID</span>
                </div>
                <span className="text-xs text-gray-400 font-mono">{user.id || '...'}</span>
            </div>
        </div>
      </div>

      {/* Preferences Section (Same as before) */}
      <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">App Preferences</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8 transition-colors">
          <div className="flex items-center justify-between">
              <div>
                  <h3 className="font-medium text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                    Dark Mode
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{theme === 'dark' ? 'Easy on the eyes' : 'Bright and clear'}</p>
              </div>
              <button 
                onClick={toggleTheme}
                className={`${theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
              >
                  <span className={`${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
              </button>
          </div>
      </div>

      {/* 3. Danger Zone (Trigger) */}
      <div className="border border-red-200 dark:border-red-800 rounded-xl bg-red-50 dark:bg-red-900/10 p-6 transition-colors">
          <h3 className="text-red-800 dark:text-red-400 font-bold flex items-center gap-2 mb-2">
              <AlertTriangle size={18} /> Danger Zone
          </h3>
          <p className="text-red-600 dark:text-red-300 text-sm mb-4">
            Once you delete your account, there is no going back. All your cards and progress will be lost.
          </p>
          <button 
            onClick={() => {
              setDeleteInput(''); // Reset input
              setIsDeleteModalOpen(true); // Open the Custom Modal
            }}
            className="bg-white dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-300 px-4 py-2 rounded text-sm font-medium hover:bg-red-600 hover:text-white transition"
          >
              Delete Account
          </button>
      </div>

      {/* --- 4. CUSTOM DELETE MODAL --- */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-red-100 dark:border-red-900 animate-scale-in">
            
            {/* Header */}
            <div className="bg-red-50 dark:bg-red-900/30 p-6 flex items-start gap-4">
              <div className="bg-red-100 dark:bg-red-800 p-3 rounded-full shrink-0">
                <AlertTriangle className="text-red-600 dark:text-red-300" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-red-900 dark:text-red-100">Delete Account?</h3>
                <p className="text-red-700 dark:text-red-300 text-sm mt-1">
                  This action is permanent. All your flashcards, subjects, and study history will be wiped immediately.
                </p>
              </div>
            </div>

            {/* Input Section */}
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                To confirm, type <span className="font-mono font-bold select-all">DELETE</span> below:
              </label>
              <input 
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="DELETE"
                className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-mono"
              />
            </div>

            {/* Footer Actions */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-medium transition"
              >
                Cancel
              </button>
              
              <button 
                onClick={handleConfirmDelete}
                disabled={deleteInput !== 'DELETE'}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-white transition-all ${
                  deleteInput === 'DELETE' 
                    ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-none' 
                    : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed opacity-50'
                }`}
              >
                <Trash2 size={18} />
                Confirm Deletion
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default Profile;
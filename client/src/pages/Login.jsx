import { useState } from 'react';
import API from "../api";
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BookOpen } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google'; // <--- 1. Import Google Component
import Card from '../components/ui/Card';
import PasswordInput from '../components/PasswordInput';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // --- STANDARD LOGIN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed');
    }
  };

  // --- GOOGLE LOGIN HANDLER ---
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      // Send the token received from Google to your backend
      const { data } = await API.post('/auth/google', {
        token: credentialResponse.credential
      });

      // Same success logic as standard login
      localStorage.setItem('token', data.token);
      toast.success('Google Login Successful! 🎉');
      navigate('/dashboard');

    } catch (error) {
      console.error("Google Backend Error", error);
      toast.error(error.response?.data?.error || "Google Login Failed");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-xl shadow-lg mb-4">
          <BookOpen size={32} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Sign in to continue your learning journey</p>
      </div>

      <Card className="w-full max-w-md p-8">
        {/* Standard Form */}
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
            <input
              className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <PasswordInput 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choose a strong password"
            />
          </div>

          <div className="flex justify-end mb-6">
            <Link to="/forgot-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition active:scale-[0.98]"
          >
            Sign In
          </button>
        </form>

        {/* --- DIVIDER --- */}
        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
          <span className="mx-4 text-gray-400 text-sm font-medium">OR</span>
          <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
        </div>

        {/* --- GOOGLE BUTTON --- */}
        <div className="flex justify-center w-full">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              console.log('Login Failed');
              toast.error("Google Login Failed");
            }}
            useOneTap
            shape="rectangular"
            theme="filled_blue" // Options: 'outline' | 'filled_blue' | 'filled_black'
            width="100%" // Tries to match container width
          />
        </div>

        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-600 hover:text-indigo-500 font-medium">
            Create account
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default Login;
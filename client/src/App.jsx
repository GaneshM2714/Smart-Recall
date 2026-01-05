import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { lazy, Suspense } from 'react';

// Core Imports (Keep these fast/standard)
import Layout from './components/Layout';
import Login from './pages/Login';
import Landing from './pages/Landing';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { ThemeProvider } from './context/ThemeContext';

// Lazy Load Heavy Pages (Dashboard, Charts, Study Mode)
// This splits the code so the user doesn't download everything at once.
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Study = lazy(() => import('./pages/Study'));
const SubjectView = lazy(() => import('./pages/SubjectView'));
const AddCard = lazy(() => import('./pages/AddCard'));
const Profile = lazy(() => import('./pages/Profile'));

// Helper: Only allow access if logged in
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

// Simple Loading Spinner Component
const LoadingFallback = () => (
  <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" reverseOrder={false} />
      <ThemeProvider>

        {/* Suspense catches the "loading" state of Lazy components */}
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* PUBLIC ROUTES */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* DASHBOARD LAYOUT ROUTES (Sidebar + Header) */}
            <Route element={<Layout />}>
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } />

              <Route path="/add-card" element={
                <PrivateRoute>
                  <AddCard />
                </PrivateRoute>
              } />

              <Route path="/profile" element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              } />

              <Route path="/subject/:id" element={
                <PrivateRoute>
                  <SubjectView />
                </PrivateRoute>
              } />
            </Route>

            {/* FULL SCREEN ROUTES (No Sidebar) */}
            <Route path="/study" element={
              <PrivateRoute>
                <Study />
              </PrivateRoute>
            } />

            {/* 404 CATCH-ALL */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>

      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
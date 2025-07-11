import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { useAuthStore } from './stores/authStore';

// Layout Components
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import SubmitWork from './pages/student/SubmitWork';
import Submissions from './pages/student/Submissions';
import Feedback from './pages/student/Feedback';

// Teacher Pages
import TeacherDashboard from './pages/teacher/Dashboard';
import ReviewSubmissions from './pages/teacher/ReviewSubmissions';
import Statistics from './pages/teacher/Statistics';

// Parent Pages
import ParentDashboard from './pages/parent/Dashboard';
import ChildProgress from './pages/parent/ChildProgress';
import WeeklySummary from './pages/parent/WeeklySummary';

// Initialize React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Student Routes */}
          <Route element={
            <ProtectedRoute allowedRoles={['student']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student/submit" element={<SubmitWork />} />
            <Route path="/student/submissions" element={<Submissions />} />
            <Route path="/student/feedback/:id" element={<Feedback />} />
          </Route>

          {/* Teacher Routes */}
          <Route element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/teacher/review" element={<ReviewSubmissions />} />
            <Route path="/teacher/statistics" element={<Statistics />} />
          </Route>

          {/* Parent Routes */}
          <Route element={
            <ProtectedRoute allowedRoles={['parent']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route path="/parent" element={<ParentDashboard />} />
            <Route path="/parent/progress" element={<ChildProgress />} />
            <Route path="/parent/summary" element={<WeeklySummary />} />
          </Route>

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* 404 Route */}
          <Route path="*" element={
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-900">404</h1>
                <p className="mt-4 text-xl text-gray-600">Page not found</p>
                <button
                  onClick={() => window.history.back()}
                  className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Go Back
                </button>
              </div>
            </div>
          } />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
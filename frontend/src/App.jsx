/**
 * Main App Component with Complete Routing
 */
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoadingScreen } from './components/common';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Teacher Pages
import TeacherDashboard from './pages/teacher/Dashboard';
import Feed from './pages/teacher/Feed';
import MyApplications from './pages/teacher/MyApplications';
import SavedJobs from './pages/teacher/SavedJobs';
import TeacherProfileEdit from './pages/teacher/Profile';
import TeacherProfileView from './pages/teacher/ProfileView';

// Institution Pages
import InstitutionDashboard from './pages/institution/Dashboard';
import InstitutionProfileEdit from './pages/institution/Profile';
import InstitutionProfileView from './pages/institution/ProfileView';
import MyJobs from './pages/institution/MyJobs';
import Applicants from './pages/institution/Applicants';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminJobs from './pages/admin/Jobs';
import AdminInstitutions from './pages/admin/Institutions';
import AdminContent from './pages/admin/Content';

// Shared Pages
import JobBoard from './pages/jobs/JobBoard';
import JobDetail from './pages/jobs/JobDetail';
import Events from './pages/events/Events';
import InstitutionPage from './pages/InstitutionPage';

// Protected Route Component
function ProtectedRoute({ children, allowedTypes = [] }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(user.user_type)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Dashboard Router - Redirects based on user type
function DashboardRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (user?.user_type === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  if (user?.user_type === 'TEACHER') {
    return <TeacherDashboard />;
  }

  if (user?.user_type === 'INSTITUTION') {
    return <InstitutionDashboard />;
  }

  return <Navigate to="/login" replace />;
}

// Profile Router - Shows appropriate profile view
function ProfileRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (user?.user_type === 'TEACHER') {
    return <TeacherProfileView />;
  }

  if (user?.user_type === 'INSTITUTION') {
    return <InstitutionProfileView />;
  }

  return <Navigate to="/dashboard" replace />;
}

// Profile Edit Router - Shows appropriate profile editor
function ProfileEditRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (user?.user_type === 'TEACHER') {
    return <TeacherProfileEdit />;
  }

  if (user?.user_type === 'INSTITUTION') {
    return <InstitutionProfileEdit />;
  }

  return <Navigate to="/dashboard" replace />;
}

// Main App Routes
function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />}
      />

      {/* Protected Routes - All Users */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardRouter />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfileRouter />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile/edit"
        element={
          <ProtectedRoute>
            <ProfileEditRouter />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teachers/:id"
        element={
          <ProtectedRoute>
            <TeacherProfileView />
          </ProtectedRoute>
        }
      />

      <Route
        path="/institutions/:id"
        element={
          <ProtectedRoute>
            <InstitutionProfileView />
          </ProtectedRoute>
        }
      />

      <Route
        path="/jobs"
        element={
          <ProtectedRoute>
            <JobBoard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/jobs/:id"
        element={
          <ProtectedRoute>
            <JobDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/events"
        element={
          <ProtectedRoute>
            <Events />
          </ProtectedRoute>
        }
      />

      {/* Institution Public Pages */}
      <Route
        path="/institution/:slug"
        element={
          <ProtectedRoute>
            <InstitutionPage />
          </ProtectedRoute>
        }
      />

      {/* Teacher-Only Routes */}
      <Route
        path="/feed"
        element={
          <ProtectedRoute allowedTypes={['TEACHER']}>
            <Feed />
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-applications"
        element={
          <ProtectedRoute allowedTypes={['TEACHER']}>
            <MyApplications />
          </ProtectedRoute>
        }
      />

      <Route
        path="/saved-jobs"
        element={
          <ProtectedRoute allowedTypes={['TEACHER']}>
            <SavedJobs />
          </ProtectedRoute>
        }
      />

      {/* Institution-Only Routes */}
      <Route
        path="/my-jobs"
        element={
          <ProtectedRoute allowedTypes={['INSTITUTION']}>
            <MyJobs />
          </ProtectedRoute>
        }
      />

      <Route
        path="/applicants/:jobId"
        element={
          <ProtectedRoute allowedTypes={['INSTITUTION']}>
            <Applicants />
          </ProtectedRoute>
        }
      />

      {/* Admin-Only Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedTypes={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedTypes={['ADMIN']}>
            <AdminUsers />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/jobs"
        element={
          <ProtectedRoute allowedTypes={['ADMIN']}>
            <AdminJobs />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/institutions"
        element={
          <ProtectedRoute allowedTypes={['ADMIN']}>
            <AdminInstitutions />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/content"
        element={
          <ProtectedRoute allowedTypes={['ADMIN']}>
            <AdminContent />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// Main App
function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;

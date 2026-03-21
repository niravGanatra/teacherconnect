/**
 * Main App Component with Complete Routing
 */
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, ROLES } from './context/AuthContext';
import { ErrorBoundary } from './components/common';
import FullPageLoader from './components/ui/FullPageLoader';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import CheckEmail from './pages/auth/CheckEmail';
import VerifyEmail from './pages/auth/VerifyEmail';
import AuthCallback from './pages/auth/AuthCallback';
import EducatorOnboarding from './pages/onboarding/EducatorOnboarding';
import InstitutionOnboarding from './pages/onboarding/InstitutionOnboarding';

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
import InstitutionFaculty from './pages/institution/Faculty';
import InstitutionCertificates from './pages/institution/Certificates';
import InstitutionEnrollments from './pages/institution/Enrollments';
import InstitutionSetup from './pages/institution/Setup';
import MyJobs from './pages/institution/MyJobs';
import Applicants from './pages/institution/Applicants';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminJobs from './pages/admin/Jobs';
import AdminInstitutions from './pages/admin/Institutions';
import AdminContent from './pages/admin/Content';
import FDPManagement from './pages/admin/FDPManagement';
import AdminCertificates from './pages/admin/Certificates';
import ActivityReport from './pages/admin/ActivityReport';
import PlatformSettings from './pages/admin/PlatformSettings';

// Shared Pages
import JobBoard from './pages/jobs/JobBoard';
import JobDetail from './pages/jobs/JobDetail';
import JobAlerts from './pages/jobs/JobAlerts';
import FDPMarketplace from './pages/courses/FDPMarketplace';
import FDPDetail from './pages/courses/FDPDetail';
import FDPBulkPurchase from './pages/courses/FDPBulkPurchase';
import RedeemCode from './pages/courses/RedeemCode';
import MyLearning from './pages/courses/MyLearning';
import SavedItemsPage from './pages/courses/SavedItemsPage';
import Events from './pages/events/Events';
import InstitutionPage from './pages/InstitutionPage';
import JobsLayout from './components/jobs/JobsLayout';

import SearchResults from './pages/search/SearchResults';
import NotificationsPage from './pages/notifications/NotificationsPage';
import HomePage from './pages/social/HomePage';
import PrivacySettings from './pages/settings/PrivacySettings';

// Protected Route Component
function ProtectedRoute({ children, allowedTypes = [] }) {
  const { user, loading, isAuthenticated, hasAnyRole } = useAuth();

  if (loading) {
    return <FullPageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Use hasAnyRole which checks derived lowercase roles — avoids EDUCATOR vs educator mismatch
  if (allowedTypes.length > 0 && !hasAnyRole(allowedTypes)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Dashboard Router - Redirects based on user type
function DashboardRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullPageLoader />;
  }

  if (user?.user_type === 'ADMIN' || user?.user_type === 'SUPER_ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  if (user?.user_type === 'EDUCATOR' || user?.user_type === 'TEACHER') {
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
    return <FullPageLoader />;
  }

  if (user?.user_type === 'EDUCATOR' || user?.user_type === 'TEACHER') {
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
    return <FullPageLoader />;
  }

  if (user?.user_type === 'EDUCATOR' || user?.user_type === 'TEACHER') {
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
    return <FullPageLoader />;
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
      <Route
        path="/register/educator"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <EducatorOnboarding />}
      />
      <Route
        path="/register/institution"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <InstitutionOnboarding />}
      />
      {/* Email verification routes — always public */}
      <Route path="/check-email" element={<CheckEmail />} />
      <Route path="/verify-email/:token" element={<VerifyEmail />} />
      {/* Google OAuth callback — always public */}
      <Route path="/auth/callback" element={<AuthCallback />} />

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
        path="/search/results"
        element={
          <ProtectedRoute>
            <SearchResults />
          </ProtectedRoute>
        }
      />

      <Route
        path="/learning"
        element={
          <ProtectedRoute>
            <MyLearning />
          </ProtectedRoute>
        }
      />

      <Route
        path="/fdp"
        element={
          <ProtectedRoute allowedTypes={[ROLES.EDUCATOR, ROLES.INSTITUTION_ADMIN, ROLES.INSTRUCTOR, ROLES.SUPER_ADMIN]}>
            <FDPMarketplace />
          </ProtectedRoute>
        }
      />

      {/* FDP detail — must be before /fdp/:id/bulk */}
      <Route
        path="/fdp/:id"
        element={
          <ProtectedRoute allowedTypes={[ROLES.EDUCATOR, ROLES.INSTITUTION_ADMIN, ROLES.INSTRUCTOR, ROLES.SUPER_ADMIN]}>
            <FDPDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/fdp/:id/bulk"
        element={
          <ProtectedRoute allowedTypes={[ROLES.INSTITUTION_ADMIN, ROLES.SUPER_ADMIN]}>
            <FDPBulkPurchase />
          </ProtectedRoute>
        }
      />

      {/* Saved / Bookmarked FDPs */}
      <Route
        path="/saved"
        element={
          <ProtectedRoute>
            <SavedItemsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/redeem"
        element={
          <ProtectedRoute allowedTypes={[ROLES.EDUCATOR]}>
            <RedeemCode />
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
            <ErrorBoundary>
              <ProfileEditRouter />
            </ErrorBoundary>
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

      {/* Jobs Hub - Nested Routes */}
      <Route
        path="/jobs"
        element={
          <ProtectedRoute>
            <JobsLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="discover" replace />} />
        <Route path="discover" element={<JobBoard />} />
        <Route path="applications" element={<MyApplications />} />
        <Route path="saved" element={<SavedJobs />} />
        <Route path="alerts" element={<JobAlerts />} />
        <Route path=":id" element={<JobDetail />} />
      </Route>

      <Route
        path="/events"
        element={
          <ProtectedRoute>
            <Events />
          </ProtectedRoute>
        }
      />


      {/* Institution Admin-Only Routes (must be BEFORE /institution/:slug) */}
      <Route
        path="/institution/setup"
        element={
          <ProtectedRoute allowedTypes={[ROLES.INSTITUTION_ADMIN]}>
            <InstitutionSetup />
          </ProtectedRoute>
        }
      />
      <Route
        path="/institution/faculty"
        element={
          <ProtectedRoute allowedTypes={[ROLES.INSTITUTION_ADMIN]}>
            <InstitutionFaculty />
          </ProtectedRoute>
        }
      />
      <Route
        path="/institution/certificates"
        element={
          <ProtectedRoute allowedTypes={[ROLES.INSTITUTION_ADMIN]}>
            <InstitutionCertificates />
          </ProtectedRoute>
        }
      />
      <Route
        path="/institution/enrollments"
        element={
          <ProtectedRoute allowedTypes={[ROLES.INSTITUTION_ADMIN]}>
            <InstitutionEnrollments />
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
          <ProtectedRoute allowedTypes={[ROLES.EDUCATOR]}>
            <Feed />
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-applications"
        element={
          <ProtectedRoute allowedTypes={[ROLES.EDUCATOR]}>
            <MyApplications />
          </ProtectedRoute>
        }
      />

      <Route
        path="/saved-jobs"
        element={
          <ProtectedRoute allowedTypes={[ROLES.EDUCATOR]}>
            <SavedJobs />
          </ProtectedRoute>
        }
      />

      {/* Institution-Only Routes */}
      <Route
        path="/my-jobs"
        element={
          <ProtectedRoute allowedTypes={[ROLES.INSTITUTION_ADMIN]}>
            <MyJobs />
          </ProtectedRoute>
        }
      />

      <Route
        path="/applicants/:jobId"
        element={
          <ProtectedRoute allowedTypes={[ROLES.INSTITUTION_ADMIN]}>
            <Applicants />
          </ProtectedRoute>
        }
      />

      {/* Institution aliases for sidebar links */}
      <Route
        path="/institution/dashboard"
        element={
          <ProtectedRoute allowedTypes={[ROLES.INSTITUTION_ADMIN]}>
            <InstitutionDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/institution/manage"
        element={
          <ProtectedRoute allowedTypes={[ROLES.INSTITUTION_ADMIN]}>
            <InstitutionProfileEdit />
          </ProtectedRoute>
        }
      />
      <Route
        path="/applicants"
        element={
          <ProtectedRoute allowedTypes={[ROLES.INSTITUTION_ADMIN]}>
            <Navigate to="/my-jobs" replace />
          </ProtectedRoute>
        }
      />

      {/* Admin-Only Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedTypes={[ROLES.ADMIN]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedTypes={[ROLES.ADMIN]}>
            <AdminUsers />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/jobs"
        element={
          <ProtectedRoute allowedTypes={[ROLES.ADMIN]}>
            <AdminJobs />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/institutions"
        element={
          <ProtectedRoute allowedTypes={[ROLES.ADMIN]}>
            <AdminInstitutions />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/content"
        element={
          <ProtectedRoute allowedTypes={[ROLES.ADMIN]}>
            <AdminContent />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/fdps"
        element={
          <ProtectedRoute allowedTypes={[ROLES.ADMIN]}>
            <FDPManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/certificates"
        element={
          <ProtectedRoute allowedTypes={[ROLES.ADMIN]}>
            <AdminCertificates />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute allowedTypes={[ROLES.ADMIN]}>
            <ActivityReport />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute allowedTypes={[ROLES.ADMIN]}>
            <PlatformSettings />
          </ProtectedRoute>
        }
      />

      {/* Notifications */}
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />

      {/* Settings */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <PrivacySettings />
          </ProtectedRoute>
        }
      />

      {/* Activity Feed */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomePage />
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

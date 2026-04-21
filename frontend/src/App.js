import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

/* Auth pages */
import MainPortal from './pages/common/MainPortal';
import LandingPage from './pages/common/LandingPage';
import ScoutLogin from './pages/auth/ScoutLogin';
import LeaderLogin from './pages/auth/LeaderLogin';
import ExaminerLogin from './pages/auth/ExaminerLogin';
import AdminLogin from './pages/auth/AdminLogin';
import PasswordRecovery from './pages/auth/PasswordRecovery';
import ScoutRegistration from './pages/auth/ScoutRegistration';
import RegistrationSuccess from './pages/common/RegistrationSuccess';

/* Dashboards */
import ScoutDashboard from './pages/dashboards/ScoutDashboard';
import LeaderDashboard from './pages/dashboards/LeaderDashboard';
import ExaminerDashboard from './pages/dashboards/ExaminerDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';

/* Admin pages */
import UserManagement from './pages/admin/UserManagement';
import GroupManagement from './pages/admin/GroupManagement';
import SystemLogs from './pages/admin/SystemLogs';
import EligibilityChecker from './pages/admin/EligibilityChecker';
import GroupRoster from './pages/admin/GroupRoster';

/* Scout pages */
import ActivityRegistration from './pages/scout/ActivityRegistration';
import ActivityTracking from './pages/scout/ActivityTracking';
import BadgeProgress from './pages/scout/BadgeProgress';
import AwardEligibility from './pages/scout/AwardEligibility';
import ScoutProfile from './pages/scout/ScoutProfile';

/* Common */
import CelebrationPage from './pages/common/CelebrationPage';
import VerificationPage from './pages/public/VerificationPage';

import { Toaster } from 'sonner';

/* 🔐 Simple route guard */
const RequireAuth = ({ role, children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token || !user) {
    return <Navigate to="/portal" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/portal" replace />;
  }

  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Toaster richColors position="top-right" duration={5000} closeButton />

      <Routes>

        {/* ===================== */}
        {/* Public / Entry */}
        {/* ===================== */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/portal" element={<MainPortal />} />

        {/* ===================== */}
        {/* Authentication */}
        {/* ===================== */}
        <Route path="/scout-login" element={<ScoutLogin />} />
        <Route path="/leader-login" element={<LeaderLogin />} />
        <Route path="/examiner-login" element={<ExaminerLogin />} />
        <Route path="/admin-login" element={<AdminLogin />} />

        <Route path="/password-recovery" element={<PasswordRecovery />} />
        <Route path="/scout-registration" element={<ScoutRegistration />} />
        <Route path="/registration-success" element={<RegistrationSuccess />} />

        {/* 🌐 Verification (Public) */}
        <Route path="/verify/:type/:uuid" element={<VerificationPage />} />

        {/* ===================== */}
        {/* Dashboards (PROTECTED) */}
        {/* ===================== */}
        <Route
          path="/scout/dashboard"
          element={
            <RequireAuth role="scout">
              <ScoutDashboard />
            </RequireAuth>
          }
        />

        <Route
          path="/leader/dashboard"
          element={
            <RequireAuth role="leader">
              <LeaderDashboard />
            </RequireAuth>
          }
        />

        <Route
          path="/examiner/dashboard"
          element={
            <RequireAuth role="examiner">
              <ExaminerDashboard />
            </RequireAuth>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <RequireAuth role="admin">
              <AdminDashboard />
            </RequireAuth>
          }
        />

        <Route
          path="/admin/users"
          element={
            <RequireAuth role="admin">
              <UserManagement />
            </RequireAuth>
          }
        />

        <Route
          path="/admin/groups"
          element={
            <RequireAuth role="admin">
              <GroupManagement />
            </RequireAuth>
          }
        />

        <Route
          path="/admin/groups/:id/roster"
          element={
            <RequireAuth role="admin">
              <GroupRoster />
            </RequireAuth>
          }
        />

        <Route
          path="/admin/eligibility"
          element={
            <RequireAuth role="admin">
              <EligibilityChecker />
            </RequireAuth>
          }
        />

        <Route
          path="/admin/logs"
          element={
            <RequireAuth role="admin">
              <SystemLogs />
            </RequireAuth>
          }
        />

        {/* ===================== */}
        {/* Scout Features */}
        {/* ===================== */}
        <Route
          path="/scout/activity-registration"
          element={
            <RequireAuth role="scout">
              <ActivityRegistration />
            </RequireAuth>
          }
        />

        <Route
          path="/scout/activity-tracking"
          element={
            <RequireAuth role="scout">
              <ActivityTracking />
            </RequireAuth>
          }
        />

        <Route
          path="/scout/badge-progress"
          element={
            <RequireAuth role="scout">
              <BadgeProgress />
            </RequireAuth>
          }
        />

        <Route
          path="/scout/award-eligibility"
          element={
            <RequireAuth role="scout">
              <AwardEligibility />
            </RequireAuth>
          }
        />

        <Route
          path="/scout/profile"
          element={
            <RequireAuth>
              <ScoutProfile />
            </RequireAuth>
          }
        />

        <Route
          path="/scout/profile/:id"
          element={
            <RequireAuth>
              <ScoutProfile />
            </RequireAuth>
          }
        />

        {/* ===================== */}
        {/* Common */}
        {/* ===================== */}
        <Route path="/celebration" element={<CelebrationPage />} />

        {/* ===================== */}
        {/* Fallback */}
        {/* ===================== */}
        <Route path="*" element={<Navigate to="/portal" replace />} />

      </Routes>
    </BrowserRouter>
  );
}


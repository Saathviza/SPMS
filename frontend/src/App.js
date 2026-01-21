import { BrowserRouter, Routes, Route } from 'react-router-dom';

/* Auth pages */
import MainPortal from './pages/common/MainPortal';
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

/* Scout pages */
import ActivityRegistration from './pages/scout/ActivityRegistration';
import ActivityTracking from './pages/scout/ActivityTracking';
import BadgeProgress from './pages/scout/BadgeProgress';
import AwardEligibility from './pages/scout/AwardEligibility';
import ScoutProfile from './pages/scout/ScoutProfile';
import CelebrationPage from './pages/common/CelebrationPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Main entry */}
        <Route path="/" element={<MainPortal />} />

        {/* Auth */}
        <Route path="/scout-login" element={<ScoutLogin />} />
        <Route path="/leader-login" element={<LeaderLogin />} />
        <Route path="/examiner-login" element={<ExaminerLogin />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/password-recovery" element={<PasswordRecovery />} />
        <Route path="/scout-registration" element={<ScoutRegistration />} />
        <Route path="/registration-success" element={<RegistrationSuccess />} />

        {/* Dashboards */}
        <Route path="/scout/dashboard" element={<ScoutDashboard />} />
        <Route path="/leader/dashboard" element={<LeaderDashboard />} />
        <Route path="/examiner/dashboard" element={<ExaminerDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* Scout features */}
        <Route path="/scout/activity-registration" element={<ActivityRegistration />} />
        <Route path="/scout/activity-tracking" element={<ActivityTracking />} />
        <Route path="/scout/badge-progress" element={<BadgeProgress />} />
        <Route path="/scout/award-eligibility" element={<AwardEligibility />} />
        <Route path="/scout/profile" element={<ScoutProfile />} />

        {/* Common */}
        <Route path="/celebration" element={<CelebrationPage />} />

      </Routes>
    </BrowserRouter>
  );
}


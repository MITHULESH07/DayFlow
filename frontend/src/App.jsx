import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Login, Signup } from './pages/auth/AuthPages.jsx';
import { ChangePassword } from './pages/auth/ChangePassword.jsx';
import { Dashboard, EmployeeDashboard } from './pages/dashboards/Dashboards.jsx';
import { Attendance } from './pages/attendance/Attendance.jsx';
import { TimeOff } from './pages/timeOff/TimeOff.jsx';
import { Profile } from './pages/profile/Profile.jsx';
import { readSession } from './services/api.js';

function RequireSession({ children }) {
  const location = useLocation();
  const session = readSession();
  if (!session?.token) return <Navigate to="/login" replace />;
  if (session.user?.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/change-password" element={<RequireSession><ChangePassword /></RequireSession>} />
      <Route path="/dashboard" element={<RequireSession><Dashboard /></RequireSession>} />
      <Route path="/employees/:employeeId" element={<RequireSession><Profile /></RequireSession>} />
      <Route path="/employee-dashboard" element={<RequireSession><EmployeeDashboard /></RequireSession>} />
      <Route path="/attendance" element={<RequireSession><Attendance /></RequireSession>} />
      <Route path="/time-off" element={<RequireSession><TimeOff /></RequireSession>} />
      <Route path="/profile" element={<RequireSession><Profile /></RequireSession>} />
      <Route path="/employee-profile" element={<RequireSession><Profile employee /></RequireSession>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

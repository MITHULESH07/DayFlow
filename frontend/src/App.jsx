import { Navigate, Route, Routes } from 'react-router-dom';
import { Login, Signup } from './pages/auth/AuthPages.jsx';
import { Dashboard, EmployeeDashboard } from './pages/dashboards/Dashboards.jsx';
import { Attendance } from './pages/attendance/Attendance.jsx';
import { TimeOff } from './pages/timeOff/TimeOff.jsx';
import { Profile } from './pages/profile/Profile.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/employees/:employeeId" element={<Profile />} />
      <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
      <Route path="/attendance" element={<Attendance />} />
      <Route path="/time-off" element={<TimeOff />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/employee-profile" element={<Profile employee />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

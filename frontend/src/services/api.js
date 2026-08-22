const API_BASE = import.meta.env.VITE_API_URL || '';
const AUTH_KEY = 'dayflow-auth';

export const readSession = () => {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY)) || null;
  } catch {
    return null;
  }
};

export const saveSession = (session) => localStorage.setItem(AUTH_KEY, JSON.stringify(session));
export const clearSession = () => localStorage.removeItem(AUTH_KEY);

export const apiRequest = async (path, options = {}) => {
  const session = readSession();
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
};

export const toInitials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'DF';

export const toUiEmployee = (employee, index = 0) => {
  const name = `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || employee.name || 'Dayflow user';
  const tones = ['peach', 'blue', 'lilac', 'mint', 'rose', 'sand', 'sky', 'lime'];
  return {
    id: employee.id,
    name,
    role: employee.job_title || employee.role || 'Employee',
    department: employee.department_name || employee.department || 'Team',
    initials: toInitials(name),
    status: employee.today_status || employee.status || 'absent',
    email: employee.email,
    tone: tones[index % tones.length],
    loginId: employee.employee_id || employee.employeeId,
    joiningDate: employee.joining_date,
    profilePicture: employee.profile_picture,
    raw: employee,
  };
};

export const toDisplayDate = (date) => {
  if (!date) return '-';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date));
};


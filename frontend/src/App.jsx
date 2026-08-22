import { useMemo, useState } from 'react';
import { Navigate, Route, Routes, Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, BadgeCheck, Building2, Check, Eye, EyeOff,
  CalendarDays, ChevronDown, Clock3, KeyRound, LockKeyhole, LogOut,
  BarChart3, ChevronLeft, ChevronRight, Mail, MapPin, Menu, Pencil, Phone, Plane,
  Plus, Search, ShieldCheck, Timer, Umbrella, UserRound, Users, WalletCards, X,
} from 'lucide-react';
import dayflowLogo from '../images/DayflowLogo.png';
import mockData from './data/mockData.json';

const Field = ({ label, icon: Icon, type = 'text', trailing, ...props }) => (
  <label className="field">
    <span>{label}</span>
    <div className="input-wrap">
      <Icon size={18} aria-hidden="true" />
      <input type={type} {...props} />
      {trailing}
    </div>
  </label>
);

function BrandPanel({ signup = false }) {
  return (
    <aside className="brand-panel">
      <div className="brand"><span className="brand-mark"><img src={dayflowLogo} alt="Dayflow logo" /></span>dayflow</div>
      <div className="brand-copy">
        <span className="eyebrow">{signup ? 'PEOPLE, NOT PAPERWORK' : 'YOUR WORKDAY, ALIGNED'}</span>
        <h1>{signup ? <>Grow the team.<br /><em>Keep it human.</em></> : <>A calmer way<br />to run <em>work.</em></>}</h1>
        <p>{signup ? 'Create your HR workspace, then bring your team together.' : 'One clean place for your people, attendance and time off.'}</p>
      </div>
      <div className="proof-card">
        <div className="avatar-stack"><span>AM</span><span>SK</span><span>JR</span><b>+24</b></div>
            <p><strong>{signup ? 'Made for HR teams' : 'Everyone in sync'}</strong><br />Simple, secure and ready for the day.</p>
      </div>
      <span className="orb orb-one" /><span className="orb orb-two" />
    </aside>
  );
}

function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const submit = (event) => {
    event.preventDefault();
    const user = mockData.demoUsers.find(item => item.identifier.toLowerCase() === identifier.trim().toLowerCase() && item.password === password);
    if (!user) {
      setLoginError('Use one of the demo accounts shown below.');
      return;
    }
    setLoginError('');
    setSubmitted(true);
    navigate(user.role === 'hr' ? '/dashboard' : '/employee-dashboard');
  };

  const useDemo = (role) => {
    const user = mockData.demoUsers.find(item => item.role === role);
    setIdentifier(user.identifier);
    setPassword(user.password);
    setLoginError('');
  };

  return (
    <main className="auth-shell">
      <BrandPanel />
      <section className="form-panel">
        <div className="form-container">
          <div className="mobile-brand"><span className="brand-mark"><img src={dayflowLogo} alt="Dayflow logo" /></span>dayflow</div>
          <div className="form-heading">
            <h2>Welcome back</h2>
            <p>HR and employees can sign in to their workspace here.</p>
          </div>
          <form onSubmit={submit}>
            <Field label="Login ID or email" icon={Mail} placeholder="e.g. DFAN20260001" autoComplete="username" value={identifier} onChange={event => setIdentifier(event.target.value)} required />
            <Field
              label="Password" icon={LockKeyhole} type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required
              trailing={<button className="icon-button" type="button" aria-label="Toggle password visibility" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>}
            />
            <div className="form-options">
              <label className="checkbox"><input type="checkbox" /><span><Check size={13} /></span>Keep me signed in</label>
              <a href="mailto:hr@dayflow.com">Forgot password?</a>
            </div>
            <button className="primary-button" type="submit">Sign in <ArrowRight size={18} /></button>
            {loginError && <div className="error-message">{loginError}</div>}
            {submitted && <div className="demo-message"><BadgeCheck size={18} /> Page is ready. Backend login will be connected next.</div>}
          </form>
          <div className="demo-accounts"><div><span>DEMO ACCESS</span><p>Choose a role to fill the login form.</p></div><button onClick={() => useDemo('hr')}><ShieldCheck size={15} /> HR account</button><button onClick={() => useDemo('employee')}><UserRound size={15} /> Employee</button></div>
          <div className="hr-entry">
            <span><ShieldCheck size={18} /></span>
            <p><strong>New HR administrator?</strong><br />Create your company’s HR workspace.</p>
            <Link to="/signup" aria-label="Create an HR account"><ArrowRight size={18} /></Link>
          </div>
          <p className="footer-copy">Protected by Dayflow security · Privacy</p>
        </div>
      </section>
    </main>
  );
}

const employees = mockData.employees;

const StatusMark = ({ status }) => (
  <span className={`status-mark ${status}`} title={status === 'leave' ? 'On leave' : status}>
    {status === 'leave' && <Plane size={11} />}
  </span>
);

function EmployeeDrawer({ employee, onClose }) {
  const navigate = useNavigate();
  if (!employee) return null;
  return (
    <div className="drawer-backdrop" onMouseDown={onClose}>
      <aside className="employee-drawer" onMouseDown={(event) => event.stopPropagation()}>
        <button className="drawer-close" onClick={onClose} aria-label="Close employee profile"><X size={20} /></button>
        <div className={`employee-avatar large ${employee.tone}`}>{employee.initials}</div>
        <span className="view-only-pill">View only</span>
        <h2>{employee.name}</h2>
        <p>{employee.role} · {employee.department}</p>
        <div className="drawer-details">
          <div><span>Work email</span><strong>{employee.email}</strong></div>
          <div><span>Attendance</span><strong className="status-copy"><StatusMark status={employee.status} />{employee.status === 'leave' ? 'On leave' : employee.status}</strong></div>
          <div><span>Employee ID</span><strong>DF{String(employee.id).padStart(4, '0')}</strong></div>
          <div><span>Joined</span><strong>12 Jan 2025</strong></div>
        </div>
        <button className="drawer-button" onClick={() => navigate(`/employees/${employee.id}`)}>Open full profile <ArrowRight size={17} /></button>
      </aside>
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [profileOpen, setProfileOpen] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [employeeCreated, setEmployeeCreated] = useState(false);

  const visibleEmployees = useMemo(() => employees.filter((employee) => {
    const matchesQuery = `${employee.name} ${employee.role} ${employee.department}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (filter === 'all' || employee.status === filter);
  }), [query, filter]);

  return (
    <main className="dashboard-shell">
      <header className="dashboard-nav">
        <div className="dashboard-brand"><span className="brand-mark"><img src={dayflowLogo} alt="Dayflow logo" /></span><span>dayflow</span></div>
        <nav className="desktop-nav" aria-label="Main navigation">
          <a className="active" href="#employees"><Users size={17} /> Employees</a>
          <button onClick={() => navigate('/attendance')}><Clock3 size={17} /> Attendance</button>
          <button onClick={() => navigate('/time-off')}><CalendarDays size={17} /> Time off</button>
        </nav>
        <div className="nav-actions">
          <button className={`check-button ${checkedIn ? 'checked' : ''}`} onClick={() => setCheckedIn(!checkedIn)}><span />{checkedIn ? 'Check out' : 'Check in'}</button>
          <div className="profile-control">
            <button className="profile-button" onClick={() => setProfileOpen(!profileOpen)} aria-expanded={profileOpen}><span>HR</span><span className="profile-name"><strong>Harini Rao</strong><small>HR Admin</small></span><ChevronDown size={16} /></button>
            {profileOpen && <div className="profile-menu"><button onClick={() => navigate('/profile')}><UserRound size={17} /> My profile</button><button onClick={() => navigate('/login')}><LogOut size={17} /> Log out</button></div>}
          </div>
          <button className="mobile-menu" aria-label="Open menu"><Menu size={21} /></button>
        </div>
      </header>

      <section className="dashboard-content" id="employees">
        <div className="dashboard-intro">
          <div><span className="dashboard-eyebrow">PEOPLE DIRECTORY</span><h1>Your team, at a glance.</h1><p>Find people, check today’s status and keep the workday moving.</p></div>
          <button className="add-employee" onClick={() => setAddOpen(true)}><Plus size={18} /> Add employee</button>
        </div>

        <div className="overview-grid">
          <article><span className="metric-icon"><Users size={19} /></span><div><strong>{employees.length}</strong><p>Total employees</p></div><small>+2 this month</small></article>
          <article><span className="metric-icon green"><Check size={19} /></span><div><strong>{employees.filter(e => e.status === 'present').length}</strong><p>Present today</p></div><small>75% of team</small></article>
          <article><span className="metric-icon amber"><Plane size={19} /></span><div><strong>{employees.filter(e => e.status === 'leave').length}</strong><p>On leave</p></div><small>2 requests</small></article>
        </div>

        <div className="directory-toolbar">
          <div className="search-box"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, role or team" /></div>
          <div className="filter-tabs">
            {['all', 'present', 'leave', 'absent'].map(item => <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item === 'all' ? 'Everyone' : item === 'leave' ? 'On leave' : item}</button>)}
          </div>
        </div>

        <div className="employee-grid">
          {visibleEmployees.map(employee => (
            <button className="employee-card" key={employee.id} onClick={() => setSelectedEmployee(employee)}>
              <StatusMark status={employee.status} />
              <div className={`employee-avatar ${employee.tone}`}>{employee.initials}</div>
              <div className="employee-copy"><h3>{employee.name}</h3><p>{employee.role}</p><span>{employee.department}</span></div>
              <span className="card-arrow"><ArrowRight size={17} /></span>
            </button>
          ))}
        </div>
        {!visibleEmployees.length && <div className="empty-directory"><Search size={23} /><h3>No employees found</h3><p>Try a different name or status filter.</p></div>}
      </section>
      <EmployeeDrawer employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />
      {addOpen && <div className="drawer-backdrop modal-center" onMouseDown={() => setAddOpen(false)}><form className="request-modal" onSubmit={event => { event.preventDefault(); setEmployeeCreated(true); }} onMouseDown={event => event.stopPropagation()}><button type="button" className="drawer-close" onClick={() => setAddOpen(false)}><X size={19} /></button><span className="dashboard-eyebrow">HR ONLY</span><h2>Add a new employee</h2><p>Create their profile and initial login credentials.</p><div className="field-grid"><Field label="Full name" icon={UserRound} placeholder="Employee name" required /><Field label="Work email" icon={Mail} type="email" placeholder="name@company.com" required /><Field label="Department" icon={Users} placeholder="e.g. Engineering" required /><Field label="Job title" icon={Building2} placeholder="e.g. Frontend Engineer" required /></div><Field label="Temporary password" icon={KeyRound} type="password" placeholder="Minimum 8 characters" minLength="8" required /><label className="checkbox consent"><input type="checkbox" required /><span><Check size={13} /></span>Require a password change on first login.</label><button className="primary-button" type="submit">Create employee <ArrowRight size={17} /></button>{employeeCreated && <div className="demo-message"><BadgeCheck size={17} /> Demo employee created. Backend persistence will be connected later.</div>}</form></div>}
    </main>
  );
}

const InfoItem = ({ label, value }) => <div className="info-item"><span>{label}</span><strong>{value}</strong></div>;

const attendanceRows = mockData.attendance;

function SimpleNav({ employee = false, active, navigate }) {
  const [profileOpen, setProfileOpen] = useState(false);
  return <header className="dashboard-nav"><button className="dashboard-brand brand-button" onClick={() => navigate(employee ? '/employee-dashboard' : '/dashboard')}><span className="brand-mark"><img src={dayflowLogo} alt="Dayflow logo" /></span><span>dayflow</span></button><nav className="desktop-nav">{!employee && <button className={active === 'employees' ? 'active' : ''} onClick={() => navigate('/dashboard')}><Users size={17} /> Employees</button>}<button className={active === 'attendance' ? 'active' : ''} onClick={() => navigate(employee ? '/attendance?view=employee' : '/attendance')}><Clock3 size={17} /> Attendance</button><button className={active === 'timeoff' ? 'active' : ''} onClick={() => navigate(employee ? '/time-off?view=employee' : '/time-off')}><CalendarDays size={17} /> Time off</button></nav><div className="nav-actions"><div className="profile-control"><button className="profile-button" onClick={() => setProfileOpen(!profileOpen)} aria-expanded={profileOpen}><span>{employee ? 'AR' : 'HR'}</span><span className="profile-name"><strong>{employee ? 'Ananya Rao' : 'Harini Rao'}</strong><small>{employee ? 'Employee' : 'HR Admin'}</small></span><ChevronDown size={16} /></button>{profileOpen && <div className="profile-menu"><button onClick={() => navigate(employee ? '/employee-profile' : '/profile')}><UserRound size={17} /> My profile</button><button onClick={() => navigate('/login')}><LogOut size={17} /> Log out</button></div>}</div></div></header>;
}

function EmployeeDashboard() {
  const navigate = useNavigate();
  const [checkedIn, setCheckedIn] = useState(false);
  return <main className="dashboard-shell employee-dashboard"><SimpleNav employee navigate={navigate} /><section className="dashboard-content"><div className="employee-welcome"><div><span className="dashboard-eyebrow">SATURDAY, 22 AUGUST</span><h1>Good morning, Ananya.</h1><p>Here’s everything you need for a smooth workday.</p></div><button className={`employee-check ${checkedIn ? 'checked' : ''}`} onClick={() => setCheckedIn(!checkedIn)}><span><Timer size={21} /></span><div><small>{checkedIn ? 'STARTED AT 09:04 AM' : 'READY FOR THE DAY?'}</small><strong>{checkedIn ? 'Check out' : 'Check in'}</strong></div><ArrowRight size={18} /></button></div><div className="employee-metrics"><article><span className="metric-icon green"><Clock3 size={20} /></span><div><small>THIS MONTH</small><strong>18 days</strong><p>Days present</p></div></article><article><span className="metric-icon"><Timer size={20} /></span><div><small>AVERAGE</small><strong>8h 12m</strong><p>Daily work hours</p></div></article><article><span className="metric-icon amber"><Umbrella size={20} /></span><div><small>AVAILABLE</small><strong>16 days</strong><p>Paid time off</p></div></article><article><span className="metric-icon blue"><BarChart3 size={20} /></span><div><small>THIS WEEK</small><strong>2h 04m</strong><p>Extra hours</p></div></article></div><div className="employee-dashboard-grid"><article className="employee-panel"><div className="panel-heading"><div><span>ATTENDANCE</span><h2>Recent activity</h2></div><button onClick={() => navigate('/attendance?view=employee')}>View all <ArrowRight size={15} /></button></div><div className="activity-list">{attendanceRows.slice(0, 4).map((row, index) => <div key={index}><span className={`activity-day ${index === 0 ? 'today' : ''}`}>{22-index}<small>Aug</small></span><div><strong>{row.in} - {row.out}</strong><p>{row.hours === '-' ? row.status : `${row.hours} worked`}</p></div><span className={`attendance-pill ${row.status.toLowerCase().replace(' ', '-')}`}>{row.status}</span></div>)}</div></article><aside className="employee-panel leave-panel"><div className="panel-heading"><div><span>TIME OFF</span><h2>Leave balance</h2></div></div><div className="leave-ring"><div><strong>16</strong><small>days left</small></div></div><div className="leave-breakdown"><InfoItem label="Paid time off" value="12 days" /><InfoItem label="Sick leave" value="4 days" /></div><button className="primary-button" onClick={() => navigate('/time-off?view=employee')}>Request time off <ArrowRight size={17} /></button></aside></div></section></main>;
}

function Attendance() {
  const navigate = useNavigate();
  const location = useLocation();
  const view = new URLSearchParams(location.search).get('view') === 'employee' ? 'employee' : 'admin';
  const [search, setSearch] = useState('');
  const rows = view === 'admin' ? attendanceRows.filter(row => row.name.toLowerCase().includes(search.toLowerCase())) : attendanceRows.filter(row => row.name === 'Ananya Rao').concat([
    { name: 'Ananya Rao', date: '21 Aug 2026', in: '09:10 AM', out: '06:20 PM', hours: '8h 10m', extra: '10m', status: 'Present' },
    { name: 'Ananya Rao', date: '20 Aug 2026', in: '09:02 AM', out: '06:00 PM', hours: '7h 58m', extra: '—', status: 'Present' },
    { name: 'Ananya Rao', date: '19 Aug 2026', in: '—', out: '—', hours: '—', extra: '—', status: 'On leave' },
  ]);
  return <main className="dashboard-shell attendance-page"><SimpleNav employee={view === 'employee'} active="attendance" navigate={navigate} /><section className="dashboard-content"><div className="attendance-heading"><div><span className="dashboard-eyebrow">ATTENDANCE</span><h1>{view === 'admin' ? 'Today’s attendance' : 'My attendance'}</h1><p>{view === 'admin' ? 'Track everyone’s workday and attendance status.' : 'Review your hours and day-wise attendance records.'}</p></div></div><div className="attendance-stats"><article><strong>{view === 'admin' ? '5' : '18'}</strong><span>{view === 'admin' ? 'Employees' : 'Days present'}</span></article><article><strong>{view === 'admin' ? '3' : '1'}</strong><span>{view === 'admin' ? 'Checked in' : 'Leave taken'}</span></article><article><strong>{view === 'admin' ? '1' : '8h 12m'}</strong><span>{view === 'admin' ? 'On leave' : 'Average hours'}</span></article><article><strong>{view === 'admin' ? '60%' : '2h 04m'}</strong><span>{view === 'admin' ? 'Present today' : 'Extra hours'}</span></article></div><section className="attendance-card"><div className="attendance-toolbar"><div className="date-control"><button><ChevronLeft size={17} /></button><div><span>{view === 'admin' ? 'TODAY' : 'AUGUST 2026'}</span><strong>{view === 'admin' ? '22 August 2026' : 'Monthly records'}</strong></div><button><ChevronRight size={17} /></button></div>{view === 'admin' && <div className="search-box"><Search size={17} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search employee" /></div>}</div><div className="attendance-table-wrap"><table><thead><tr>{view === 'admin' ? <th>Employee</th> : <th>Date</th>}<th>Check in</th><th>Check out</th><th>Work hours</th><th>Extra hours</th><th>Status</th></tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.date}-${index}`}><td>{view === 'admin' ? <div className="table-person"><span>{row.name.split(' ').map(n => n[0]).join('')}</span><div><strong>{row.name}</strong><small>{employees.find(e => e.name === row.name)?.department}</small></div></div> : <strong>{row.date}</strong>}</td><td>{row.in}</td><td>{row.out}</td><td>{row.hours}</td><td>{row.extra}</td><td><span className={`attendance-pill ${row.status.toLowerCase().replace(' ', '-')}`}>{row.status}</span></td></tr>)}</tbody></table></div></section></section></main>;
}

function LeaveCalendar({ requests, year }) {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const leaveDays = {};
  requests.filter(item => item.status !== 'Rejected').forEach(item => {
    const current = new Date(item.start);
    const end = new Date(item.end);
    while (current <= end) {
      const key = `${current.getFullYear()}-${current.getMonth()}-${current.getDate()}`;
      leaveDays[key] = { status: item.status.toLowerCase(), type: item.type };
      current.setDate(current.getDate() + 1);
    }
  });
  return <div className="year-calendar">{monthNames.map((month, monthIndex) => {
    const firstDay = new Date(year, monthIndex, 1).getDay();
    const days = new Date(year, monthIndex + 1, 0).getDate();
    return <section className="calendar-month" key={month}><h3>{month}</h3><div className="calendar-weekdays">{['S','M','T','W','T','F','S'].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div><div className="calendar-days">{Array.from({ length: firstDay }).map((_, index) => <i key={`blank-${index}`} />)}{Array.from({ length: days }, (_, index) => index + 1).map(day => { const leave = leaveDays[`${year}-${monthIndex}-${day}`]; return <span key={day} className={leave ? `leave-day ${leave.status}` : ''} title={leave ? `${leave.type} - ${leave.status}` : ''}>{day}</span>; })}</div></section>;
  })}</div>;
}

function TimeOff() {
  const navigate = useNavigate();
  const location = useLocation();
  const employeeView = new URLSearchParams(location.search).get('view') === 'employee';
  const [requests, setRequests] = useState(mockData.leaveRequests);
  const [requestOpen, setRequestOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [calendarYear, setCalendarYear] = useState(2026);
  const visible = employeeView ? requests.filter(item => item.employee === 'Ananya Rao') : requests;
  const updateStatus = (id, status) => setRequests(items => items.map(item => item.id === id ? { ...item, status } : item));
  const submitRequest = event => { event.preventDefault(); setSubmitted(true); setTimeout(() => { setRequestOpen(false); setSubmitted(false); }, 900); };
  return <main className="dashboard-shell timeoff-page"><SimpleNav employee={employeeView} active="timeoff" navigate={navigate} /><section className="dashboard-content"><div className="attendance-heading"><div><span className="dashboard-eyebrow">TIME OFF</span><h1>{employeeView ? 'Plan time away' : 'Leave requests'}</h1><p>{employeeView ? 'Review your balance and request leave without the paperwork.' : 'Review, approve and manage time off across your team.'}</p></div>{employeeView && <button className="add-employee" onClick={() => setRequestOpen(true)}><Plus size={18} /> New request</button>}</div>{employeeView ? <><div className="leave-summary-grid"><article><span className="metric-icon green"><Umbrella size={20} /></span><div><small>PAID TIME OFF</small><strong>12 days</strong><p>of 18 remaining</p></div></article><article><span className="metric-icon blue"><BadgeCheck size={20} /></span><div><small>SICK LEAVE</small><strong>4 days</strong><p>of 7 remaining</p></div></article><article><span className="metric-icon amber"><CalendarDays size={20} /></span><div><small>UPCOMING</small><strong>2 days</strong><p>14 - 15 September</p></div></article></div><section className="leave-calendar-card"><div className="calendar-header"><div><span className="dashboard-eyebrow">LEAVE CALENDAR</span><h2>My year at a glance</h2></div><div className="calendar-controls"><button onClick={() => setCalendarYear(year => year - 1)}><ChevronLeft size={17} /></button><strong>{calendarYear}</strong><button onClick={() => setCalendarYear(year => year + 1)}><ChevronRight size={17} /></button></div><div className="calendar-legend"><span><i className="approved" /> Approved</span><span><i className="pending" /> Pending</span></div></div><LeaveCalendar requests={visible} year={calendarYear} /></section></> : <div className="attendance-stats"><article><strong>{requests.filter(r => r.status === 'Pending').length}</strong><span>Pending requests</span></article><article><strong>{requests.filter(r => r.status === 'Approved').length}</strong><span>Approved</span></article><article><strong>{requests.filter(r => r.status === 'Rejected').length}</strong><span>Rejected</span></article><article><strong>23</strong><span>Employees available</span></article></div>}<section className="attendance-card"><div className="timeoff-toolbar"><div><span className="dashboard-eyebrow">{employeeView ? 'MY REQUESTS' : 'TEAM REQUESTS'}</span><h2>{employeeView ? 'Request history' : 'Needs your attention'}</h2></div><div className="filter-tabs"><button className="active">All</button><button>Pending</button><button>Approved</button></div></div><div className="request-list">{visible.map(item => <article key={item.id}><div className="request-person"><span>{item.initials}</span><div><strong>{employeeView ? item.type : item.employee}</strong><p>{employeeView ? item.reason : item.type}</p></div></div><div><small>DATES</small><strong>{item.start} - {item.end}</strong></div><div><small>DURATION</small><strong>{item.days} {item.days === 1 ? 'day' : 'days'}</strong></div><span className={`request-status ${item.status.toLowerCase()}`}>{item.status}</span>{!employeeView && item.status === 'Pending' && <div className="request-actions"><button className="reject" onClick={() => updateStatus(item.id, 'Rejected')}><X size={15} /> Reject</button><button className="approve" onClick={() => updateStatus(item.id, 'Approved')}><Check size={15} /> Approve</button></div>}</article>)}</div></section></section>{requestOpen && <div className="drawer-backdrop modal-center" onMouseDown={() => setRequestOpen(false)}><form className="request-modal" onSubmit={submitRequest} onMouseDown={event => event.stopPropagation()}><button type="button" className="drawer-close" onClick={() => setRequestOpen(false)}><X size={19} /></button><span className="dashboard-eyebrow">NEW REQUEST</span><h2>Request time off</h2><p>Choose the leave type and dates for your request.</p><Field label="Leave type" icon={Umbrella} placeholder="Paid time off" required /><div className="field-grid"><Field label="Start date" icon={CalendarDays} type="date" required /><Field label="End date" icon={CalendarDays} type="date" required /></div><label className="field"><span>Reason</span><textarea placeholder="Add a short note for your HR team" required /></label><button className="primary-button" type="submit">Submit request <ArrowRight size={17} /></button>{submitted && <div className="demo-message"><BadgeCheck size={17} /> Request submitted successfully.</div>}</form></div>}</main>;
}

function Profile({ employee = false }) {
  const navigate = useNavigate();
  const { employeeId } = useParams();
  const managedEmployee = employeeId ? employees.find(item => item.id === Number(employeeId)) : null;
  const subject = employee ? employees[0] : managedEmployee;
  const [tab, setTab] = useState('resume');
  const defaultSalary = mockData.salaries.find(item => item.employeeId === (subject?.id || 1)) || mockData.salaries[0];
  const storageKey = `dayflow-salary-${subject?.id || 'hr'}`;
  const [salaryConfig, setSalaryConfig] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : { ...defaultSalary };
  });
  const [salarySaved, setSalarySaved] = useState(false);
  const updateSalary = (field, value) => { setSalarySaved(false); setSalaryConfig(current => ({ ...current, [field]: Number(value) })); };
  const saveSalary = () => { localStorage.setItem(storageKey, JSON.stringify(salaryConfig)); setSalarySaved(true); };
  const wage = salaryConfig.monthlyWage;
  const money = (value) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.max(0, value || 0));
  const salary = {
    basic: wage * salaryConfig.basicPercent / 100,
    hra: wage * salaryConfig.basicPercent / 100 * salaryConfig.hraPercentOfBasic / 100,
    standard: wage * salaryConfig.standardPercent / 100,
    bonus: wage * salaryConfig.bonusPercent / 100,
    lta: wage * salaryConfig.ltaPercent / 100,
  };
  salary.fixed = Math.max(0, wage - Object.values(salary).reduce((sum, amount) => sum + amount, 0));

  const salaryRows = [
    ['Basic salary', salary.basic, `${salaryConfig.basicPercent}% of monthly wage`],
    ['House rent allowance', salary.hra, `${salaryConfig.hraPercentOfBasic}% of basic salary`],
    ['Standard allowance', salary.standard, `${salaryConfig.standardPercent}% of monthly wage`],
    ['Performance bonus', salary.bonus, `${salaryConfig.bonusPercent}% of monthly wage`],
    ['Leave travel allowance', salary.lta, `${salaryConfig.ltaPercent}% of monthly wage`],
    ['Fixed allowance', salary.fixed, 'Remaining wage balance'],
  ];

  return (
    <main className="dashboard-shell profile-page">
      <header className="dashboard-nav">
        <button className="dashboard-brand brand-button" onClick={() => navigate(employee ? '/employee-dashboard' : '/dashboard')}><span className="brand-mark"><img src={dayflowLogo} alt="Dayflow logo" /></span><span>dayflow</span></button>
        <nav className="desktop-nav">{!employee && <button onClick={() => navigate('/dashboard')}><Users size={17} /> Employees</button>}<button onClick={() => navigate(employee ? '/attendance?view=employee' : '/attendance')}><Clock3 size={17} /> Attendance</button><button onClick={() => navigate(employee ? '/time-off?view=employee' : '/time-off')}><CalendarDays size={17} /> Time off</button></nav>
        <div className="nav-actions"><button className="profile-button"><span>{employee ? 'AR' : 'HR'}</span><span className="profile-name"><strong>{employee ? 'Ananya Rao' : 'Harini Rao'}</strong><small>{employee ? 'Employee' : 'HR Admin'}</small></span></button></div>
      </header>

      <section className="profile-content">
        <button className="back-link" onClick={() => navigate(employee ? '/employee-dashboard' : '/dashboard')}><ArrowLeft size={17} /> Back to {employee ? 'dashboard' : 'employees'}</button>
        <div className="profile-title"><div><span className="dashboard-eyebrow">{managedEmployee ? 'EMPLOYEE PROFILE' : 'MY PROFILE'}</span><h1>{managedEmployee ? `${managedEmployee.name}'s workspace` : 'Personal workspace'}</h1><p>{managedEmployee ? 'Review employee details and manage their individual salary structure.' : 'Manage your professional details, private information and salary structure.'}</p></div><button className="outline-button"><Pencil size={16} /> Edit profile</button></div>

        <section className="profile-hero-card">
          <div className="profile-photo">{subject?.initials || 'HR'}<span><Pencil size={14} /></span></div>
          <div className="profile-identity"><span className="role-pill">{subject?.role || 'HR Administrator'}</span><h2>{subject?.name || 'Harini Rao'}</h2><p><Mail size={15} /> {subject?.email || 'harini@dayflow.in'} <span>•</span> <Phone size={15} /> +91 {subject ? '91234 56780' : '98765 43210'}</p></div>
          <div className="profile-company"><InfoItem label="Company" value="Dayflow Technologies" /><InfoItem label="Department" value={subject?.department || 'People Operations'} /><InfoItem label="Manager" value={subject ? 'Vikram Malhotra' : 'Chief Executive Officer'} /><InfoItem label="Location" value="Chennai, India" /></div>
        </section>

        <div className="profile-tabs">
          {[['resume', 'Resume'], ['private', 'Private info'], ...(!employee ? [['salary', 'Salary info']] : []), ['security', 'Security']].map(([key, label]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{key === 'salary' && <WalletCards size={16} />}{label}{key === 'salary' && <small>Admin</small>}</button>)}
        </div>

        {tab === 'resume' && <section className="profile-tab-grid">
          <article className="profile-section about-section"><div className="section-heading"><div><span>PROFILE</span><h3>About me</h3></div><button><Pencil size={15} /></button></div><p>{employee ? 'I design simple, inclusive product experiences that help people get meaningful work done. I enjoy turning complex workflows into calm and approachable interfaces.' : 'I build thoughtful people practices that help teams do their best work. I enjoy creating clear processes, supporting new employees and making every workday feel a little more human.'}</p><div className="resume-block"><h4>What I love about my job</h4><p>{employee ? 'Learning directly from users and collaborating with engineering to bring thoughtful ideas to life.' : 'Helping people find clarity, grow with confidence and feel supported throughout their journey at the company.'}</p></div><div className="resume-block"><h4>Interests & hobbies</h4><p>{employee ? 'Illustration, photography, travel and exploring independent design publications.' : 'Community building, reading, long walks and discovering independent coffee shops.'}</p></div></article>
          <div className="profile-side-stack"><article className="profile-section"><div className="section-heading"><div><span>EXPERTISE</span><h3>Skills</h3></div><button><Plus size={16} /></button></div><div className="tag-list">{(employee ? ['Product design', 'Figma', 'Research', 'Prototyping', 'Design systems'] : ['Recruitment', 'People strategy', 'Onboarding', 'HR operations', 'Employee relations']).map(skill => <span key={skill}>{skill}</span>)}</div></article><article className="profile-section"><div className="section-heading"><div><span>LEARNING</span><h3>Certifications</h3></div><button><Plus size={16} /></button></div><div className="certificate"><BadgeCheck size={21} /><div><strong>{employee ? 'Google UX Design' : 'Strategic Human Resources'}</strong><p>{employee ? 'Google · Issued 2025' : 'SHRM · Issued 2024'}</p></div></div></article></div>
        </section>}

        {tab === 'private' && <section className="private-grid"><article className="profile-section"><div className="section-heading"><div><span>PERSONAL</span><h3>Private information</h3></div><button><Pencil size={15} /></button></div><div className="info-list"><InfoItem label="Date of birth" value={employee ? '24 March 1998' : '18 June 1994'} /><InfoItem label="Residential address" value="Adyar, Chennai, Tamil Nadu" /><InfoItem label="Nationality" value="Indian" /><InfoItem label="Personal email" value={employee ? 'ananya.rao@gmail.com' : 'harini.rao@gmail.com'} /><InfoItem label="Gender" value="Female" /><InfoItem label="Marital status" value={employee ? 'Single' : 'Married'} /><InfoItem label="Date of joining" value={employee ? '8 July 2025' : '12 January 2024'} /></div></article><article className="profile-section"><div className="section-heading"><div><span>PAYMENTS</span><h3>Bank details</h3></div><button><Pencil size={15} /></button></div><div className="info-list"><InfoItem label="Account number" value="•••• •••• 8421" /><InfoItem label="Bank name" value="HDFC Bank" /><InfoItem label="IFSC code" value="HDFC0001234" /><InfoItem label="PAN number" value="ABCDE1234F" /><InfoItem label="UAN number" value="100********8" /><InfoItem label="Employee code" value={employee ? 'DFANRA20250014' : 'DFHR20240001'} /></div></article></section>}

        {tab === 'salary' && <section className="salary-layout"><div className="salary-main"><div className="salary-header"><div><span className="dashboard-eyebrow">ADMIN ONLY · {subject?.name || 'HR PROFILE'}</span><h2>Salary information</h2><p>Every value below belongs only to this employee.</p></div><ShieldCheck size={25} /></div><div className="wage-grid editable-wage-grid"><label><span>Monthly wage</span><div>₹<input type="number" min="0" value={wage} onChange={event => updateSalary('monthlyWage', event.target.value)} /></div></label><label><span>Yearly wage</span><strong>₹{money(wage * 12)}</strong></label><label><span>Working days / week</span><input type="number" min="1" max="7" value={salaryConfig.workingDays} onChange={event => updateSalary('workingDays', event.target.value)} /></label><label><span>Break time / hours</span><input type="number" min="0" step="0.5" value={salaryConfig.breakHours} onChange={event => updateSalary('breakHours', event.target.value)} /></label></div><div className="salary-rule-grid"><label>Basic %<input type="number" value={salaryConfig.basicPercent} onChange={event => updateSalary('basicPercent', event.target.value)} /></label><label>HRA % of Basic<input type="number" value={salaryConfig.hraPercentOfBasic} onChange={event => updateSalary('hraPercentOfBasic', event.target.value)} /></label><label>Standard %<input type="number" step="0.01" value={salaryConfig.standardPercent} onChange={event => updateSalary('standardPercent', event.target.value)} /></label><label>Bonus %<input type="number" step="0.01" value={salaryConfig.bonusPercent} onChange={event => updateSalary('bonusPercent', event.target.value)} /></label><label>LTA %<input type="number" step="0.01" value={salaryConfig.ltaPercent} onChange={event => updateSalary('ltaPercent', event.target.value)} /></label><label>Employee PF %<input type="number" value={salaryConfig.employeePfPercent} onChange={event => updateSalary('employeePfPercent', event.target.value)} /></label><label>Employer PF %<input type="number" value={salaryConfig.employerPfPercent} onChange={event => updateSalary('employerPfPercent', event.target.value)} /></label><label>Professional tax ₹<input type="number" value={salaryConfig.professionalTax} onChange={event => updateSalary('professionalTax', event.target.value)} /></label></div><div className="salary-save-row"><button className="add-employee" onClick={saveSalary}><Check size={17} /> Save salary changes</button>{salarySaved && <span><BadgeCheck size={16} /> Saved for {subject?.name || 'this profile'}</span>}</div><h3 className="salary-subtitle">Calculated salary components</h3><div className="salary-rows">{salaryRows.map(([name, amount, formula]) => <div className="salary-row" key={name}><div><strong>{name}</strong><small>{formula}</small></div><span>₹{money(amount)} <small>/ month</small></span></div>)}</div></div><aside className="deduction-card"><span className="metric-icon green"><WalletCards size={19} /></span><h3>Deductions</h3><p>Calculated separately for {subject?.name || 'this employee'}.</p><div><InfoItem label={`Employee PF · ${salaryConfig.employeePfPercent}%`} value={`₹${money(salary.basic * salaryConfig.employeePfPercent / 100)}`} /><InfoItem label={`Employer PF · ${salaryConfig.employerPfPercent}%`} value={`₹${money(salary.basic * salaryConfig.employerPfPercent / 100)}`} /><InfoItem label="Professional tax" value={`₹${money(salaryConfig.professionalTax)}`} /></div><div className="net-salary"><span>Estimated net salary</span><strong>₹{money(wage - salary.basic * salaryConfig.employeePfPercent / 100 - salaryConfig.professionalTax)}</strong><small>Before other statutory deductions</small></div></aside></section>}

        {tab === 'security' && <section className="security-grid"><article className="profile-section"><div className="section-heading"><div><span>ACCOUNT</span><h3>Password & security</h3></div></div><div className="security-row"><div className="metric-icon"><KeyRound size={19} /></div><div><strong>Password</strong><p>Last changed 32 days ago</p></div><button className="outline-button">Change password</button></div><div className="security-row"><div className="metric-icon green"><ShieldCheck size={19} /></div><div><strong>Two-step verification</strong><p>Add an extra layer of protection</p></div><button className="outline-button">Enable</button></div></article></section>}
      </section>
    </main>
  );
}

function Signup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [created, setCreated] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const submit = (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please check and try again.');
      setCreated(false);
      return;
    }
    setError('');
    setCreated(true);
  };

  return (
    <main className="auth-shell signup-shell">
      <BrandPanel signup />
      <section className="form-panel signup-panel">
        <div className="form-container wide">
          <button className="back-link" type="button" onClick={() => navigate('/login')}><ArrowLeft size={17} /> Back to sign in</button>
          <div className="form-heading compact">
            <div className="heading-line"><span className="mini-icon"><Building2 size={22} /></span><span className="access-pill"><ShieldCheck size={14} /> HR registration</span></div>
            <h2>Create your HR account</h2>
            <p>Register your company workspace. You can add employees after signing in.</p>
          </div>
          <form onSubmit={submit}>
            <div className="field-grid">
              <Field label="HR administrator name" icon={UserRound} placeholder="Full name" required />
              <Field label="Work email" icon={Mail} type="email" placeholder="name@company.com" required />
              <Field label="Company" icon={Building2} placeholder="Company name" required />
              <Field label="Phone number" icon={Phone} type="tel" placeholder="Your phone number" required />
            </div>
            <Field
              label="Password" icon={KeyRound} type={showPassword ? 'text' : 'password'}
              placeholder="Minimum 8 characters" minLength="8" value={password} onChange={(event) => setPassword(event.target.value)} required
              trailing={<button className="icon-button" type="button" aria-label="Toggle password visibility" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>}
            />
            <Field label="Confirm password" icon={LockKeyhole} type={showPassword ? 'text' : 'password'} placeholder="Enter the password again" minLength="8" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
            <label className="checkbox consent"><input type="checkbox" required /><span><Check size={13} /></span>I confirm that I am authorized to create this company’s HR workspace.</label>
            <button className="primary-button" type="submit">Create HR account <ArrowRight size={18} /></button>
            {error && <div className="error-message">{error}</div>}
            {created && <div className="demo-message"><BadgeCheck size={18} /> HR signup form validated. Backend registration will be connected next.</div>}
          </form>
          <p className="security-note"><ShieldCheck size={16} /> Employee signup is not available. HR will add employees after login.</p>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  return <Routes><Route path="/login" element={<Login />} /><Route path="/signup" element={<Signup />} /><Route path="/dashboard" element={<Dashboard />} /><Route path="/employees/:employeeId" element={<Profile />} /><Route path="/employee-dashboard" element={<EmployeeDashboard />} /><Route path="/attendance" element={<Attendance />} /><Route path="/time-off" element={<TimeOff />} /><Route path="/profile" element={<Profile />} /><Route path="/employee-profile" element={<Profile employee />} /><Route path="*" element={<Navigate to="/login" replace />} /></Routes>;
}

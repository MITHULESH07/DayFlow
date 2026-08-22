import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BadgeCheck, BarChart3, Building2, CalendarDays, Check, ChevronDown, Clock3, KeyRound, LogOut, Mail, Menu, Plane, Plus, Search, ShieldCheck, Timer, Umbrella, UserRound, Users, X } from 'lucide-react';
import mockData from '../../data/mockData.json';
import { Field, InfoItem, StatusMark } from '../../components/common/UI.jsx';
import { SimpleNav } from '../../components/layout/SimpleNav.jsx';
import dayflowLogo from '../../../images/DayflowLogo.png';

const employees = mockData.employees;

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

export function Dashboard() {
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

const attendanceRows = mockData.attendance;

export function EmployeeDashboard() {
  const navigate = useNavigate();
  const [checkedIn, setCheckedIn] = useState(false);
  return <main className="dashboard-shell employee-dashboard"><SimpleNav employee navigate={navigate} /><section className="dashboard-content"><div className="employee-welcome"><div><span className="dashboard-eyebrow">SATURDAY, 22 AUGUST</span><h1>Good morning, Ananya.</h1><p>Here’s everything you need for a smooth workday.</p></div><button className={`employee-check ${checkedIn ? 'checked' : ''}`} onClick={() => setCheckedIn(!checkedIn)}><span><Timer size={21} /></span><div><small>{checkedIn ? 'STARTED AT 09:04 AM' : 'READY FOR THE DAY?'}</small><strong>{checkedIn ? 'Check out' : 'Check in'}</strong></div><ArrowRight size={18} /></button></div><div className="employee-metrics"><article><span className="metric-icon green"><Clock3 size={20} /></span><div><small>THIS MONTH</small><strong>18 days</strong><p>Days present</p></div></article><article><span className="metric-icon"><Timer size={20} /></span><div><small>AVERAGE</small><strong>8h 12m</strong><p>Daily work hours</p></div></article><article><span className="metric-icon amber"><Umbrella size={20} /></span><div><small>AVAILABLE</small><strong>16 days</strong><p>Paid time off</p></div></article><article><span className="metric-icon blue"><BarChart3 size={20} /></span><div><small>THIS WEEK</small><strong>2h 04m</strong><p>Extra hours</p></div></article></div><div className="employee-dashboard-grid"><article className="employee-panel"><div className="panel-heading"><div><span>ATTENDANCE</span><h2>Recent activity</h2></div><button onClick={() => navigate('/attendance?view=employee')}>View all <ArrowRight size={15} /></button></div><div className="activity-list">{attendanceRows.slice(0, 4).map((row, index) => <div key={index}><span className={`activity-day ${index === 0 ? 'today' : ''}`}>{22-index}<small>Aug</small></span><div><strong>{row.in} - {row.out}</strong><p>{row.hours === '-' ? row.status : `${row.hours} worked`}</p></div><span className={`attendance-pill ${row.status.toLowerCase().replace(' ', '-')}`}>{row.status}</span></div>)}</div></article><aside className="employee-panel leave-panel"><div className="panel-heading"><div><span>TIME OFF</span><h2>Leave balance</h2></div></div><div className="leave-ring"><div><strong>16</strong><small>days left</small></div></div><div className="leave-breakdown"><InfoItem label="Paid time off" value="12 days" /><InfoItem label="Sick leave" value="4 days" /></div><button className="primary-button" onClick={() => navigate('/time-off?view=employee')}>Request time off <ArrowRight size={17} /></button></aside></div></section></main>;
}

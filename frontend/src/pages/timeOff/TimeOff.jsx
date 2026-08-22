import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, BadgeCheck, CalendarDays, Check, ChevronLeft, ChevronRight, Plus, Umbrella, X } from 'lucide-react';
import { Field } from '../../components/common/UI.jsx';
import { SimpleNav } from '../../components/layout/SimpleNav.jsx';
import { apiRequest, toInitials, toDisplayDate } from '../../services/api.js';

function LeaveCalendar({ requests, year }) {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const leaveDays = {};
  requests.filter(item => item.status !== 'Rejected').forEach(item => {
    const current = new Date(item.startRaw || item.start);
    const end = new Date(item.endRaw || item.end);
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

const typeLabel = (type) => type === 'PAID' ? 'Paid time off' : type === 'SICK' ? 'Sick leave' : 'Unpaid leave';
const normalizeStatus = (status) => status ? status[0] + status.slice(1).toLowerCase() : 'Pending';
const daysBetween = (start, end) => Math.max(1, Math.round((new Date(end) - new Date(start)) / 86400000) + 1);
const toUiLeave = (item, currentUser = 'Me') => {
  const employee = item.employeeName || currentUser;
  const start = item.start_date;
  const end = item.end_date;
  return {
    id: item.id,
    employee,
    initials: toInitials(employee),
    type: typeLabel(item.leave_type),
    start: toDisplayDate(start),
    end: toDisplayDate(end),
    startRaw: start,
    endRaw: end,
    days: daysBetween(start, end),
    status: normalizeStatus(item.status),
    reason: item.remarks || item.admin_comment || '-',
  };
};
const toLeaveType = (value) => {
  const lower = String(value || '').toLowerCase();
  if (lower.includes('sick')) return 'SICK';
  if (lower.includes('unpaid')) return 'UNPAID';
  return 'PAID';
};

export function TimeOff() {
  const navigate = useNavigate();
  const location = useLocation();
  const employeeView = new URLSearchParams(location.search).get('view') === 'employee';
  const [requests, setRequests] = useState([]);
  const [requestOpen, setRequestOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  const loadLeaves = async () => {
    const path = employeeView ? '/api/leaves/me' : '/api/leaves';
    const data = await apiRequest(path);
    setRequests(data.leaveRequests.map(item => toUiLeave(item, 'Me')));
  };

  useEffect(() => {
    loadLeaves().catch(() => {});
  }, [employeeView]);

  const visible = requests;
  const updateStatus = async (id, status) => {
    await apiRequest(`/api/leaves/${id}/${status === 'Approved' ? 'approve' : 'reject'}`, { method: 'PUT', body: JSON.stringify({}) });
    await loadLeaves();
  };
  const submitRequest = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError('');
    setSubmitted(false);
    try {
      await apiRequest('/api/leaves', {
        method: 'POST',
        body: JSON.stringify({
          leave_type: toLeaveType(form.get('leave_type')),
          start_date: form.get('start_date'),
          end_date: form.get('end_date'),
          remarks: form.get('remarks'),
        }),
      });
      setSubmitted(true);
      await loadLeaves();
      setTimeout(() => { setRequestOpen(false); setSubmitted(false); }, 900);
    } catch (err) {
      setError(err.message);
    }
  };

  const paidUsed = visible.filter(r => r.status === 'Approved' && r.type === 'Paid time off').reduce((sum, r) => sum + r.days, 0);
  const sickUsed = visible.filter(r => r.status === 'Approved' && r.type === 'Sick leave').reduce((sum, r) => sum + r.days, 0);
  const upcoming = visible.find(r => r.status !== 'Rejected' && new Date(r.startRaw) >= new Date());

  return <main className="dashboard-shell timeoff-page"><SimpleNav employee={employeeView} active="timeoff" navigate={navigate} /><section className="dashboard-content"><div className="attendance-heading"><div><span className="dashboard-eyebrow">TIME OFF</span><h1>{employeeView ? 'Plan time away' : 'Leave requests'}</h1><p>{employeeView ? 'Review your balance and request leave without the paperwork.' : 'Review, approve and manage time off across your team.'}</p></div>{employeeView && <button className="add-employee" onClick={() => setRequestOpen(true)}><Plus size={18} /> New request</button>}</div>{employeeView ? <><div className="leave-summary-grid"><article><span className="metric-icon green"><Umbrella size={20} /></span><div><small>PAID TIME OFF</small><strong>{Math.max(0, 18 - paidUsed)} days</strong><p>of 18 remaining</p></div></article><article><span className="metric-icon blue"><BadgeCheck size={20} /></span><div><small>SICK LEAVE</small><strong>{Math.max(0, 7 - sickUsed)} days</strong><p>of 7 remaining</p></div></article><article><span className="metric-icon amber"><CalendarDays size={20} /></span><div><small>UPCOMING</small><strong>{upcoming ? `${upcoming.days} days` : '0 days'}</strong><p>{upcoming ? `${upcoming.start} - ${upcoming.end}` : 'No upcoming leave'}</p></div></article></div><section className="leave-calendar-card"><div className="calendar-header"><div><span className="dashboard-eyebrow">LEAVE CALENDAR</span><h2>My year at a glance</h2></div><div className="calendar-controls"><button onClick={() => setCalendarYear(year => year - 1)}><ChevronLeft size={17} /></button><strong>{calendarYear}</strong><button onClick={() => setCalendarYear(year => year + 1)}><ChevronRight size={17} /></button></div><div className="calendar-legend"><span><i className="approved" /> Approved</span><span><i className="pending" /> Pending</span></div></div><LeaveCalendar requests={visible} year={calendarYear} /></section></> : <div className="attendance-stats"><article><strong>{requests.filter(r => r.status === 'Pending').length}</strong><span>Pending requests</span></article><article><strong>{requests.filter(r => r.status === 'Approved').length}</strong><span>Approved</span></article><article><strong>{requests.filter(r => r.status === 'Rejected').length}</strong><span>Rejected</span></article><article><strong>{requests.length}</strong><span>Total requests</span></article></div>}<section className="attendance-card"><div className="timeoff-toolbar"><div><span className="dashboard-eyebrow">{employeeView ? 'MY REQUESTS' : 'TEAM REQUESTS'}</span><h2>{employeeView ? 'Request history' : 'Needs your attention'}</h2></div><div className="filter-tabs"><button className="active">All</button><button>Pending</button><button>Approved</button></div></div><div className="request-list">{visible.length === 0 && <article><div><strong>No leave requests found.</strong><p>Requests will appear here after they are created.</p></div></article>}{visible.map(item => <article key={item.id}><div className="request-person"><span>{item.initials}</span><div><strong>{employeeView ? item.type : item.employee}</strong><p>{employeeView ? item.reason : item.type}</p></div></div><div><small>DATES</small><strong>{item.start} - {item.end}</strong></div><div><small>DURATION</small><strong>{item.days} {item.days === 1 ? 'day' : 'days'}</strong></div><span className={`request-status ${item.status.toLowerCase()}`}>{item.status}</span>{!employeeView && item.status === 'Pending' && <div className="request-actions"><button className="reject" onClick={() => updateStatus(item.id, 'Rejected')}><X size={15} /> Reject</button><button className="approve" onClick={() => updateStatus(item.id, 'Approved')}><Check size={15} /> Approve</button></div>}</article>)}</div></section></section>{requestOpen && <div className="drawer-backdrop modal-center" onMouseDown={() => setRequestOpen(false)}><form className="request-modal" onSubmit={submitRequest} onMouseDown={event => event.stopPropagation()}><button type="button" className="drawer-close" onClick={() => setRequestOpen(false)}><X size={19} /></button><span className="dashboard-eyebrow">NEW REQUEST</span><h2>Request time off</h2><p>Choose the leave type and dates for your request.</p><Field name="leave_type" label="Leave type" icon={Umbrella} placeholder="Paid time off" required /><div className="field-grid"><Field name="start_date" label="Start date" icon={CalendarDays} type="date" required /><Field name="end_date" label="End date" icon={CalendarDays} type="date" required /></div><label className="field"><span>Reason</span><textarea name="remarks" placeholder="Add a short note for your HR team" required /></label><button className="primary-button" type="submit">Submit request <ArrowRight size={17} /></button>{error && <div className="error-message">{error}</div>}{submitted && <div className="demo-message"><BadgeCheck size={17} /> Request submitted successfully.</div>}</form></div>}</main>;
}


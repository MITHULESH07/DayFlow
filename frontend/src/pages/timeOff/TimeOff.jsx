import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, BadgeCheck, CalendarDays, Check, ChevronLeft, ChevronRight, Plus, Umbrella, X } from 'lucide-react';
import mockData from '../../data/mockData.json';
import { Field } from '../../components/common/UI.jsx';
import { SimpleNav } from '../../components/layout/SimpleNav.jsx';

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

export function TimeOff() {
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

import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { SimpleNav } from '../../components/layout/SimpleNav.jsx';
import { apiRequest, toDisplayDate } from '../../services/api.js';

const formatTime = (value) => value || '-';
const toAdminRow = (row) => ({
  name: row.employeeName,
  department: row.department,
  date: toDisplayDate(row.date),
  in: formatTime(row.checkIn),
  out: formatTime(row.checkOut),
  hours: row.workingHours || '-',
  extra: '-',
  status: row.status === 'PRESENT' ? 'Present' : row.status === 'LEAVE' ? 'On leave' : row.status,
});
const toEmployeeRow = (row) => ({
  name: 'Me',
  department: '',
  date: toDisplayDate(row.date),
  in: formatTime(row.checkIn),
  out: formatTime(row.checkOut),
  hours: row.workingHours || '-',
  extra: '-',
  status: row.status === 'PRESENT' ? 'Present' : row.status === 'LEAVE' ? 'On leave' : row.status,
});

export function Attendance() {
  const navigate = useNavigate();
  const location = useLocation();
  const view = new URLSearchParams(location.search).get('view') === 'employee' ? 'employee' : 'admin';
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const path = view === 'admin' ? '/api/attendance/all' : '/api/attendance/me';
    apiRequest(path)
      .then(data => setRows(view === 'admin' ? data.attendance.map(toAdminRow) : data.attendance.map(toEmployeeRow)))
      .catch(() => {});
  }, [view]);

  const visibleRows = useMemo(() => view === 'admin'
    ? rows.filter(row => row.name.toLowerCase().includes(search.toLowerCase()))
    : rows,
  [rows, search, view]);

  const present = rows.filter(row => row.status === 'Present').length;
  const onLeave = rows.filter(row => row.status === 'On leave').length;

  return <main className="dashboard-shell attendance-page"><SimpleNav employee={view === 'employee'} active="attendance" navigate={navigate} /><section className="dashboard-content"><div className="attendance-heading"><div><span className="dashboard-eyebrow">ATTENDANCE</span><h1>{view === 'admin' ? "Today's attendance" : 'My attendance'}</h1><p>{view === 'admin' ? "Track everyone's workday and attendance status." : 'Review your hours and day-wise attendance records.'}</p></div></div><div className="attendance-stats"><article><strong>{view === 'admin' ? rows.length : present}</strong><span>{view === 'admin' ? 'Records' : 'Days present'}</span></article><article><strong>{present}</strong><span>{view === 'admin' ? 'Present' : 'Present records'}</span></article><article><strong>{onLeave}</strong><span>{view === 'admin' ? 'On leave' : 'Leave taken'}</span></article><article><strong>{rows.length ? Math.round((present / rows.length) * 100) : 0}%</strong><span>Attendance rate</span></article></div><section className="attendance-card"><div className="attendance-toolbar"><div className="date-control"><button><ChevronLeft size={17} /></button><div><span>{view === 'admin' ? 'TODAY' : 'MONTHLY'}</span><strong>{view === 'admin' ? new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Monthly records'}</strong></div><button><ChevronRight size={17} /></button></div>{view === 'admin' && <div className="search-box"><Search size={17} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search employee" /></div>}</div><div className="attendance-table-wrap"><table><thead><tr>{view === 'admin' ? <th>Employee</th> : <th>Date</th>}<th>Check in</th><th>Check out</th><th>Work hours</th><th>Extra hours</th><th>Status</th></tr></thead><tbody>{visibleRows.length === 0 && <tr><td colSpan="6">No attendance records found.</td></tr>}{visibleRows.map((row, index) => <tr key={`${row.date}-${index}`}><td>{view === 'admin' ? <div className="table-person"><span>{row.name.split(' ').map(n => n[0]).join('')}</span><div><strong>{row.name}</strong><small>{row.department || '-'}</small></div></div> : <strong>{row.date}</strong>}</td><td>{row.in}</td><td>{row.out}</td><td>{row.hours}</td><td>{row.extra}</td><td><span className={`attendance-pill ${String(row.status).toLowerCase().replace(' ', '-')}`}>{row.status}</span></td></tr>)}</tbody></table></div></section></section></main>;
}


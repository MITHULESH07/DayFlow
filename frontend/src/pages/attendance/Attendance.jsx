import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import mockData from '../../data/mockData.json';
import { SimpleNav } from '../../components/layout/SimpleNav.jsx';

const employees = mockData.employees;
const attendanceRows = mockData.attendance;

export function Attendance() {
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

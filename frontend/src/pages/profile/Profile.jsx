import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, Building2, CalendarDays, Check, Clock3, KeyRound, Mail, MapPin, Pencil, Phone, Plus, ShieldCheck, UserRound, Users, WalletCards, X } from 'lucide-react';
import dayflowLogo from '../../../images/DayflowLogo.png';
import mockData from '../../data/mockData.json';
import { Field, InfoItem } from '../../components/common/UI.jsx';

const employees = mockData.employees;

export function Profile({ employee = false }) {
  const navigate = useNavigate();
  const { employeeId } = useParams();
  const managedEmployee = employeeId ? employees.find(item => item.id === Number(employeeId)) : null;
  const subject = employee ? employees[0] : managedEmployee;
  const [tab, setTab] = useState('resume');
  const profileStorageKey = `dayflow-profile-${subject?.id || 'hr'}`;
  const initialProfile = {
    name: subject?.name || 'Harini Rao',
    email: subject?.email || 'harini@dayflow.in',
    phone: subject ? '91234 56780' : '98765 43210',
    jobTitle: subject?.role || 'HR Administrator',
    department: subject?.department || 'People Operations',
    manager: subject ? 'Vikram Malhotra' : 'Chief Executive Officer',
    location: 'Chennai, India',
    about: employee ? 'I design simple, inclusive product experiences that help people get meaningful work done.' : 'I build thoughtful people practices that help teams do their best work.',
    jobLove: employee ? 'Learning directly from users and bringing thoughtful ideas to life.' : 'Helping people find clarity, grow with confidence and feel supported.',
    interests: employee ? 'Illustration, photography, travel and design publications.' : 'Community building, reading, long walks and independent coffee shops.',
    address: 'Adyar, Chennai, Tamil Nadu',
    personalEmail: employee ? 'ananya.rao@gmail.com' : 'harini.rao@gmail.com',
    bankName: 'HDFC Bank',
    accountNumber: '•••• •••• 8421'
  };
  const [profileData, setProfileData] = useState(() => {
    const saved = localStorage.getItem(profileStorageKey);
    return saved ? JSON.parse(saved) : initialProfile;
  });
  const [editOpen, setEditOpen] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState('');
  const [companyLogo, setCompanyLogo] = useState(dayflowLogo);
  const updateProfile = (field, value) => setProfileData(current => ({ ...current, [field]: value }));
  const saveProfile = event => { event.preventDefault(); localStorage.setItem(profileStorageKey, JSON.stringify(profileData)); setProfileSaved(true); setTimeout(() => { setEditOpen(false); setProfileSaved(false); }, 700); };
  const previewFile = (event, setter) => { const file = event.target.files?.[0]; if (file) setter(URL.createObjectURL(file)); };
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
        <div className="profile-title"><div><span className="dashboard-eyebrow">{managedEmployee ? 'EMPLOYEE PROFILE' : 'MY PROFILE'}</span><h1>{managedEmployee ? `${profileData.name}'s workspace` : 'Personal workspace'}</h1><p>{managedEmployee ? 'Review employee details and manage their individual salary structure.' : 'Manage your professional details, private information and salary structure.'}</p></div><div className="profile-title-actions">{!employee && !managedEmployee && <label className="outline-button upload-button"><Building2 size={16} /> Upload company logo<input type="file" accept="image/*" onChange={event => previewFile(event, setCompanyLogo)} /></label>}<button className="outline-button" onClick={() => setEditOpen(true)}><Pencil size={16} /> Edit profile</button></div></div>

        <section className="profile-hero-card">
          <label className={`profile-photo ${profilePhoto ? 'has-photo' : ''}`}>{profilePhoto ? <img src={profilePhoto} alt={`${profileData.name} profile`} /> : (subject?.initials || 'HR')}<span><Pencil size={14} /></span><input type="file" accept="image/*" onChange={event => previewFile(event, setProfilePhoto)} /></label>
          <div className="profile-identity"><span className="role-pill">{profileData.jobTitle}</span><h2>{profileData.name}</h2><p><Mail size={15} /> {profileData.email} <span>•</span> <Phone size={15} /> +91 {profileData.phone}</p></div>
          <div className="profile-company"><InfoItem label="Company" value="Dayflow Technologies" /><InfoItem label="Department" value={profileData.department} /><InfoItem label="Manager" value={profileData.manager} /><InfoItem label="Location" value={profileData.location} /></div>
          {!employee && !managedEmployee && <div className="company-logo-preview"><img src={companyLogo} alt="Company logo preview" /><div><span>COMPANY LOGO</span><strong>Dayflow Technologies</strong><small>Use the upload button above to replace it.</small></div></div>}
        </section>

        <div className="profile-tabs">
          {[['resume', 'Resume'], ['private', 'Private info'], ['salary', 'Salary info'], ['security', 'Security']].map(([key, label]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{key === 'salary' && <WalletCards size={16} />}{label}{key === 'salary' && !employee && <small>Admin</small>}</button>)}
        </div>

        {tab === 'resume' && <section className="profile-tab-grid">
          <article className="profile-section about-section"><div className="section-heading"><div><span>PROFILE</span><h3>About me</h3></div><button onClick={() => setEditOpen(true)}><Pencil size={15} /></button></div><p>{profileData.about}</p><div className="resume-block"><h4>What I love about my job</h4><p>{profileData.jobLove}</p></div><div className="resume-block"><h4>Interests & hobbies</h4><p>{profileData.interests}</p></div></article>
          <div className="profile-side-stack"><article className="profile-section"><div className="section-heading"><div><span>EXPERTISE</span><h3>Skills</h3></div><button><Plus size={16} /></button></div><div className="tag-list">{(employee ? ['Product design', 'Figma', 'Research', 'Prototyping', 'Design systems'] : ['Recruitment', 'People strategy', 'Onboarding', 'HR operations', 'Employee relations']).map(skill => <span key={skill}>{skill}</span>)}</div></article><article className="profile-section"><div className="section-heading"><div><span>LEARNING</span><h3>Certifications</h3></div><button><Plus size={16} /></button></div><div className="certificate"><BadgeCheck size={21} /><div><strong>{employee ? 'Google UX Design' : 'Strategic Human Resources'}</strong><p>{employee ? 'Google · Issued 2025' : 'SHRM · Issued 2024'}</p></div></div></article></div>
        </section>}

        {tab === 'private' && <section className="private-grid"><article className="profile-section"><div className="section-heading"><div><span>PERSONAL</span><h3>Private information</h3></div><button onClick={() => setEditOpen(true)}><Pencil size={15} /></button></div><div className="info-list"><InfoItem label="Date of birth" value={employee ? '24 March 1998' : '18 June 1994'} /><InfoItem label="Residential address" value={profileData.address} /><InfoItem label="Nationality" value="Indian" /><InfoItem label="Personal email" value={profileData.personalEmail} /><InfoItem label="Gender" value="Female" /><InfoItem label="Marital status" value={employee ? 'Single' : 'Married'} /><InfoItem label="Date of joining" value={employee ? '8 July 2025' : '12 January 2024'} /></div></article><article className="profile-section"><div className="section-heading"><div><span>PAYMENTS</span><h3>Bank details</h3></div><button onClick={() => setEditOpen(true)}><Pencil size={15} /></button></div><div className="info-list"><InfoItem label="Account number" value={profileData.accountNumber} /><InfoItem label="Bank name" value={profileData.bankName} /><InfoItem label="IFSC code" value="HDFC0001234" /><InfoItem label="PAN number" value="ABCDE1234F" /><InfoItem label="UAN number" value="100********8" /><InfoItem label="Employee code" value={employee ? 'DFANRA20250014' : 'DFHR20240001'} /></div></article></section>}

        {tab === 'salary' && <section className={`salary-layout ${employee ? 'read-only-salary' : ''}`}><div className="salary-main"><div className="salary-header"><div><span className="dashboard-eyebrow">{employee ? 'READ ONLY' : `ADMIN ONLY · ${subject?.name || 'HR PROFILE'}`}</span><h2>Salary information</h2><p>{employee ? 'Review your current wage, salary components and deductions.' : 'Every value below belongs only to this employee.'}</p></div><ShieldCheck size={25} /></div><div className="wage-grid editable-wage-grid"><label><span>Monthly wage</span>{employee ? <strong>₹{money(wage)}</strong> : <div>₹<input type="number" min="0" value={wage} onChange={event => updateSalary('monthlyWage', event.target.value)} /></div>}</label><label><span>Yearly wage</span><strong>₹{money(wage * 12)}</strong></label><label><span>Working days / week</span>{employee ? <strong>{salaryConfig.workingDays} days</strong> : <input type="number" min="1" max="7" value={salaryConfig.workingDays} onChange={event => updateSalary('workingDays', event.target.value)} />}</label><label><span>Break time / hours</span>{employee ? <strong>{salaryConfig.breakHours} hour</strong> : <input type="number" min="0" step="0.5" value={salaryConfig.breakHours} onChange={event => updateSalary('breakHours', event.target.value)} />}</label></div>{!employee && <><div className="salary-rule-grid"><label>Basic %<input type="number" value={salaryConfig.basicPercent} onChange={event => updateSalary('basicPercent', event.target.value)} /></label><label>HRA % of Basic<input type="number" value={salaryConfig.hraPercentOfBasic} onChange={event => updateSalary('hraPercentOfBasic', event.target.value)} /></label><label>Standard %<input type="number" step="0.01" value={salaryConfig.standardPercent} onChange={event => updateSalary('standardPercent', event.target.value)} /></label><label>Bonus %<input type="number" step="0.01" value={salaryConfig.bonusPercent} onChange={event => updateSalary('bonusPercent', event.target.value)} /></label><label>LTA %<input type="number" step="0.01" value={salaryConfig.ltaPercent} onChange={event => updateSalary('ltaPercent', event.target.value)} /></label><label>Employee PF %<input type="number" value={salaryConfig.employeePfPercent} onChange={event => updateSalary('employeePfPercent', event.target.value)} /></label><label>Employer PF %<input type="number" value={salaryConfig.employerPfPercent} onChange={event => updateSalary('employerPfPercent', event.target.value)} /></label><label>Professional tax ₹<input type="number" value={salaryConfig.professionalTax} onChange={event => updateSalary('professionalTax', event.target.value)} /></label></div><div className="salary-save-row"><button className="add-employee" onClick={saveSalary}><Check size={17} /> Save salary changes</button>{salarySaved && <span><BadgeCheck size={16} /> Saved for {subject?.name || 'this profile'}</span>}</div></>}<h3 className="salary-subtitle">{employee ? 'Salary components' : 'Calculated salary components'}</h3><div className="salary-rows">{salaryRows.map(([name, amount, formula]) => <div className="salary-row" key={name}><div><strong>{name}</strong><small>{formula}</small></div><span>₹{money(amount)} <small>/ month</small></span></div>)}</div></div><aside className="deduction-card"><span className="metric-icon green"><WalletCards size={19} /></span><h3>Deductions</h3><p>Calculated separately for {subject?.name || 'this employee'}.</p><div><InfoItem label={`Employee PF · ${salaryConfig.employeePfPercent}%`} value={`₹${money(salary.basic * salaryConfig.employeePfPercent / 100)}`} /><InfoItem label={`Employer PF · ${salaryConfig.employerPfPercent}%`} value={`₹${money(salary.basic * salaryConfig.employerPfPercent / 100)}`} /><InfoItem label="Professional tax" value={`₹${money(salaryConfig.professionalTax)}`} /></div><div className="net-salary"><span>Estimated net salary</span><strong>₹{money(wage - salary.basic * salaryConfig.employeePfPercent / 100 - salaryConfig.professionalTax)}</strong><small>Before other statutory deductions</small></div></aside></section>}

        {tab === 'security' && <section className="security-grid"><article className="profile-section"><div className="section-heading"><div><span>ACCOUNT</span><h3>Password & security</h3></div></div><div className="security-row"><div className="metric-icon"><KeyRound size={19} /></div><div><strong>Password</strong><p>Last changed 32 days ago</p></div><button className="outline-button">Change password</button></div><div className="security-row"><div className="metric-icon green"><ShieldCheck size={19} /></div><div><strong>Two-step verification</strong><p>Add an extra layer of protection</p></div><button className="outline-button">Enable</button></div></article></section>}
      </section>
      {editOpen && <div className="drawer-backdrop modal-center" onMouseDown={() => setEditOpen(false)}><form className="request-modal profile-edit-modal" onSubmit={saveProfile} onMouseDown={event => event.stopPropagation()}><button type="button" className="drawer-close" onClick={() => setEditOpen(false)}><X size={19} /></button><span className="dashboard-eyebrow">EDIT PROFILE</span><h2>Update profile details</h2><p>Changes are saved locally for this frontend demonstration.</p><div className="field-grid"><Field label="Full name" icon={UserRound} value={profileData.name} onChange={event => updateProfile('name', event.target.value)} required /><Field label="Work email" icon={Mail} type="email" value={profileData.email} onChange={event => updateProfile('email', event.target.value)} required /><Field label="Phone" icon={Phone} value={profileData.phone} onChange={event => updateProfile('phone', event.target.value)} required /><Field label="Job title" icon={Building2} value={profileData.jobTitle} onChange={event => updateProfile('jobTitle', event.target.value)} required /><Field label="Department" icon={Users} value={profileData.department} onChange={event => updateProfile('department', event.target.value)} required /><Field label="Manager" icon={UserRound} value={profileData.manager} onChange={event => updateProfile('manager', event.target.value)} required /><Field label="Location" icon={MapPin} value={profileData.location} onChange={event => updateProfile('location', event.target.value)} required /><Field label="Personal email" icon={Mail} type="email" value={profileData.personalEmail} onChange={event => updateProfile('personalEmail', event.target.value)} /></div><label className="field"><span>Residential address</span><textarea value={profileData.address} onChange={event => updateProfile('address', event.target.value)} /></label><label className="field"><span>About me</span><textarea value={profileData.about} onChange={event => updateProfile('about', event.target.value)} /></label><label className="field"><span>What I love about my job</span><textarea value={profileData.jobLove} onChange={event => updateProfile('jobLove', event.target.value)} /></label><label className="field"><span>Interests and hobbies</span><textarea value={profileData.interests} onChange={event => updateProfile('interests', event.target.value)} /></label><div className="field-grid"><Field label="Bank name" icon={Building2} value={profileData.bankName} onChange={event => updateProfile('bankName', event.target.value)} /><Field label="Account number" icon={WalletCards} value={profileData.accountNumber} onChange={event => updateProfile('accountNumber', event.target.value)} /></div><button className="primary-button" type="submit">Save profile changes <Check size={17} /></button>{profileSaved && <div className="demo-message"><BadgeCheck size={17} /> Profile updated successfully.</div>}</form></div>}
    </main>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, Building2, CalendarDays, Check, Clock3, KeyRound, Mail, MapPin, Pencil, Phone, Plus, ShieldCheck, UserRound, Users, WalletCards, X } from 'lucide-react';
import dayflowLogo from '../../../images/DayflowLogo.png';
import { Field, InfoItem } from '../../components/common/UI.jsx';
import { apiRequest, readSession, toInitials } from '../../services/api.js';

const defaultSalaryConfig = { monthlyWage: 0, workingDays: 5, breakHours: 1, basicPercent: 50, hraPercentOfBasic: 50, standardPercent: 8.33, bonusPercent: 4.17, ltaPercent: 4.17, employeePfPercent: 12, employerPfPercent: 12, professionalTax: 200 };

const emptyProfile = (sessionUser = {}) => ({
  name: sessionUser.name || 'Dayflow user',
  email: sessionUser.email || '',
  phone: '',
  jobTitle: sessionUser.role === 'hr' ? 'HR Administrator' : 'Employee',
  department: 'Team',
  manager: '-',
  location: 'Chennai, India',
  about: '',
  jobLove: '',
  interests: '',
  address: '',
  personalEmail: '',
  bankName: '',
  accountNumber: '',
  dateOfBirth: '',
  nationality: '',
  gender: '',
  maritalStatus: '',
  joiningDate: '',
  employeeCode: '',
  bankIfsc: '',
  panNo: '',
  uanNo: '',
});

const mapProfile = (data, fallback) => {
  const name = `${data.first_name || ''} ${data.last_name || ''}`.trim() || fallback.name;
  return {
    ...fallback,
    name,
    email: data.email || fallback.email,
    phone: String(data.phone || fallback.phone || '').replace(/^\+91\s*/, ''),
    jobTitle: data.job_title || fallback.jobTitle,
    department: data.department_name || fallback.department,
    manager: data.manager_name || fallback.manager,
    location: data.location || fallback.location,
    about: data.about_me || fallback.about,
    jobLove: data.job_passion || fallback.jobLove,
    interests: data.interests || fallback.interests,
    address: data.address || fallback.address,
    personalEmail: data.personal_email || fallback.personalEmail,
    bankName: data.bank_name || fallback.bankName,
    accountNumber: data.bank_account_no || fallback.accountNumber,
    dateOfBirth: data.date_of_birth || fallback.dateOfBirth,
    nationality: data.nationality || fallback.nationality,
    gender: data.gender || fallback.gender,
    maritalStatus: data.marital_status || fallback.maritalStatus,
    joiningDate: data.joining_date || fallback.joiningDate,
    employeeCode: data.employee_id || fallback.employeeCode,
    bankIfsc: data.bank_ifsc || fallback.bankIfsc,
    panNo: data.pan_no || fallback.panNo,
    uanNo: data.uan_no || fallback.uanNo,
  };
};

const formatDate = (value) => value ? new Date(value).toLocaleDateString('en-GB') : '-';

export function Profile({ employee = false }) {
  const navigate = useNavigate();
  const { employeeId } = useParams();
  const session = readSession();
  const isManagedEmployee = Boolean(employeeId);
  const [tab, setTab] = useState('resume');
  const [profileData, setProfileData] = useState(() => emptyProfile(session?.user));
  const [profileRecord, setProfileRecord] = useState(null);
  const isOwnProfile = profileRecord ? Number(profileRecord.user_id) === Number(session?.user?.id) : !employeeId;
  const canEditSalary = isManagedEmployee && !isOwnProfile;
  const [editOpen, setEditOpen] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState('');
  const [companyLogo, setCompanyLogo] = useState(dayflowLogo);
  const [companyName, setCompanyName] = useState('Dayflow Technologies');
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    const fallback = emptyProfile(session?.user);
    const endpoint = employeeId ? `/api/employees/${employeeId}` : '/api/employees/me';
    apiRequest(endpoint)
      .then((data) => {
        setProfileRecord(data);
        setProfileData(mapProfile(data, fallback));
        setProfilePhoto(data.profile_picture || '');
        setProfileError('');
      })
      .catch((error) => setProfileError(error.message));
  }, [employeeId]);

  useEffect(() => {
    apiRequest('/api/company/me')
      .then(data => {
        setCompanyName(data.company?.name || 'Dayflow Technologies');
        setCompanyLogo(data.company?.logo_path || dayflowLogo);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const endpoint = employeeId ? '/api/payroll' : '/api/payroll/me';
    apiRequest(endpoint)
      .then((data) => {
        const records = data.payrollList || (data.payroll ? [data.payroll] : []);
        const current = employeeId ? records.find(item => String(item.employeeIdPk || item.employee_id || '') === String(employeeId)) : records[0];
        if (!current) return;
        const basic = Number(current.basic_salary || 0);
        const allowances = Number(current.allowances || 0);
        const deductions = Number(current.deductions || 0);
        const net = Number(current.net_salary || basic + allowances - deductions);
        const monthlyWage = Math.max(0, basic + allowances);
        setSalaryConfig(cfg => ({
          ...cfg,
          monthlyWage: monthlyWage || net || cfg.monthlyWage,
          professionalTax: deductions || cfg.professionalTax,
        }));
      })
      .catch(() => {});
  }, [employeeId]);

  const updateProfile = (field, value) => setProfileData(current => ({ ...current, [field]: value }));

  const saveProfile = async (event) => {
    event.preventDefault();
    const [firstName, ...lastParts] = profileData.name.trim().split(/\s+/);
    const payload = {
      first_name: firstName,
      last_name: lastParts.join(' '),
      phone: profileData.phone,
      address: profileData.address,
      department: profileData.department,
      job_title: profileData.jobTitle,
      joining_date: profileRecord?.joining_date || new Date().toISOString().slice(0, 10),
      manager_name: profileData.manager,
      location: profileData.location,
      about_me: profileData.about,
      job_passion: profileData.jobLove,
      interests: profileData.interests,
      personal_email: profileData.personalEmail,
      bank_name: profileData.bankName,
      bank_account_no: profileData.accountNumber,
      bank_ifsc: profileData.bankIfsc,
      pan_no: profileData.panNo,
      uan_no: profileData.uanNo,
    };
    const endpoint = employeeId ? `/api/employees/${employeeId}` : '/api/employees/me';
    try {
      await apiRequest(endpoint, { method: 'PUT', body: JSON.stringify(payload) });
      setProfileSaved(true);
      setTimeout(() => { setEditOpen(false); setProfileSaved(false); }, 700);
    } catch (error) {
      setProfileError(error.message);
    }
  };

  const previewFile = async (event, setter) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setter(URL.createObjectURL(file));
    const form = new FormData();
    const isProfilePhoto = setter === setProfilePhoto;
    form.append(isProfilePhoto ? 'profile_picture' : 'company_logo', file);
    const endpoint = isProfilePhoto
      ? (employeeId ? `/api/employees/${employeeId}/profile-picture` : '/api/employees/me/profile-picture')
      : '/api/company/logo';
    try {
      const result = await apiRequest(endpoint, { method: 'PUT', body: form });
      setter(isProfilePhoto ? result.profilePicture : result.logoPath);
      setProfileError('');
    } catch (error) {
      setProfileError(error.message);
    }
  };

  const [salaryConfig, setSalaryConfig] = useState(() => ({ ...defaultSalaryConfig }));
  const [salarySaved, setSalarySaved] = useState(false);
  const updateSalary = (field, value) => { setSalarySaved(false); setSalaryConfig(current => ({ ...current, [field]: Number(value) })); };
  const saveSalary = async () => {
    if (!employeeId) return;
    try {
      await apiRequest(`/api/payroll/${employeeId}`, {
        method: 'PUT',
        body: JSON.stringify({
          basic_salary: salary.basic,
          allowances: salary.hra + salary.standard + salary.bonus + salary.lta + salary.fixed,
          deductions: salary.basic * salaryConfig.employeePfPercent / 100 + salaryConfig.professionalTax,
        }),
      });
      setSalarySaved(true);
    } catch (error) {
      setProfileError(error.message);
    }
  };
  const wage = salaryConfig.monthlyWage;
  const formatMoney = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.max(0, value || 0));
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
        <div className="nav-actions"><button className="profile-button"><span>{toInitials(profileData.name)}</span><span className="profile-name"><strong>{profileData.name}</strong><small>{profileData.jobTitle}</small></span></button></div>
      </header>

      <section className="profile-content">
        <button className="back-link" onClick={() => navigate(employee ? '/employee-dashboard' : '/dashboard')}><ArrowLeft size={17} /> Back to {employee ? 'dashboard' : 'employees'}</button>
        <div className="profile-title"><div><span className="dashboard-eyebrow">{isManagedEmployee ? 'EMPLOYEE PROFILE' : 'MY PROFILE'}</span><h1>{isManagedEmployee ? `${profileData.name}'s workspace` : 'Personal workspace'}</h1><p>{isManagedEmployee ? 'Review employee details and manage their individual salary structure.' : 'Manage your professional details, private information and salary structure.'}</p></div><div className="profile-title-actions">{!employee && !isManagedEmployee && <label className="outline-button upload-button"><Building2 size={16} /> Upload company logo<input type="file" accept="image/*" onChange={event => previewFile(event, setCompanyLogo)} /></label>}<button className="outline-button" onClick={() => setEditOpen(true)}><Pencil size={16} /> Edit profile</button></div></div>
        {profileError && <div className="error-message">{profileError}</div>}

        <section className="profile-hero-card">
          <label className={`profile-photo ${profilePhoto ? 'has-photo' : ''}`}>{profilePhoto ? <img src={profilePhoto} alt={`${profileData.name} profile`} /> : toInitials(profileData.name)}<span><Pencil size={14} /></span><input type="file" accept="image/*" onChange={event => previewFile(event, setProfilePhoto)} /></label>
          <div className="profile-identity"><span className="role-pill">{profileData.jobTitle}</span><h2>{profileData.name}</h2><p><Mail size={15} /> {profileData.email} <span>|</span> <Phone size={15} /> +91 {profileData.phone}</p></div>
          <div className="profile-company"><InfoItem label="Company" value={companyName} /><InfoItem label="Department" value={profileData.department} /><InfoItem label="Manager" value={profileData.manager} /><InfoItem label="Location" value={profileData.location} /></div>
          {!employee && !isManagedEmployee && <div className="company-logo-preview"><img src={companyLogo} alt="Company logo preview" /><div><span>COMPANY LOGO</span><strong>{companyName}</strong><small>Use the upload button above to replace it.</small></div></div>}
        </section>

        <div className="profile-tabs">
          {[['resume', 'Resume'], ['private', 'Private info'], ['salary', 'Salary info'], ['security', 'Security']].map(([key, label]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{key === 'salary' && <WalletCards size={16} />}{label}{key === 'salary' && !employee && <small>Admin</small>}</button>)}
        </div>

        {tab === 'resume' && <section className="profile-tab-grid">
          <article className="profile-section about-section"><div className="section-heading"><div><span>PROFILE</span><h3>About me</h3></div><button onClick={() => setEditOpen(true)}><Pencil size={15} /></button></div><p>{profileData.about || 'No profile summary added yet.'}</p><div className="resume-block"><h4>What I love about my job</h4><p>{profileData.jobLove || '-'}</p></div><div className="resume-block"><h4>Interests & hobbies</h4><p>{profileData.interests || '-'}</p></div></article>
          <div className="profile-side-stack"><article className="profile-section"><div className="section-heading"><div><span>EXPERTISE</span><h3>Skills</h3></div><button><Plus size={16} /></button></div><div className="tag-list">{(profileRecord?.skills?.length ? profileRecord.skills : ['Add skills']).map(skill => <span key={skill}>{skill}</span>)}</div></article><article className="profile-section"><div className="section-heading"><div><span>LEARNING</span><h3>Certifications</h3></div><button><Plus size={16} /></button></div><div className="certificate"><BadgeCheck size={21} /><div><strong>{profileRecord?.certifications?.[0]?.name || 'No certification added'}</strong><p>{profileRecord?.certifications?.[0]?.issuer || '-'}</p></div></div></article></div>
        </section>}

        {tab === 'private' && <section className="private-grid"><article className="profile-section"><div className="section-heading"><div><span>PERSONAL</span><h3>Private information</h3></div><button onClick={() => setEditOpen(true)}><Pencil size={15} /></button></div><div className="info-list"><InfoItem label="Date of birth" value={formatDate(profileData.dateOfBirth)} /><InfoItem label="Residential address" value={profileData.address || '-'} /><InfoItem label="Nationality" value={profileData.nationality || '-'} /><InfoItem label="Personal email" value={profileData.personalEmail || '-'} /><InfoItem label="Gender" value={profileData.gender || '-'} /><InfoItem label="Marital status" value={profileData.maritalStatus || '-'} /><InfoItem label="Date of joining" value={formatDate(profileData.joiningDate)} /></div></article><article className="profile-section"><div className="section-heading"><div><span>PAYMENTS</span><h3>Bank details</h3></div><button onClick={() => setEditOpen(true)}><Pencil size={15} /></button></div><div className="info-list"><InfoItem label="Account number" value={profileData.accountNumber || '-'} /><InfoItem label="Bank name" value={profileData.bankName || '-'} /><InfoItem label="IFSC code" value={profileData.bankIfsc || '-'} /><InfoItem label="PAN number" value={profileData.panNo || '-'} /><InfoItem label="UAN number" value={profileData.uanNo || '-'} /><InfoItem label="Employee code" value={profileData.employeeCode || '-'} /></div></article></section>}

        {tab === 'salary' && <section className={`salary-layout ${employee ? 'read-only-salary' : ''}`}><div className="salary-main"><div className="salary-header"><div><span className="dashboard-eyebrow">{canEditSalary ? `ADMIN ONLY | ${profileData.name || 'EMPLOYEE'}` : 'READ ONLY'}</span><h2>Salary information</h2><p>{canEditSalary ? 'Every value below belongs only to this employee.' : 'Review your current wage, salary components and deductions.'}</p></div><ShieldCheck size={25} /></div><div className="wage-grid editable-wage-grid"><label><span>Monthly wage</span>{canEditSalary ? <div><span>{'\u20B9'}</span><input type="number" min="0" value={wage} onChange={event => updateSalary('monthlyWage', event.target.value)} /></div> : <strong>{formatMoney(wage)}</strong>}</label><label><span>Yearly wage</span><strong>{formatMoney(wage * 12)}</strong></label><label><span>Working days / week</span>{canEditSalary ? <input type="number" min="1" max="7" value={salaryConfig.workingDays} onChange={event => updateSalary('workingDays', event.target.value)} /> : <strong>{salaryConfig.workingDays} days</strong>}</label><label><span>Break time / hours</span>{canEditSalary ? <input type="number" min="0" step="0.5" value={salaryConfig.breakHours} onChange={event => updateSalary('breakHours', event.target.value)} /> : <strong>{salaryConfig.breakHours} hour</strong>}</label></div>{canEditSalary && <><div className="salary-rule-grid"><label>Basic %<input type="number" value={salaryConfig.basicPercent} onChange={event => updateSalary('basicPercent', event.target.value)} /></label><label>HRA % of Basic<input type="number" value={salaryConfig.hraPercentOfBasic} onChange={event => updateSalary('hraPercentOfBasic', event.target.value)} /></label><label>Standard %<input type="number" step="0.01" value={salaryConfig.standardPercent} onChange={event => updateSalary('standardPercent', event.target.value)} /></label><label>Bonus %<input type="number" step="0.01" value={salaryConfig.bonusPercent} onChange={event => updateSalary('bonusPercent', event.target.value)} /></label><label>LTA %<input type="number" step="0.01" value={salaryConfig.ltaPercent} onChange={event => updateSalary('ltaPercent', event.target.value)} /></label><label>Employee PF %<input type="number" value={salaryConfig.employeePfPercent} onChange={event => updateSalary('employeePfPercent', event.target.value)} /></label><label>Employer PF %<input type="number" value={salaryConfig.employerPfPercent} onChange={event => updateSalary('employerPfPercent', event.target.value)} /></label><label>Professional tax <span>{'\u20B9'}</span><input type="number" value={salaryConfig.professionalTax} onChange={event => updateSalary('professionalTax', event.target.value)} /></label></div><div className="salary-save-row"><button className="add-employee" onClick={saveSalary}><Check size={17} /> Save salary changes</button>{salarySaved && <span><BadgeCheck size={16} /> Saved for {profileData.name || 'this profile'}</span>}</div></>}<h3 className="salary-subtitle">{canEditSalary ? 'Calculated salary components' : 'Salary components'}</h3><div className="salary-rows">{salaryRows.map(([name, amount, formula]) => <div className="salary-row" key={name}><div><strong>{name}</strong><small>{formula}</small></div><span>{formatMoney(amount)} <small>/ month</small></span></div>)}</div></div><aside className="deduction-card"><span className="metric-icon green"><WalletCards size={19} /></span><h3>Deductions</h3><p>Calculated separately for {profileData.name || 'this employee'}.</p><div><InfoItem label={`Employee PF | ${salaryConfig.employeePfPercent}%`} value={formatMoney(salary.basic * salaryConfig.employeePfPercent / 100)} /><InfoItem label={`Employer PF | ${salaryConfig.employerPfPercent}%`} value={formatMoney(salary.basic * salaryConfig.employerPfPercent / 100)} /><InfoItem label="Professional tax" value={formatMoney(salaryConfig.professionalTax)} /></div><div className="net-salary"><span>Estimated net salary</span><strong>{formatMoney(wage - salary.basic * salaryConfig.employeePfPercent / 100 - salaryConfig.professionalTax)}</strong><small>Before other statutory deductions</small></div></aside></section>}

        {tab === 'security' && <section className="security-grid"><article className="profile-section"><div className="section-heading"><div><span>ACCOUNT</span><h3>Password & security</h3></div></div><div className="security-row"><div className="metric-icon"><KeyRound size={19} /></div><div><strong>Password</strong><p>{profileRecord?.must_change_password ? 'Password change required' : 'Password is active'}</p></div><button className="outline-button">Change password</button></div><div className="security-row"><div className="metric-icon green"><ShieldCheck size={19} /></div><div><strong>Two-step verification</strong><p>Add an extra layer of protection</p></div><button className="outline-button">Enable</button></div></article></section>}
      </section>
      {editOpen && <div className="drawer-backdrop modal-center" onMouseDown={() => setEditOpen(false)}><form className="request-modal profile-edit-modal" onSubmit={saveProfile} onMouseDown={event => event.stopPropagation()}><button type="button" className="drawer-close" onClick={() => setEditOpen(false)}><X size={19} /></button><span className="dashboard-eyebrow">EDIT PROFILE</span><h2>Update profile details</h2><p>Changes are saved to the employee profile when the backend is available.</p><div className="field-grid"><Field label="Full name" icon={UserRound} value={profileData.name} onChange={event => updateProfile('name', event.target.value)} required /><Field label="Work email" icon={Mail} type="email" value={profileData.email} onChange={event => updateProfile('email', event.target.value)} required /><Field label="Phone" icon={Phone} value={profileData.phone} onChange={event => updateProfile('phone', event.target.value)} required /><Field label="Job title" icon={Building2} value={profileData.jobTitle} onChange={event => updateProfile('jobTitle', event.target.value)} required /><Field label="Department" icon={Users} value={profileData.department} onChange={event => updateProfile('department', event.target.value)} required /><Field label="Manager" icon={UserRound} value={profileData.manager} onChange={event => updateProfile('manager', event.target.value)} required /><Field label="Location" icon={MapPin} value={profileData.location} onChange={event => updateProfile('location', event.target.value)} required /><Field label="Personal email" icon={Mail} type="email" value={profileData.personalEmail} onChange={event => updateProfile('personalEmail', event.target.value)} /></div><label className="field"><span>Residential address</span><textarea value={profileData.address} onChange={event => updateProfile('address', event.target.value)} /></label><label className="field"><span>About me</span><textarea value={profileData.about} onChange={event => updateProfile('about', event.target.value)} /></label><label className="field"><span>What I love about my job</span><textarea value={profileData.jobLove} onChange={event => updateProfile('jobLove', event.target.value)} /></label><label className="field"><span>Interests and hobbies</span><textarea value={profileData.interests} onChange={event => updateProfile('interests', event.target.value)} /></label><div className="field-grid"><Field label="Bank name" icon={Building2} value={profileData.bankName} onChange={event => updateProfile('bankName', event.target.value)} /><Field label="Account number" icon={WalletCards} value={profileData.accountNumber} onChange={event => updateProfile('accountNumber', event.target.value)} /></div><button className="primary-button" type="submit">Save profile changes <Check size={17} /></button>{profileSaved && <div className="demo-message"><BadgeCheck size={17} /> Profile updated successfully.</div>}</form></div>}
    </main>
  );
}

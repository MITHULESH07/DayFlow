import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BadgeCheck, Building2, Check, Eye, EyeOff, KeyRound, LockKeyhole, Mail, Phone, ShieldCheck, UserRound } from 'lucide-react';
import dayflowLogo from '../../../images/DayflowLogo.png';
import { apiRequest, saveSession } from '../../services/api.js';
import { Field } from '../../components/common/UI.jsx';

function BrandPanel({ signup = false }) {
  return (
    <aside className="brand-panel">
      <div className="brand"><span className="brand-mark"><img src={dayflowLogo} alt="Dayflow logo" /></span>dayflow</div>
      <div className="brand-copy">
        <span className="eyebrow">{signup ? 'PEOPLE, NOT PAPERWORK' : 'YOUR WORKDAY, ALIGNED'}</span>
        <h1>{signup ? <>Grow the team.<br /><em>Keep it human.</em></> : <>A calmer way<br />to run <em>work.</em></>}</h1>
        <p>{signup ? 'Create your HR workspace, then bring your team together.' : 'One clean place for your people, attendance and time off.'}</p>
      </div>
      <div className="proof-card"><div className="avatar-stack"><span>HR</span><span>TM</span><span>DF</span><b>+</b></div><p><strong>{signup ? 'Made for HR teams' : 'Everyone in sync'}</strong><br />Simple, secure and ready for the day.</p></div>
      <span className="orb orb-one" /><span className="orb orb-two" />
    </aside>
  );
}

export function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setSubmitted(false);
    setLoginError('');
    try {
      const result = await apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify({ identifier, password }) });
      const session = { token: result.data.token, user: result.data.user };
      saveSession(session);
      setSubmitted(true);
      navigate(session.user.mustChangePassword ? '/change-password' : (session.user.role === 'hr' ? '/dashboard' : '/employee-dashboard'));
    } catch (error) {
      setLoginError(error.message || 'Invalid login ID/email or password');
    }
  };

  return (
    <main className="auth-shell"><BrandPanel /><section className="form-panel"><div className="form-container"><div className="mobile-brand"><span className="brand-mark"><img src={dayflowLogo} alt="Dayflow logo" /></span>dayflow</div><div className="form-heading"><h2>Welcome back</h2><p>HR and employees can sign in to their workspace here.</p></div><form onSubmit={submit}><Field label="Login ID or email" icon={Mail} placeholder="e.g. employee@company.com" autoComplete="username" value={identifier} onChange={event => setIdentifier(event.target.value)} required /><Field label="Password" icon={LockKeyhole} type={showPassword ? 'text' : 'password'} placeholder="Enter your password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required trailing={<button className="icon-button" type="button" aria-label="Toggle password visibility" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>} /><div className="form-options"><label className="checkbox"><input type="checkbox" /><span><Check size={13} /></span>Keep me signed in</label><a href="mailto:hr@dayflow.com">Forgot password?</a></div><button className="primary-button" type="submit">Sign in <ArrowRight size={18} /></button>{loginError && <div className="error-message">{loginError}</div>}{submitted && <div className="demo-message"><BadgeCheck size={18} /> Signed in successfully.</div>}</form><div className="hr-entry"><span><ShieldCheck size={18} /></span><p><strong>New HR administrator?</strong><br />Create your company workspace.</p><Link to="/signup" aria-label="Create an HR account"><ArrowRight size={18} /></Link></div><p className="footer-copy">Protected by Dayflow security | Privacy</p></div></section></main>
  );
}

export function Signup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [created, setCreated] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) { setError('Passwords do not match. Please check and try again.'); setCreated(false); return; }
    const form = new FormData(event.currentTarget);
    setError(''); setCreated(false);
    try {
      const result = await apiRequest('/api/auth/signup', { method: 'POST', body: JSON.stringify({ name: form.get('name'), email: form.get('email'), companyName: form.get('companyName'), phone: form.get('phone'), password }) });
      saveSession({ token: result.data.token, user: result.data.user, company: result.data.company });
      setCreated(true);
      navigate('/dashboard');
    } catch (error) { setError(error.message || 'Could not create HR account.'); }
  };

  return <main className="auth-shell signup-shell"><BrandPanel signup /><section className="form-panel signup-panel"><div className="form-container wide"><button className="back-link" type="button" onClick={() => navigate('/login')}><ArrowLeft size={17} /> Back to sign in</button><div className="form-heading compact"><div className="heading-line"><span className="mini-icon"><Building2 size={22} /></span><span className="access-pill"><ShieldCheck size={14} /> HR registration</span></div><h2>Create your HR account</h2><p>Register your company workspace. You can add employees after signing in.</p></div><form onSubmit={submit}><div className="field-grid"><Field name="name" label="HR administrator name" icon={UserRound} placeholder="Full name" required /><Field name="email" label="Work email" icon={Mail} type="email" placeholder="name@company.com" required /><Field name="companyName" label="Company" icon={Building2} placeholder="Company name" required /><Field name="phone" label="Phone number" icon={Phone} type="tel" placeholder="Your phone number" required /></div><Field label="Password" icon={KeyRound} type={showPassword ? 'text' : 'password'} placeholder="Minimum 8 characters" minLength="8" value={password} onChange={(event) => setPassword(event.target.value)} required trailing={<button className="icon-button" type="button" aria-label="Toggle password visibility" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>} /><Field label="Confirm password" icon={LockKeyhole} type={showPassword ? 'text' : 'password'} placeholder="Enter the password again" minLength="8" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /><label className="checkbox consent"><input type="checkbox" required /><span><Check size={13} /></span>I confirm that I am authorized to create this company workspace.</label><button className="primary-button" type="submit">Create HR account <ArrowRight size={18} /></button>{error && <div className="error-message">{error}</div>}{created && <div className="demo-message"><BadgeCheck size={18} /> HR workspace created successfully.</div>}</form><p className="security-note"><ShieldCheck size={16} /> Employee signup is not available. HR will add employees after login.</p></div></section></main>;
}

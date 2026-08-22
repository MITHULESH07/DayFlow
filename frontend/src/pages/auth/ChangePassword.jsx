import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Check, Eye, EyeOff, KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Field } from '../../components/common/UI.jsx';
import { apiRequest, readSession, saveSession } from '../../services/api.js';
import dayflowLogo from '../../../images/DayflowLogo.png';

export function ChangePassword() {
  const navigate = useNavigate();
  const session = readSession();
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSaved(false);
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    try {
      await apiRequest('/api/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const nextSession = {
        ...session,
        user: { ...session.user, mustChangePassword: false },
      };
      saveSession(nextSession);
      setSaved(true);
      navigate(nextSession.user.role === 'hr' ? '/dashboard' : '/employee-dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Could not change password.');
    }
  };

  return (
    <main className="auth-shell password-shell">
      <aside className="brand-panel">
        <div className="brand"><span className="brand-mark"><img src={dayflowLogo} alt="Dayflow logo" /></span>dayflow</div>
        <div className="brand-copy"><span className="eyebrow">FIRST SIGN-IN</span><h1>Secure your<br /><em>account.</em></h1><p>Set a private password before entering your workspace.</p></div>
      </aside>
      <section className="form-panel">
        <div className="form-container">
          <div className="mobile-brand"><span className="brand-mark"><img src={dayflowLogo} alt="Dayflow logo" /></span>dayflow</div>
          <div className="form-heading"><span className="mini-icon"><ShieldCheck size={22} /></span><h2>Change password</h2><p>Your temporary password must be replaced before you continue.</p></div>
          <form onSubmit={submit}>
            <Field label="Current temporary password" icon={LockKeyhole} type={showPassword ? 'text' : 'password'} value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} required />
            <Field label="New password" icon={KeyRound} type={showPassword ? 'text' : 'password'} minLength="6" value={newPassword} onChange={event => setNewPassword(event.target.value)} required />
            <Field label="Confirm new password" icon={LockKeyhole} type={showPassword ? 'text' : 'password'} minLength="6" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} required trailing={<button className="icon-button" type="button" aria-label="Toggle password visibility" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>} />
            <button className="primary-button" type="submit">Update password <ArrowRight size={18} /></button>
            {error && <div className="error-message">{error}</div>}
            {saved && <div className="demo-message"><BadgeCheck size={18} /> Password updated.</div>}
          </form>
        </div>
      </section>
    </main>
  );
}

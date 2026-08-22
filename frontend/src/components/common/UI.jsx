import { Plane } from 'lucide-react';

export const Field = ({ label, icon: Icon, type = 'text', trailing, ...props }) => (
  <label className="field">
    <span>{label}</span>
    <div className="input-wrap">
      <Icon size={18} aria-hidden="true" />
      <input type={type} {...props} />
      {trailing}
    </div>
  </label>
);


export const StatusMark = ({ status }) => (
  <span className={`status-mark ${status}`} title={status === 'leave' ? 'On leave' : status}>
    {status === 'leave' && <Plane size={11} />}
  </span>
);


export const InfoItem = ({ label, value }) => <div className="info-item"><span>{label}</span><strong>{value}</strong></div>;

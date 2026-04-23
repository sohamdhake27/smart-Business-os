import React, { useMemo, useState } from 'react';
import { Bell, Save, Shield, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

const CURRENCIES = [
  { value: 'INR', label: 'Indian Rupee' },
  { value: 'USD', label: 'US Dollar' },
  { value: 'EUR', label: 'Euro' }
];

const Settings = () => {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    businessName: user?.businessName || '',
    businessType: user?.businessType || 'general',
    currency: user?.currency || 'INR'
  });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const roleDescription = useMemo(() => ({
    admin: 'Full access to settings, transactions, and user management',
    staff: 'Can add and edit operational data',
    viewer: 'Read-only access for reports and dashboards'
  }[user?.role || 'admin']), [user?.role]);

  const handleProfile = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await updateUser(form);
    } finally {
      setLoading(false);
    }
  };

  const handlePassword = async (event) => {
    event.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) return toast.error('Passwords do not match');
    if (passForm.newPassword.length < 6) return toast.error('Password must be at least 6 characters');

    setLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      toast.success('Password changed');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeInUp max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Manage your account, role access, and interface preferences</p>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <User size={18} style={{ color: 'var(--accent)' }} />
          <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Profile Settings</h2>
        </div>
        <form onSubmit={handleProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
              <input type="text" className="input-field" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Business Name</label>
              <input type="text" className="input-field" value={form.businessName} onChange={(event) => setForm((prev) => ({ ...prev, businessName: event.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Business Type</label>
              <select className="input-field" value={form.businessType} onChange={(event) => setForm((prev) => ({ ...prev, businessType: event.target.value }))}>
                {['general', 'shop', 'gym', 'clinic', 'restaurant', 'freelance', 'other'].map((type) => <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Currency</label>
              <select className="input-field" value={form.currency} onChange={(event) => setForm((prev) => ({ ...prev, currency: event.target.value }))}>
                {CURRENCIES.map((currency) => <option key={currency.value} value={currency.value}>{currency.label}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
            Save Profile
          </button>
        </form>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Shield size={18} style={{ color: 'var(--accent)' }} />
          <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Role-Based Access</h2>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--bg-primary)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Current role: <span className="capitalize">{user?.role || 'admin'}</span></p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{roleDescription}</p>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Bell size={18} style={{ color: 'var(--accent)' }} />
          <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Appearance</h2>
        </div>
        <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--bg-primary)' }}>
          <div>
            <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Dark Mode</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Toggle between light and dark theme</p>
          </div>
          <button onClick={toggleTheme} className="relative w-12 h-6 rounded-full transition-all duration-300" style={{ background: theme === 'dark' ? '#0f766e' : '#cbd5e1' }}>
            <div className="absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300" style={{ left: theme === 'dark' ? '26px' : '4px' }} />
          </button>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Shield size={18} style={{ color: 'var(--accent)' }} />
          <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Change Password</h2>
        </div>
        <form onSubmit={handlePassword} className="space-y-4">
          {['currentPassword', 'newPassword', 'confirmPassword'].map((field) => (
            <div key={field}>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                {field === 'currentPassword' ? 'Current Password' : field === 'newPassword' ? 'New Password' : 'Confirm New Password'}
              </label>
              <input type="password" className="input-field" value={passForm[field]} onChange={(event) => setPassForm((prev) => ({ ...prev, [field]: event.target.value }))} required />
            </div>
          ))}
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Shield size={16} />}
            Change Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;

import React, { useState } from 'react';
import { Save, User, Bell, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', businessName: user?.businessName || '', businessType: user?.businessType || 'general', currency: user?.currency || '₹' });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const handleProfile = async e => {
    e.preventDefault(); setLoading(true);
    try {
      const { data } = await api.put('/auth/profile', form);
      updateUser(data.user);
      toast.success('Profile updated!');
    } finally { setLoading(false); }
  };

  const handlePassword = async e => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) return toast.error('Passwords do not match');
    if (passForm.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      toast.success('Password changed!');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 animate-fadeInUp max-w-2xl">
      <div><h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h1><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Manage your account and preferences</p></div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5"><User size={18} style={{ color: 'var(--accent)' }} /><h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Profile Settings</h2></div>
        <form onSubmit={handleProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Full Name</label><input type="text" className="input-field" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div><label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Business Name</label><input type="text" className="input-field" value={form.businessName} onChange={e => setForm(p => ({ ...p, businessName: e.target.value }))} /></div>
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Business Type</label>
              <select className="input-field" value={form.businessType} onChange={e => setForm(p => ({ ...p, businessType: e.target.value }))}>
                {['general','shop','gym','clinic','restaurant','freelance','other'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Currency</label>
              <select className="input-field" value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}>
                <option value="₹">₹ Indian Rupee</option><option value="$">$ US Dollar</option><option value="€">€ Euro</option><option value="£">£ British Pound</option>
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
        <div className="flex items-center gap-2 mb-5"><Bell size={18} style={{ color: 'var(--accent)' }} /><h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Appearance</h2></div>
        <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--bg-primary)' }}>
          <div><p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Dark Mode</p><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Toggle between light and dark theme</p></div>
          <button onClick={toggleTheme} className="relative w-12 h-6 rounded-full transition-all duration-300" style={{ background: theme === 'dark' ? '#6366f1' : '#cbd5e1' }}>
            <div className="absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300" style={{ left: theme === 'dark' ? '26px' : '4px' }} />
          </button>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5"><Shield size={18} style={{ color: 'var(--accent)' }} /><h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Change Password</h2></div>
        <form onSubmit={handlePassword} className="space-y-4">
          {['currentPassword','newPassword','confirmPassword'].map(field => (
            <div key={field}>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                {field === 'currentPassword' ? 'Current Password' : field === 'newPassword' ? 'New Password' : 'Confirm New Password'}
              </label>
              <input type="password" className="input-field" placeholder="••••••" value={passForm[field]} onChange={e => setPassForm(p => ({ ...p, [field]: e.target.value }))} required />
            </div>
          ))}
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Shield size={16} />}
            Change Password
          </button>
        </form>
      </div>

      <div className="card p-6">
        <h2 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Subscription Plan</h2>
        <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <div>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Current Plan: <span className="capitalize" style={{ color: 'var(--accent)' }}>{user?.subscription?.plan || 'Free'}</span></p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Upgrade to unlock AI predictions & advanced analytics</p>
          </div>
          <button className="btn-primary py-2 text-sm">Upgrade 🚀</button>
        </div>
      </div>
    </div>
  );
};
export default Settings;

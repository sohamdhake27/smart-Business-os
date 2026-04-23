import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Zap, TrendingUp, Shield, Bot } from 'lucide-react';
import toast from 'react-hot-toast';

const BUSINESS_TYPES = ['general', 'shop', 'gym', 'clinic', 'restaurant', 'freelance'];

const AuthPage = () => {
  const [mode, setMode] = useState('login');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', businessName: '', businessType: 'general' });
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill all fields');
    if (mode === 'register' && !form.name) return toast.error('Name is required');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form);
      navigate('/dashboard');
    } catch {} finally { setLoading(false); }
  };

  const fillDemo = () => { setForm({ ...form, email: 'demo@business.com', password: 'demo1234' }); setMode('login'); toast('Demo credentials filled!', { icon: '🎯' }); };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16" style={{ background: 'linear-gradient(135deg,#0f172a,#1e1b4b,#0f172a)' }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            <Zap size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Smart Business OS</h1>
            <p className="text-sm text-indigo-300">AI-Powered Business Dashboard</p>
          </div>
        </div>
        <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
          Run Your Business
          <span className="block" style={{ background: 'linear-gradient(135deg,#6366f1,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Smarter & Faster
          </span>
        </h2>
        <p className="text-indigo-200 text-lg mb-8">Track sales, manage expenses, get AI insights — all in one place.</p>
        {[{ icon: TrendingUp, text: 'Real-time sales & expense tracking' }, { icon: Bot, text: 'AI-powered business insights' }, { icon: Shield, text: 'Secure multi-user access' }].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(99,102,241,0.2)' }}>
              <Icon size={16} className="text-indigo-400" />
            </div>
            <p className="text-indigo-200 text-sm">{text}</p>
          </div>
        ))}
        <div className="grid grid-cols-3 gap-3 mt-8">
          {[{ label: 'Businesses', value: '2,400+' }, { label: 'Transactions', value: '1M+' }, { label: 'AI Insights', value: '50K+' }].map(s => (
            <div key={s.label} className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-indigo-300">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              <Zap size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Smart Business OS</span>
          </div>

          <div className="card p-8">
            <div className="flex rounded-xl p-1 mb-6" style={{ background: 'var(--bg-primary)' }}>
              {['login', 'register'].map(m => (
                <button key={m} onClick={() => setMode(m)} className="flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all"
                  style={mode === m ? { background: 'var(--bg-card)', color: 'var(--accent)', boxShadow: 'var(--shadow-sm)' } : { color: 'var(--text-muted)' }}>
                  {m === 'login' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>

            <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{mode === 'login' ? 'Welcome back!' : 'Create your account'}</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>{mode === 'login' ? 'Sign in to your dashboard' : 'Start managing your business smarter'}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Full Name *</label>
                  <input type="text" name="name" className="input-field" placeholder="John Doe" value={form.name} onChange={handleChange} required />
                </div>
              )}
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email Address *</label>
                <input type="email" name="email" className="input-field" placeholder="you@business.com" value={form.email} onChange={handleChange} required />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password *</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} name="password" className="input-field pr-10" placeholder="Min. 6 characters" value={form.password} onChange={handleChange} required />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {mode === 'register' && (
                <>
                  <div>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Business Name</label>
                    <input type="text" name="businessName" className="input-field" placeholder="My Business" value={form.businessName} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Business Type</label>
                    <select name="businessType" className="input-field" value={form.businessType} onChange={handleChange}>
                      {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                  </div>
                </>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Please wait...</span></> : mode === 'login' ? 'Sign In →' : 'Create Account →'}
              </button>
              {mode === 'login' && (
                <button type="button" onClick={fillDemo} className="w-full py-3 rounded-xl text-sm font-medium border transition-all" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                  🎯 Try Demo Account
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AuthPage;

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, BarChart3, Bot, FileText, Settings, LogOut, Zap, X, Crown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transactions', label: 'Transactions', icon: TrendingUp },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/ai-assistant', label: 'AI Assistant', icon: Bot, badge: 'AI' },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/auth'); };

  return (
    <aside className={`fixed left-0 top-0 h-full w-64 z-30 flex flex-col transition-transform duration-300 sidebar ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm">Smart Business OS</h1>
            <p className="text-xs" style={{ color: '#94a3b8' }}>v1.0</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white"><X size={20} /></button>
      </div>

      <div className="px-4 py-4 mx-4 mt-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ background: 'linear-gradient(135deg,#6366f1,#ec4899)' }}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">{user?.name}</p>
            <p className="text-xs truncate" style={{ color: '#94a3b8' }}>{user?.businessName}</p>
          </div>
          {user?.subscription?.plan !== 'free' && <Crown size={14} className="text-yellow-400" />}
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold uppercase tracking-wider px-3 mb-3" style={{ color: '#64748b' }}>Menu</p>
        {NAV.map(({ path, label, icon: Icon, badge }) => (
          <NavLink key={path} to={path} onClick={onClose}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            style={({ isActive }) => isActive ? { background: 'linear-gradient(135deg,rgba(99,102,241,0.3),rgba(139,92,246,0.2))', borderLeft: '3px solid #6366f1' } : {}}>
            <Icon size={18} />
            <span className="flex-1">{label}</span>
            {badge && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white' }}>{badge}</span>}
          </NavLink>
        ))}
      </nav>

      {user?.subscription?.plan === 'free' && (
        <div className="mx-4 mb-4 p-3 rounded-xl" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
          <p className="text-xs text-white font-semibold mb-1">🚀 Upgrade to Pro</p>
          <p className="text-xs" style={{ color: '#94a3b8' }}>Unlock AI predictions & more</p>
        </div>
      )}

      <div className="px-4 pb-4">
        <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
          <LogOut size={18} /><span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
export default Sidebar;

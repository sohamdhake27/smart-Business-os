import React, { useState, useEffect } from 'react';
import { Bell, Sun, Moon, Menu, Wifi, WifiOff } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useLocation } from 'react-router-dom';
import api from '../../services/api';

const PAGE_TITLES = { '/dashboard': 'Dashboard', '/transactions': 'Transactions', '/analytics': 'Analytics', '/ai-assistant': 'AI Assistant', '/reports': 'Reports', '/settings': 'Settings' };

const Navbar = ({ onMenuClick }) => {
  const { toggleTheme, isDark } = useTheme();
  const { user } = useAuth();
  const { isConnected } = useSocket();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const currentPage = PAGE_TITLES[location.pathname] || 'Dashboard';

  useEffect(() => {
    api.get('/notifications?limit=5').then(res => {
      setNotifications(res.data.data || []);
      setUnreadCount(res.data.unreadCount || 0);
    }).catch(() => {});
  }, []);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
  };

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg" style={{ color: 'var(--text-secondary)' }}>
          <Menu size={20} />
        </button>
        <div>
          <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{currentPage}</h2>
          <p className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>
            {getGreeting()}, {user?.name?.split(' ')[0]} 👋
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: isConnected ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
          {isConnected
            ? <><Wifi size={12} style={{ color: '#10b981' }} /><span style={{ color: '#10b981' }}>Live</span></>
            : <><WifiOff size={12} style={{ color: '#ef4444' }} /><span style={{ color: '#ef4444' }}>Offline</span></>}
        </div>

        <button onClick={toggleTheme} className="p-2 rounded-xl transition-all hover:scale-110"
          style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="relative">
          <button onClick={() => { setShowNotif(!showNotif); if (unreadCount > 0) markAllRead(); }}
            className="p-2 rounded-xl relative" style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 text-xs flex items-center justify-center rounded-full text-white font-bold"
                style={{ background: '#ef4444', fontSize: '10px' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotif && (
            <div className="absolute right-0 top-12 w-80 rounded-2xl border shadow-xl z-50"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="px-4 py-3 border-b flex justify-between" style={{ borderColor: 'var(--border)' }}>
                <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Notifications</span>
                <button className="text-xs" style={{ color: 'var(--accent)' }} onClick={markAllRead}>Mark all read</button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No notifications yet</div>
                ) : notifications.map(n => (
                  <div key={n._id} className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-light)', opacity: n.isRead ? 0.6 : 1 }}>
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
          style={{ background: 'linear-gradient(135deg,#6366f1,#ec4899)' }}>
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
};
export default Navbar;

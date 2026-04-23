import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!isAuthenticated || !token) {
      if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
      return;
    }

    socketRef.current = io(
      (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', ''),
      { auth: { token }, transports: ['websocket', 'polling'], reconnection: true, reconnectionAttempts: 5 }
    );

    const socket = socketRef.current;
    socket.on('connect', () => { setIsConnected(true); socket.emit('subscribe:dashboard'); });
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('notification:new', (notification) => {
      const icons = { warning: '⚠️', error: '🚨', success: '✅', info: 'ℹ️' };
      toast(notification.message, { icon: icons[notification.type] || 'ℹ️', duration: 6000 });
    });

    return () => { if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; setIsConnected(false); } };
  }, [isAuthenticated]);

  const emit = (event, data) => socketRef.current?.emit(event, data);
  const on = (event, callback) => {
    socketRef.current?.on(event, callback);
    return () => socketRef.current?.off(event, callback);
  };

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected, emit, on }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

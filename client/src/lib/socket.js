import { io } from 'socket.io-client';

let socket = null;

export function connectSocket() {
  const url = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
  const token = localStorage.getItem('accessToken');
  if (socket) return socket;
  socket = io(url, { auth: { token }, withCredentials: true, transports: ['websocket', 'polling'] });
  return socket;
}

export function getSocket() {
  return socket;
}

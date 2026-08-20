import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

let ioInstance = null;

export function initSockets(io) {
  ioInstance = io;

  io.use((socket, next) => {
    const cookieHeader = socket.handshake.headers.cookie || '';
    const cookies = parseCookies(cookieHeader);
    const token = cookies.token;

    if (!token) {
      socket.isAdmin = false;
      return next();
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      socket.isAdmin = true;
      socket.adminData = decoded;
      next();
    } catch (err) {
      socket.isAdmin = false;
      next();
    }
  });

  io.on('connection', (socket) => {
    if (socket.isAdmin) {
      socket.join('admin-room');
      console.log(`Socket admin connected: ${socket.id}`);
    } else {
      console.log(`Socket customer/guest connected: ${socket.id}`);
    }

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}

export function emitToAdmin(event, payload) {
  if (ioInstance) {
    ioInstance.to('admin-room').emit(event, payload);
  }
}

function parseCookies(cookieStr) {
  const cookies = {};
  if (!cookieStr) return cookies;

  cookieStr.split(';').forEach(c => {
    const parts = c.split('=');
    const key = parts.shift()?.trim();
    if (key) {
      cookies[key] = parts.join('=').trim();
    }
  });
  return cookies;
}

import { io } from 'socket.io-client';

// In development, target the backend port 8000 directly.
// In production, it can fallback to the current origin host.
const socketUrl = 'http://localhost:8000';

export const socket = io(socketUrl, {
  autoConnect: false, // We connect explicitly when user logs in or page mounts
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 3000
});

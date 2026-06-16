import { io } from 'socket.io-client';

// Use configured environment variable or fallback based on environment
const socketUrl = (import.meta.env.VITE_SOCKET_URL || 
                   import.meta.env.VITE_API_BASE_URL || 
                   (import.meta.env.DEV ? 'http://localhost:8000' : window.location.origin)).trim();

export const socket = io(socketUrl, {
  autoConnect: false, // We connect explicitly when user logs in or page mounts
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 3000
});

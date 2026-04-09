/**
 * services/socket.js
 * Singleton Socket.io client for the whole app.
 * Components use useSocket() hook to subscribe to real-time events.
 */
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:4000';

let socket = null;

export function getSocket() {
    if (!socket) {
        socket = io(SOCKET_URL, {
            transports: ['websocket'],
            autoConnect: false,
        });
    }
    return socket;
}

/**
 * Connect to the socket and join the role-based room.
 * Call this once after login.
 * @param {'scout'|'leader'|'examiner'|'admin'} role
 */
export function connectSocket(role) {
    const s = getSocket();
    if (!s.connected) {
        s.connect();
    }
    s.emit('join', role);
    console.log(`[SOCKET] Connected + joined room: ${role}`);
}

export function disconnectSocket() {
    if (socket && socket.connected) {
        socket.disconnect();
    }
}

export default getSocket;

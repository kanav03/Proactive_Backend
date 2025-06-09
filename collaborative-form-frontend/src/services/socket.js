import { io } from 'socket.io-client';

// Use environment variable for Socket.IO URL or default to localhost for development
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = {};
  }

  connect() {
    if (this.socket) return;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinForm(formId) {
    if (!this.socket) this.connect();
    this.socket.emit('join-form', formId);
  }

  updateField(data) {
    if (!this.socket) return;
    this.socket.emit('update-field', data);
  }

  onFieldUpdated(callback) {
    if (!this.socket) this.connect();
    this.socket.on('field-updated', callback);
    this.listeners['field-updated'] = callback;
  }

  onUserJoined(callback) {
    if (!this.socket) this.connect();
    this.socket.on('user-joined', callback);
    this.listeners['user-joined'] = callback;
  }

  onUserLeft(callback) {
    if (!this.socket) this.connect();
    this.socket.on('user-left', callback);
    this.listeners['user-left'] = callback;
  }

  emitCursorMove(data) {
    if (!this.socket) return;
    this.socket.emit('cursor-move', data);
  }

  onCursorMoved(callback) {
    if (!this.socket) this.connect();
    this.socket.on('cursor-moved', callback);
    this.listeners['cursor-moved'] = callback;
  }

  emitTyping(data) {
    if (!this.socket) return;
    this.socket.emit('typing', data);
  }

  onUserTyping(callback) {
    if (!this.socket) this.connect();
    this.socket.on('user-typing', callback);
    this.listeners['user-typing'] = callback;
  }

  removeAllListeners() {
    if (!this.socket) return;
    
    Object.keys(this.listeners).forEach(event => {
      this.socket.off(event, this.listeners[event]);
    });
    
    this.listeners = {};
  }
}

// Create a singleton instance
const socketService = new SocketService();

export default socketService;

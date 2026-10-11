// src/socket.js 
import { io } from 'socket.io-client';
import { API } from './api';

let socket = null;
let currentToken = null;

export function connectSocket(token) {
  if (socket && currentToken === token) return socket;
  if (socket) socket.disconnect();
  currentToken = token;
  socket = io(API, { auth: { token } });
  return socket;
}

export function disconnectSocket() {
  if (socket) socket.disconnect();
  socket = null;
  currentToken = null;
}

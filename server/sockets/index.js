// server/sockets/index.js
// authenticated Socket.IO: course chat + per-user notification rooms.
// replaces the io.on('connection') block in index.js with registerSockets(io).
import jwt from 'jsonwebtoken';
import Message from '../models/messages.js';

export function registerSockets(io) {
  // only logged-in users may connect lient sends its JWT in the handshake
  io.use((socket, next) => {
    try {
      socket.user = jwt.verify(socket.handshake.auth?.token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const { userId, firstName, lastName, email } = socket.user;
    const senderName = `${firstName ?? ''} ${lastName ?? ''}`.trim() || email || 'Student';

    socket.join(`user:${userId}`); // private room for this users notifications

    socket.on('joinCourse', (course) => {
      const name = String(course || '').trim().slice(0, 40);
      if (name) socket.join(`course:${name}`);
    });

    socket.on('courseMessage', async ({ course, text } = {}) => {
      const room = String(course || '').trim().slice(0, 40);
      const body = String(text || '').trim().slice(0, 500);
      if (!room || !body) return;
      try {
        const saved = await Message.create({ course: room, sender: userId, senderName, text: body });
        io.to(`course:${room}`).emit('courseMessage', {
          _id: saved._id, course: room, text: body, senderName, createdAt: saved.createdAt,
        });
      } catch (err) {
        console.error('Failed to save chat message:', err.message);
      }
    });
  });
}

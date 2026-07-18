import { Server, Socket } from 'socket.io';

// Keep track of room states
interface RoomUsers {
  [roomName: string]: Set<string>;
}

const rooms: RoomUsers = {};

export function registerRoomHandlers(io: Server, socket: Socket) {
  // Join Room
  socket.on('join-room', ({ roomName, userId, userName }) => {
    socket.join(roomName);
    
    if (!rooms[roomName]) {
      rooms[roomName] = new Set();
    }
    rooms[roomName].add(socket.id);

    // Tell everyone else in the room to initialize a WebRTC handshake
    socket.to(roomName).emit('user-joined', {
      socketId: socket.id,
      userId,
      userName,
    });

    // Send the newcomer a list of users already in the room
    const otherUsers = Array.from(rooms[roomName]).filter((id) => id !== socket.id);
    socket.emit('current-room-users', otherUsers);
  });

  // WebRTC Handshake Signaling Relay
  socket.on('webrtc-offer', ({ targetId, offer }) => {
    io.to(targetId).emit('webrtc-offer', { senderId: socket.id, offer });
  });

  socket.on('webrtc-answer', ({ targetId, answer }) => {
    io.to(targetId).emit('webrtc-answer', { senderId: socket.id, answer });
  });

  socket.on('ice-candidate', ({ targetId, candidate }) => {
    io.to(targetId).emit('ice-candidate', { senderId: socket.id, candidate });
  });

  // Real-time shared whiteboard stroke relay
  socket.on('draw-stroke', ({ roomName, strokeData }) => {
    socket.to(roomName).emit('draw-stroke', strokeData);
  });

  // Clean up on disconnect
  socket.on('disconnect', () => {
    for (const roomName in rooms) {
      if (rooms[roomName].has(socket.id)) {
        rooms[roomName].delete(socket.id);
        socket.to(roomName).emit('user-left', socket.id);
        
        if (rooms[roomName].size === 0) {
          delete rooms[roomName];
        }
      }
    }
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
}
const FormResponse = require('../models/response.model');

/**
 * Handle real-time form updates via Socket.IO
 * @param {Object} io - Socket.IO instance
 */
const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Join a form room
    socket.on('join-form', (formId) => {
      socket.join(`form:${formId}`);
      console.log(`User ${socket.id} joined form: ${formId}`);
      
      // Notify others that a new user joined
      socket.to(`form:${formId}`).emit('user-joined', {
        socketId: socket.id,
        timestamp: Date.now()
      });
    });

    // Handle form field updates
    socket.on('update-field', async (data) => {
      try {
        const { responseId, fieldId, value, userId } = data;
        
        // Update the field in the database
        const response = await FormResponse.findById(responseId);
        
        if (response) {
          const fieldIndex = response.fieldValues.findIndex(
            field => field.fieldId === fieldId
          );
          
          if (fieldIndex !== -1) {
            response.fieldValues[fieldIndex].value = value;
            response.fieldValues[fieldIndex].lastUpdatedBy = userId;
            response.fieldValues[fieldIndex].lastUpdatedAt = Date.now();
            
            await response.save();
            
            // Broadcast the update to all clients in the room except sender
            socket.to(`form:${response.form}`).emit('field-updated', {
              responseId,
              fieldId,
              value,
              userId,
              timestamp: Date.now()
            });
          }
        }
      } catch (error) {
        console.error('Socket update-field error:', error);
      }
    });

    // Handle user cursor position (for collaborative editing)
    socket.on('cursor-move', (data) => {
      const { formId, fieldId, position, userId, username } = data;
      
      // Broadcast cursor position to all clients in the room except sender
      socket.to(`form:${formId}`).emit('cursor-moved', {
        fieldId,
        position,
        userId,
        username,
        timestamp: Date.now()
      });
    });

    // Handle user typing indicator
    socket.on('typing', (data) => {
      const { formId, fieldId, userId, username, isTyping } = data;
      
      // Broadcast typing status to all clients in the room except sender
      socket.to(`form:${formId}`).emit('user-typing', {
        fieldId,
        userId,
        username,
        isTyping,
        timestamp: Date.now()
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      // Notify all rooms this socket was in about the disconnection
      const rooms = Array.from(socket.rooms);
      rooms.forEach(room => {
        if (room !== socket.id) {
          socket.to(room).emit('user-left', {
            socketId: socket.id,
            timestamp: Date.now()
          });
        }
      });
    });
  });
};

module.exports = { setupSocketHandlers }; 
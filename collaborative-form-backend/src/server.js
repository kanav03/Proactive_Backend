const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const formRoutes = require('./routes/form.routes');
const responseRoutes = require('./routes/response.routes');
const userRoutes = require('./routes/user.routes');

// Import socket handlers
const { setupSocketHandlers } = require('./utils/socket');

// Initialize express app
const app = express();
const server = http.createServer(app);

// Get allowed origins from environment variable or use wildcard as fallback
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : '*';

console.log('Allowed Origins:', allowedOrigins); // Debug log

// Configure Socket.IO with CORS settings
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins === '*') {
      return callback(null, true);
    }

    if (Array.isArray(allowedOrigins)) {
      const isAllowed = allowedOrigins.includes(origin);
      console.log('Origin:', origin, 'Is Allowed:', isAllowed); // Debug log
      if (isAllowed) {
        return callback(null, true);
      }
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.use(express.json());

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/collaborative-forms';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/users', userRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Collaborative Form Filling API',
    version: '1.0.0'
  });
});

// Setup Socket.IO handlers
setupSocketHandlers(io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});

module.exports = { app, server, io }; 
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const winston = require('winston');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Configure logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/activity.log' }),
    new winston.transports.Console()
  ]
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    cb(null, `${timestamp}-${file.originalname}`)
  }
});

const upload = multer({ storage: storage });

// Store active capture sessions
const activeSessions = new Map();

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// API endpoint to start capture session
app.post('/api/start-capture', (req, res) => {
  const { viewportId, sourceType, sourceUrl, captureType, frameRate, humanDetection } = req.body;
  
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const session = {
    id: sessionId,
    viewportId,
    sourceType,
    sourceUrl,
    captureType,
    frameRate,
    humanDetection,
    status: 'active',
    startTime: new Date().toISOString(),
    detectedPeople: []
  };
  
  activeSessions.set(sessionId, session);
  
  logger.info('Capture session started', { sessionId, session });
  
  res.json({
    success: true,
    sessionId: sessionId,
    message: 'Capture session started successfully'
  });
});

// API endpoint to stop capture session
app.post('/api/stop-capture', (req, res) => {
  const { sessionId } = req.body;
  
  if (activeSessions.has(sessionId)) {
    const session = activeSessions.get(sessionId);
    session.status = 'stopped';
    session.endTime = new Date().toISOString();
    
    logger.info('Capture session stopped', { sessionId });
    
    res.json({
      success: true,
      message: 'Capture session stopped successfully'
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Session not found'
    });
  }
});

// API endpoint to take screenshot
app.post('/api/screenshot', (req, res) => {
  const { sessionId, viewportId } = req.body;
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `screenshot_${viewportId}_${timestamp}.png`;
  
  logger.info('Screenshot taken', { sessionId, viewportId, filename });
  
  res.json({
    success: true,
    filename: filename,
    message: 'Screenshot taken successfully'
  });
});

// API endpoint to add detected person
app.post('/api/add-person', (req, res) => {
  const { sessionId, personName, confidence } = req.body;
  
  if (activeSessions.has(sessionId)) {
    const session = activeSessions.get(sessionId);
    const person = {
      name: personName,
      confidence: confidence,
      detectedAt: new Date().toISOString()
    };
    
    session.detectedPeople.push(person);
    
    logger.info('Person added to session', { sessionId, person });
    
    // Emit to connected clients
    io.emit('person-detected', { sessionId, person });
    
    res.json({
      success: true,
      message: 'Person added successfully'
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Session not found'
    });
  }
});

// API endpoint to get session info
app.get('/api/session/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  
  if (activeSessions.has(sessionId)) {
    const session = activeSessions.get(sessionId);
    res.json({
      success: true,
      session: session
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Session not found'
    });
  }
});

// API endpoint to get all active sessions
app.get('/api/sessions', (req, res) => {
  const sessions = Array.from(activeSessions.values());
  res.json({
    success: true,
    sessions: sessions
  });
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (req.file) {
    logger.info('File uploaded', { filename: req.file.filename, size: req.file.size });
    
    res.json({
      success: true,
      filename: req.file.filename,
      message: 'File uploaded successfully'
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info('Client connected', { socketId: socket.id });
  
  socket.on('join-viewport', (viewportId) => {
    socket.join(`viewport_${viewportId}`);
    logger.info('Client joined viewport', { socketId: socket.id, viewportId });
  });
  
  socket.on('leave-viewport', (viewportId) => {
    socket.leave(`viewport_${viewportId}`);
    logger.info('Client left viewport', { socketId: socket.id, viewportId });
  });
  
  socket.on('disconnect', () => {
    logger.info('Client disconnected', { socketId: socket.id });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Server error', { error: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = app;
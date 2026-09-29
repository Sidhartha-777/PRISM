const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const config = require('./config');
const { errorHandler } = require('./middleware/errors');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const expeditionRoutes = require('./routes/expeditions');
const mediaRoutes = require('./routes/media');
const datasetRoutes = require('./routes/datasets');
const publicationRoutes = require('./routes/publications');
const newsRoutes = require('./routes/news');
const eventRoutes = require('./routes/events');
const searchRoutes = require('./routes/search');
const educationRoutes = require('./routes/education');
const studioRoutes = require('./routes/studio');
const statsRoutes = require('./routes/stats');
const approvalRoutes = require('./routes/approvals');
const notificationRoutes = require('./routes/notifications');

const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
}));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: { code: 'RATE_LIMIT', message: 'Too many requests.' } },
});
const questionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: { code: 'RATE_LIMIT', message: 'Too many submissions.' } },
});

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Static uploads
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/expeditions', expeditionRoutes);
app.use('/api/v1/media', mediaRoutes);
app.use('/api/v1/datasets', datasetRoutes);
app.use('/api/v1/publications', publicationRoutes);
app.use('/api/v1/news', newsRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/education', educationRoutes);
app.use('/api/v1/studio', studioRoutes);
app.use('/api/v1/stats', statsRoutes);
app.use('/api/v1/approvals', approvalRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// Error handler
app.use(errorHandler);

module.exports = app;

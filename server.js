const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import configurations and database
const config = require('./config');
const dbConnection = require('./db/connection');

// Import models
const User = require('./models/User');
const CounselingSession = require('./models/CounselingSession');
const MoodLog = require('./models/MoodLog');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const counselingRoutes = require('./routes/counseling');
const moodRoutes = require('./routes/mood');
const resourceRoutes = require('./routes/resources');
const adminRoutes = require('./routes/admin');

const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable for development
    crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com'] // Replace with your actual domain
        : ['http://localhost:3000', 'http://localhost:8000', 'http://127.0.0.1:8000'],
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: {
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (frontend)
app.use(express.static(path.join(__dirname)));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/counseling', counselingRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: config.server.env
    });
});

// Serve the main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: err.errors
        });
    }
    
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized access'
        });
    }
    
    if (err.code === 11000) {
        return res.status(400).json({
            success: false,
            message: 'Duplicate entry. This email is already registered.'
        });
    }
    
    // Default error response
    res.status(err.status || 500).json({
        success: false,
        message: config.server.env === 'production' 
            ? 'Internal server error' 
            : err.message,
        ...(config.server.env === 'development' && { stack: err.stack })
    });
});

// 404 handler
app.use('*', (req, res) => {
    if (req.originalUrl.startsWith('/api/')) {
        res.status(404).json({
            success: false,
            message: 'API endpoint not found'
        });
    } else {
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

// Initialize database and start server
async function startServer() {
    try {
        // Connect to MongoDB
        await dbConnection.connect();
        
        // Start the server
        const server = app.listen(config.server.port, () => {
            console.log(`🚀 Server running on port ${config.server.port}`);
            console.log(`📱 Environment: ${config.server.env}`);
            console.log(`🔗 API Base URL: http://localhost:${config.server.port}/api`);
            console.log(`🌐 Frontend URL: http://localhost:${config.server.port}`);
        });

        // Handle server shutdown gracefully
        const gracefulShutdown = async (signal) => {
            console.log(`\n🔄 Received ${signal}. Starting graceful shutdown...`);
            
            server.close(async () => {
                console.log('✅ HTTP server closed');
                
                try {
                    await dbConnection.close();
                    console.log('✅ Database connection closed');
                    process.exit(0);
                } catch (error) {
                    console.error('❌ Error during shutdown:', error);
                    process.exit(1);
                }
            });
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();

module.exports = app;
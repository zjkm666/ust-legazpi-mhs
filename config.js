// Configuration file for the application
module.exports = {
    // MongoDB Configuration
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb+srv://jshmlnd_db_user:Steffijimei4210043@ustl-mhsp.sorgjh8.mongodb.net/USTL-MHSP?retryWrites=true&w=majority',
        dbName: process.env.DB_NAME || 'USTL-MHSP'
    },
    
    // JWT Configuration
    jwt: {
        secret: process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_this_in_production',
        expiresIn: '24h'
    },
    
    // Server Configuration
    server: {
        port: process.env.PORT || 3000,
        env: process.env.NODE_ENV || 'development'
    },
    
    // Admin Configuration
    admin: {
        email: process.env.ADMIN_EMAIL || 'admin@ust-legazpi.edu.ph',
        password: process.env.ADMIN_PASSWORD || 'admin123'
    },
    
    // Rate Limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
    }
};
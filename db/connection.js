const { MongoClient } = require('mongodb');
const config = require('../config');

class DatabaseConnection {
    constructor() {
        this.client = null;
        this.db = null;
    }

    async connect() {
        try {
            this.client = new MongoClient(config.mongodb.uri);
            await this.client.connect();
            this.db = this.client.db(config.mongodb.dbName);
            console.log('✅ Connected to MongoDB successfully');
            
            // Initialize collections and indexes
            await this.initializeDatabase();
            
            return this.db;
        } catch (error) {
            console.error('❌ MongoDB connection error:', error);
            throw error;
        }
    }

    async initializeDatabase() {
        try {
            // Create indexes for better performance
            await this.createIndexes();
            
            // Create default admin user if it doesn't exist
            await this.createDefaultAdmin();
            
            console.log('✅ Database initialized successfully');
        } catch (error) {
            console.error('❌ Database initialization error:', error);
            throw error;
        }
    }

    async createIndexes() {
        const collections = [
            {
                name: 'users',
                indexes: [
                    { key: { email: 1 }, unique: true },
                    { key: { type: 1 } },
                    { key: { createdAt: 1 } }
                ]
            },
            {
                name: 'counseling_sessions',
                indexes: [
                    { key: { userId: 1 } },
                    { key: { status: 1 } },
                    { key: { createdAt: 1 } }
                ]
            },
            {
                name: 'mood_logs',
                indexes: [
                    { key: { userId: 1 } },
                    { key: { date: 1 } },
                    { key: { userId: 1, date: 1 }, unique: true }
                ]
            },
            {
                name: 'mental_health_resources',
                indexes: [
                    { key: { type: 1 } },
                    { key: { name: 1 } }
                ]
            }
        ];

        for (const collection of collections) {
            const col = this.db.collection(collection.name);
            
            for (const index of collection.indexes) {
                try {
                    await col.createIndex(index.key, { 
                        unique: index.unique || false,
                        background: true 
                    });
                } catch (error) {
                    // Index might already exist, continue
                    if (!error.message.includes('already exists')) {
                        console.warn(`Warning creating index for ${collection.name}:`, error.message);
                    }
                }
            }
        }
    }

    async createDefaultAdmin() {
        const usersCollection = this.db.collection('users');
        
        // Check if admin already exists
        const existingAdmin = await usersCollection.findOne({ 
            email: config.admin.email 
        });
        
        if (!existingAdmin) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash(config.admin.password, 12);
            
            const adminUser = {
                email: config.admin.email,
                password: hashedPassword,
                type: 'admin',
                firstName: 'System',
                lastName: 'Administrator',
                isActive: true,
                createdAt: new Date(),
                lastLogin: null,
                profile: {
                    role: 'Administrator',
                    permissions: ['all']
                }
            };
            
            await usersCollection.insertOne(adminUser);
            console.log('✅ Default admin user created');
        }
    }

    getDatabase() {
        if (!this.db) {
            throw new Error('Database not connected. Call connect() first.');
        }
        return this.db;
    }

    async close() {
        if (this.client) {
            await this.client.close();
            console.log('✅ MongoDB connection closed');
        }
    }
}

// Create singleton instance
const dbConnection = new DatabaseConnection();

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('🔄 Shutting down gracefully...');
    await dbConnection.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('🔄 Shutting down gracefully...');
    await dbConnection.close();
    process.exit(0);
});

module.exports = dbConnection;
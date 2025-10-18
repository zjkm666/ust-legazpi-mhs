const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const cors = require('cors');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Session configuration
app.use(session({
    secret: 'ust-legazpi-mhs-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Database connection
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
    }
});

// Initialize database tables
db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        year_level TEXT,
        course TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        is_active BOOLEAN DEFAULT 1
    )`);

    // Peer counselors table
    db.run(`CREATE TABLE IF NOT EXISTS peer_counselors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        counselor_id TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        specialties TEXT,
        rating REAL DEFAULT 0,
        sessions_count INTEGER DEFAULT 0,
        is_available BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Counseling sessions table
    db.run(`CREATE TABLE IF NOT EXISTS counseling_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        counselor_id INTEGER,
        category TEXT,
        urgency TEXT,
        status TEXT DEFAULT 'active',
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ended_at DATETIME,
        FOREIGN KEY (student_id) REFERENCES users (id),
        FOREIGN KEY (counselor_id) REFERENCES peer_counselors (id)
    )`);

    // Mood logs table
    db.run(`CREATE TABLE IF NOT EXISTS mood_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        mood TEXT NOT NULL,
        notes TEXT,
        logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Resources table
    db.run(`CREATE TABLE IF NOT EXISTS resources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        contact_info TEXT,
        location TEXT,
        website TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: 'Authentication required' });
    }
};

// Login endpoint
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Check if user exists
        db.get(
            'SELECT * FROM users WHERE email = ? AND is_active = 1',
            [email],
            async (err, user) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                if (!user) {
                    return res.status(401).json({ error: 'Invalid email or password' });
                }

                // Verify password
                const isValidPassword = await bcrypt.compare(password, user.password);
                if (!isValidPassword) {
                    return res.status(401).json({ error: 'Invalid email or password' });
                }

                // Update last login
                db.run(
                    'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
                    [user.id]
                );

                // Create session
                req.session.userId = user.id;
                req.session.userEmail = user.email;
                req.session.userRole = 'student';

                res.json({
                    success: true,
                    user: {
                        id: user.id,
                        student_id: user.student_id,
                        email: user.email,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        year_level: user.year_level,
                        course: user.course
                    }
                });
            }
        );
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin login endpoint
app.post('/api/admin/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Check if admin exists (using peer_counselors table for now)
        db.get(
            'SELECT * FROM peer_counselors WHERE email = ? AND is_available = 1',
            [email],
            async (err, admin) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                if (!admin) {
                    return res.status(401).json({ error: 'Invalid email or password' });
                }

                // Verify password
                const isValidPassword = await bcrypt.compare(password, admin.password);
                if (!isValidPassword) {
                    return res.status(401).json({ error: 'Invalid email or password' });
                }

                // Create session
                req.session.userId = admin.id;
                req.session.userEmail = admin.email;
                req.session.userRole = 'admin';

                res.json({
                    success: true,
                    user: {
                        id: admin.id,
                        counselor_id: admin.counselor_id,
                        email: admin.email,
                        first_name: admin.first_name,
                        last_name: admin.last_name,
                        specialties: admin.specialties
                    }
                });
            }
        );
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out' });
        }
        res.json({ success: true });
    });
});

// Check authentication status
app.get('/api/auth/status', (req, res) => {
    if (req.session.userId) {
        res.json({
            authenticated: true,
            userId: req.session.userId,
            userEmail: req.session.userEmail,
            userRole: req.session.userRole
        });
    } else {
        res.json({ authenticated: false });
    }
});

// Get user dashboard data
app.get('/api/user/dashboard', requireAuth, (req, res) => {
    const userId = req.session.userId;

    // Get counseling sessions count
    db.get(
        'SELECT COUNT(*) as count FROM counseling_sessions WHERE student_id = ?',
        [userId],
        (err, sessionsResult) => {
            if (err) {
                console.error('Error getting sessions count:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            // Get mood logs count
            db.get(
                'SELECT COUNT(*) as count FROM mood_logs WHERE user_id = ?',
                [userId],
                (err, moodResult) => {
                    if (err) {
                        console.error('Error getting mood logs count:', err);
                        return res.status(500).json({ error: 'Database error' });
                    }

                    res.json({
                        counseling_sessions: sessionsResult.count,
                        mood_logs: moodResult.count,
                        resources_bookmarked: 0 // Placeholder
                    });
                }
            );
        }
    );
});

// Log mood endpoint
app.post('/api/user/mood', requireAuth, (req, res) => {
    const { mood, notes } = req.body;
    const userId = req.session.userId;

    if (!mood) {
        return res.status(400).json({ error: 'Mood is required' });
    }

    db.run(
        'INSERT INTO mood_logs (user_id, mood, notes) VALUES (?, ?, ?)',
        [userId, mood, notes || null],
        function(err) {
            if (err) {
                console.error('Error logging mood:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            res.json({ success: true, id: this.lastID });
        }
    );
});

// Get resources
app.get('/api/resources', (req, res) => {
    db.all(
        'SELECT * FROM resources WHERE is_active = 1 ORDER BY name',
        [],
        (err, rows) => {
            if (err) {
                console.error('Error getting resources:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            res.json(rows);
        }
    );
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Database connection closed.');
        process.exit(0);
    });
});
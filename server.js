const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection string - update this with your MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://zjkm666:Steffijimei4210043@ustl-mhsp.sorgjh8.mongodb.net/';

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

// MongoDB connection
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('Connected to MongoDB');
})
.catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
});

// User Schema
const userSchema = new mongoose.Schema({
    student_id: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    first_name: {
        type: String,
        required: true,
        trim: true
    },
    last_name: {
        type: String,
        required: true,
        trim: true
    },
    year_level: {
        type: String,
        required: true
    },
    course: {
        type: String,
        required: true,
        trim: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    last_login: {
        type: Date,
        default: null
    },
    is_active: {
        type: Boolean,
        default: true
    }
});

// Peer Counselor Schema
const peerCounselorSchema = new mongoose.Schema({
    counselor_id: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    first_name: {
        type: String,
        required: true,
        trim: true
    },
    last_name: {
        type: String,
        required: true,
        trim: true
    },
    specialties: {
        type: [String],
        default: []
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    sessions_count: {
        type: Number,
        default: 0
    },
    is_available: {
        type: Boolean,
        default: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

// Counseling Session Schema
const counselingSessionSchema = new mongoose.Schema({
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    counselor_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PeerCounselor',
        required: true
    },
    category: {
        type: String,
        required: true
    },
    urgency: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'low'
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled'],
        default: 'active'
    },
    started_at: {
        type: Date,
        default: Date.now
    },
    ended_at: {
        type: Date,
        default: null
    }
});

// Mood Log Schema
const moodLogSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    mood: {
        type: String,
        required: true,
        enum: ['excellent', 'good', 'okay', 'difficult', 'struggling']
    },
    notes: {
        type: String,
        default: null
    },
    logged_at: {
        type: Date,
        default: Date.now
    }
});

// Resource Schema
const resourceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: null
    },
    contact_info: {
        type: String,
        default: null
    },
    location: {
        type: String,
        default: null
    },
    website: {
        type: String,
        default: null
    },
    is_active: {
        type: Boolean,
        default: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

// Create models
const User = mongoose.model('User', userSchema);
const PeerCounselor = mongoose.model('PeerCounselor', peerCounselorSchema);
const CounselingSession = mongoose.model('CounselingSession', counselingSessionSchema);
const MoodLog = mongoose.model('MoodLog', moodLogSchema);
const Resource = mongoose.model('Resource', resourceSchema);

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
        const user = await User.findOne({ email: email.toLowerCase(), is_active: true });
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Update last login
        await User.findByIdAndUpdate(user._id, { last_login: new Date() });

        // Create session
        req.session.userId = user._id;
        req.session.userEmail = user.email;
        req.session.userRole = 'student';

        res.json({
            success: true,
            user: {
                id: user._id,
                student_id: user.student_id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                year_level: user.year_level,
                course: user.course
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Registration endpoint
app.post('/api/register', async (req, res) => {
    const { student_id, first_name, last_name, email, password, year_level, course } = req.body;

    // Validate required fields
    if (!student_id || !first_name || !last_name || !email || !password || !year_level || !course) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate email domain
    if (!email.endsWith('@ust-legazpi.edu.ph')) {
        return res.status(400).json({ error: 'Only @ust-legazpi.edu.ph email addresses are allowed' });
    }

    try {
        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [
                { email: email.toLowerCase() },
                { student_id: student_id }
            ]
        });

        if (existingUser) {
            return res.status(409).json({ error: 'User with this email or student ID already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({
            student_id: student_id,
            email: email.toLowerCase(),
            password: hashedPassword,
            first_name: first_name,
            last_name: last_name,
            year_level: year_level,
            course: course
        });

        const savedUser = await newUser.save();

        res.json({
            success: true,
            message: 'Account created successfully',
            user: {
                id: savedUser._id,
                student_id: savedUser.student_id,
                email: savedUser.email,
                first_name: savedUser.first_name,
                last_name: savedUser.last_name,
                year_level: savedUser.year_level,
                course: savedUser.course
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        if (error.code === 11000) {
            // Duplicate key error
            return res.status(409).json({ error: 'User with this email or student ID already exists' });
        }
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
        const admin = await PeerCounselor.findOne({ email: email.toLowerCase(), is_available: true });
        
        if (!admin) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, admin.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Create session
        req.session.userId = admin._id;
        req.session.userEmail = admin.email;
        req.session.userRole = 'admin';

        res.json({
            success: true,
            user: {
                id: admin._id,
                counselor_id: admin.counselor_id,
                email: admin.email,
                first_name: admin.first_name,
                last_name: admin.last_name,
                specialties: admin.specialties
            }
        });
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
app.get('/api/user/dashboard', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;

        // Get counseling sessions count
        const sessionsCount = await CounselingSession.countDocuments({ student_id: userId });
        
        // Get mood logs count
        const moodLogsCount = await MoodLog.countDocuments({ user_id: userId });

        res.json({
            counseling_sessions: sessionsCount,
            mood_logs: moodLogsCount,
            resources_bookmarked: 0 // Placeholder
        });
    } catch (error) {
        console.error('Error getting dashboard data:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Log mood endpoint
app.post('/api/user/mood', requireAuth, async (req, res) => {
    const { mood, notes } = req.body;
    const userId = req.session.userId;

    if (!mood) {
        return res.status(400).json({ error: 'Mood is required' });
    }

    try {
        const moodLog = new MoodLog({
            user_id: userId,
            mood: mood,
            notes: notes || null
        });

        const savedMoodLog = await moodLog.save();
        res.json({ success: true, id: savedMoodLog._id });
    } catch (error) {
        console.error('Error logging mood:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get resources
app.get('/api/resources', async (req, res) => {
    try {
        const resources = await Resource.find({ is_active: true }).sort({ name: 1 });
        res.json(resources);
    } catch (error) {
        console.error('Error getting resources:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on mongodb+srv://zjkm666:Steffijimei4210043@ustl-mhsp.sorgjh8.mongodb.net/`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    mongoose.connection.close(() => {
        console.log('MongoDB connection closed.');
        process.exit(0);
    });
});
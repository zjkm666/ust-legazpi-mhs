const mongoose = require('mongoose');

// MongoDB connection string - update this with your MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ust-legazpi-mhs';

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('Connected to MongoDB');
    initializeDatabase();
})
.catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
});

// Schemas (same as in server.js)
const userSchema = new mongoose.Schema({
    student_id: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, required: true, trim: true },
    year_level: { type: String, required: true },
    course: { type: String, required: true, trim: true },
    created_at: { type: Date, default: Date.now },
    last_login: { type: Date, default: null },
    is_active: { type: Boolean, default: true }
});

const peerCounselorSchema = new mongoose.Schema({
    counselor_id: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, required: true, trim: true },
    specialties: { type: [String], default: [] },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    sessions_count: { type: Number, default: 0 },
    is_available: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now }
});

const resourceSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    contact_info: { type: String, default: null },
    location: { type: String, default: null },
    website: { type: String, default: null },
    is_active: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const PeerCounselor = mongoose.model('PeerCounselor', peerCounselorSchema);
const Resource = mongoose.model('Resource', resourceSchema);

async function initializeDatabase() {
    try {
        console.log('Initializing MongoDB database...');
        
        // Clear existing data (optional - remove this if you want to keep existing data)
        await User.deleteMany({});
        await PeerCounselor.deleteMany({});
        await Resource.deleteMany({});
        console.log('Cleared existing data');

        // Create sample mental health resources
        const resources = [
            {
                name: "UST-Legazpi Office of Guidance and Testing",
                type: "University Counseling",
                description: "Professional counseling services for students",
                contact_info: "(052) 482-0203 ext 312",
                location: "Aquinas University Campus, Rawis, Legazpi City",
                website: "https://ust-legazpi.edu.ph"
            },
            {
                name: "Bicol Medical Center - Psychiatry Department",
                type: "Mental Health Clinic",
                description: "Hospital-based mental health services",
                contact_info: "(052) 480-1234",
                location: "Concepcion Pequeña, Naga City",
                website: "https://bmc.gov.ph"
            },
            {
                name: "Dr. Maria Santos - Private Practice",
                type: "Private Practice",
                description: "Licensed psychologist specializing in student counseling",
                contact_info: "(052) 481-5678",
                location: "Legazpi City",
                website: null
            },
            {
                name: "Hope Counseling Center",
                type: "Mental Health Clinic",
                description: "Community-based mental health support",
                contact_info: "(052) 482-9999",
                location: "Albay District, Legazpi City",
                website: null
            },
            {
                name: "Bicol Regional Hospital - Mental Health Unit",
                type: "Hospital Service",
                description: "Government hospital mental health services",
                contact_info: "(052) 483-0000",
                location: "Cabangan, Camalig, Albay",
                website: null
            }
        ];

        await Resource.insertMany(resources);
        console.log('Created sample resources');

        // Create sample peer counselor (for admin login)
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        const sampleCounselor = new PeerCounselor({
            counselor_id: 'PC-001',
            email: 'admin@ust-legazpi.edu.ph',
            password: hashedPassword,
            first_name: 'Maria',
            last_name: 'Santos',
            specialties: ['Academic Stress', 'Anxiety', 'Depression'],
            rating: 4.8,
            sessions_count: 25,
            is_available: true
        });

        await sampleCounselor.save();
        console.log('Created sample peer counselor');

        console.log('Database initialization completed successfully!');
        console.log('\nSample admin credentials:');
        console.log('Email: admin@ust-legazpi.edu.ph');
        console.log('Password: admin123');
        console.log('\nYou can now start the server with: npm start');
        
    } catch (error) {
        console.error('Error initializing database:', error);
    } finally {
        mongoose.connection.close();
    }
}
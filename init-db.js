const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

// Create database connection
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database for initialization');
    }
});

// Initialize database with sample data
async function initializeDatabase() {
    try {
        console.log('Initializing database with sample data...');

        // Hash passwords
        const studentPassword = await bcrypt.hash('password123', 10);
        const adminPassword = await bcrypt.hash('admin123', 10);

        // Insert sample students
        const students = [
            {
                student_id: '2021-001',
                email: 'joshuaklein.malonda@ust-legazpi.edu.ph',
                password: studentPassword,
                first_name: 'Maria',
                last_name: 'Garcia',
                year_level: '4th Year',
                course: 'BS Psychology'
            },
            {
                student_id: '2021-002',
                email: 'j.santos@ust-legazpi.edu.ph',
                password: studentPassword,
                first_name: 'Juan',
                last_name: 'Santos',
                year_level: '3rd Year',
                course: 'BS Computer Science'
            },
            {
                student_id: '2020-045',
                email: 'a.reyes@ust-legazpi.edu.ph',
                password: studentPassword,
                first_name: 'Ana',
                last_name: 'Reyes',
                year_level: '4th Year',
                course: 'BS Education'
            }
        ];

        // Insert sample peer counselors/admins
        const counselors = [
            {
                counselor_id: 'PC-001',
                email: 'admin@ust-legazpi.edu.ph',
                password: adminPassword,
                first_name: 'Dr. Sarah',
                last_name: 'Cruz',
                specialties: 'Academic Stress, Anxiety, Depression'
            },
            {
                counselor_id: 'PC-002',
                email: 'counselor@ust-legazpi.edu.ph',
                password: adminPassword,
                first_name: 'Prof. Michael',
                last_name: 'Torres',
                specialties: 'Relationships, Identity, Life Transitions'
            }
        ];

        // Insert sample resources
        const resources = [
            {
                name: 'UST-Legazpi Guidance Office',
                type: 'University Counseling',
                description: 'Professional counseling services for students',
                contact_info: '(052) 482-0203 ext 312',
                location: 'Main Campus, Guidance Office',
                website: 'https://ust-legazpi.edu.ph'
            },
            {
                name: 'Legazpi City Mental Health Center',
                type: 'Mental Health Clinic',
                description: 'Community mental health services',
                contact_info: '(052) 480-1234',
                location: 'Legazpi City Health Center',
                website: ''
            },
            {
                name: 'Dr. Maria Santos - Private Practice',
                type: 'Private Practice',
                description: 'Licensed psychologist specializing in student mental health',
                contact_info: '(052) 481-5678',
                location: 'Downtown Legazpi',
                website: ''
            },
            {
                name: 'Bicol Medical Center - Psychiatry',
                type: 'Hospital Service',
                description: 'Hospital-based psychiatric services',
                contact_info: '(052) 482-9999',
                location: 'Bicol Medical Center',
                website: ''
            }
        ];

        // Insert students
        for (const student of students) {
            db.run(
                `INSERT OR IGNORE INTO users (student_id, email, password, first_name, last_name, year_level, course) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [student.student_id, student.email, student.password, student.first_name, student.last_name, student.year_level, student.course],
                function(err) {
                    if (err) {
                        console.error('Error inserting student:', err);
                    } else {
                        console.log(`Student ${student.email} inserted`);
                    }
                }
            );
        }

        // Insert counselors
        for (const counselor of counselors) {
            db.run(
                `INSERT OR IGNORE INTO peer_counselors (counselor_id, email, password, first_name, last_name, specialties) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [counselor.counselor_id, counselor.email, counselor.password, counselor.first_name, counselor.last_name, counselor.specialties],
                function(err) {
                    if (err) {
                        console.error('Error inserting counselor:', err);
                    } else {
                        console.log(`Counselor ${counselor.email} inserted`);
                    }
                }
            );
        }

        // Insert resources
        for (const resource of resources) {
            db.run(
                `INSERT OR IGNORE INTO resources (name, type, description, contact_info, location, website) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [resource.name, resource.type, resource.description, resource.contact_info, resource.location, resource.website],
                function(err) {
                    if (err) {
                        console.error('Error inserting resource:', err);
                    } else {
                        console.log(`Resource ${resource.name} inserted`);
                    }
                }
            );
        }

        console.log('Database initialization completed!');
        console.log('\nSample login credentials:');
        console.log('Students:');
        console.log('  Email: m.garcia@ust-legazpi.edu.ph, Password: password123');
        console.log('  Email: j.santos@ust-legazpi.edu.ph, Password: password123');
        console.log('  Email: a.reyes@ust-legazpi.edu.ph, Password: password123');
        console.log('\nAdmin:');
        console.log('  Email: admin@ust-legazpi.edu.ph, Password: admin123');
        console.log('  Email: counselor@ust-legazpi.edu.ph, Password: admin123');

    } catch (error) {
        console.error('Error during initialization:', error);
    }
}

// Run initialization
initializeDatabase().then(() => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Database connection closed.');
        process.exit(0);
    });
});
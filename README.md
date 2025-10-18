# UST-Legazpi Mental Health Support Portal

A comprehensive web application for UST-Legazpi students to access mental health resources, peer counseling, and educational materials.

## Features

- **Student Authentication**: Secure login with university email validation
- **Peer Counseling**: Anonymous chat sessions with trained peer counselors
- **Mood Tracking**: Daily mood check-ins with personalized feedback
- **Resource Directory**: Comprehensive list of mental health services in Legazpi City
- **Educational Content**: Mental health education and coping strategies
- **Crisis Support**: Emergency contacts and immediate support resources
- **Admin Dashboard**: Management interface for counselors and resources

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Authentication**: Session-based authentication with bcrypt password hashing
- **Security**: CORS enabled, XSS protection, input validation

## Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

### 1. Install Dependencies

```bash
npm install
```

### 2. Initialize Database

```bash
npm run init-db
```

This will create the SQLite database and populate it with sample data.

### 3. Start the Server

```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Sample Login Credentials

### Students
- **Email**: `m.garcia@ust-legazpi.edu.ph`
- **Password**: `password123`

- **Email**: `j.santos@ust-legazpi.edu.ph`
- **Password**: `password123`

- **Email**: `a.reyes@ust-legazpi.edu.ph`
- **Password**: `password123`

### Admin/Counselor
- **Email**: `admin@ust-legazpi.edu.ph`
- **Password**: `admin123`

- **Email**: `counselor@ust-legazpi.edu.ph`
- **Password**: `admin123`

## API Endpoints

### Authentication
- `POST /api/login` - Student login
- `POST /api/admin/login` - Admin login
- `POST /api/logout` - Logout
- `GET /api/auth/status` - Check authentication status

### User Data
- `GET /api/user/dashboard` - Get user dashboard statistics
- `POST /api/user/mood` - Log mood entry

### Resources
- `GET /api/resources` - Get all mental health resources

## Database Schema

### Users Table
- `id` - Primary key
- `student_id` - Unique student identifier
- `email` - University email address
- `password` - Hashed password
- `first_name`, `last_name` - User details
- `year_level`, `course` - Academic information
- `created_at`, `last_login` - Timestamps
- `is_active` - Account status

### Peer Counselors Table
- `id` - Primary key
- `counselor_id` - Unique counselor identifier
- `email` - Counselor email
- `password` - Hashed password
- `first_name`, `last_name` - Counselor details
- `specialties` - Areas of expertise
- `rating`, `sessions_count` - Performance metrics
- `is_available` - Availability status

### Additional Tables
- `counseling_sessions` - Chat session records
- `mood_logs` - User mood tracking data
- `resources` - Mental health resource directory

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **Session Management**: Secure server-side sessions
- **Input Validation**: Email domain validation, XSS protection
- **CORS Configuration**: Controlled cross-origin requests
- **SQL Injection Prevention**: Parameterized queries

## Development

### Project Structure
```
ust-legazpi-mhs/
├── index.html          # Main HTML file
├── app.js             # Frontend JavaScript
├── style.css          # CSS styles
├── server.js          # Express server
├── init-db.js         # Database initialization
├── package.json       # Dependencies and scripts
└── database.sqlite    # SQLite database (created after init)
```

### Adding New Features

1. **Backend**: Add new routes in `server.js`
2. **Frontend**: Add new functions in `app.js`
3. **Database**: Modify schema in `init-db.js` if needed
4. **UI**: Update HTML and CSS as required

## Deployment

### Production Considerations

1. **Environment Variables**: Set `NODE_ENV=production`
2. **HTTPS**: Enable SSL certificates
3. **Session Security**: Update session configuration for HTTPS
4. **Database**: Consider PostgreSQL for production
5. **Monitoring**: Add logging and error tracking
6. **Backup**: Implement database backup strategy

### Environment Variables
```bash
NODE_ENV=production
PORT=3000
SESSION_SECRET=your-secure-session-secret
```

## Support

For technical support or questions about the mental health portal, contact:
- **Technical Issues**: IT Department, UST-Legazpi
- **Mental Health Support**: Guidance Office, UST-Legazpi
- **Emergency**: Call 911 or 1553

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

**Important**: This application is designed for educational and support purposes. For mental health emergencies, always contact professional services or emergency hotlines.
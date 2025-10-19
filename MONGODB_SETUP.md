# MongoDB Setup Guide for UST-Legazpi Mental Health Support

## Prerequisites

1. **MongoDB Installation**
   - Install MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
   - Or use MongoDB Atlas (cloud version) for easier setup

2. **Node.js Dependencies**
   ```bash
   npm install
   ```

## Configuration

### Local MongoDB Setup
If using local MongoDB, make sure MongoDB service is running:
- Windows: MongoDB should start automatically after installation
- macOS: `brew services start mongodb-community`
- Linux: `sudo systemctl start mongod`

### MongoDB Atlas (Cloud) Setup
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string
4. Update the `MONGODB_URI` in `server.js` or set environment variable

### Environment Variables (Optional)
You can set the MongoDB connection string as an environment variable:
```bash
# Windows PowerShell
$env:MONGODB_URI="mongodb://localhost:27017/ust-legazpi-mhs"

# Windows Command Prompt
set MONGODB_URI=mongodb://localhost:27017/ust-legazpi-mhs

# macOS/Linux
export MONGODB_URI="mongodb://localhost:27017/ust-legazpi-mhs"
```

## Database Initialization

Initialize the database with sample data:
```bash
npm run init-mongodb
```

This will create:
- Sample mental health resources
- Sample peer counselor account for admin login
- Database schemas and indexes

## Running the Application

1. **Start the server:**
   ```bash
   npm start
   ```

2. **For development with auto-restart:**
   ```bash
   npm run dev
   ```

3. **Access the application:**
   - Open your browser to `http://localhost:3000`

## Sample Accounts

After running the initialization script, you can use:

### Admin Account
- **Email:** admin@ust-legazpi.edu.ph
- **Password:** admin123

### Student Registration
- Students can register using their @ust-legazpi.edu.ph email
- Student ID format: 7 digits (e.g., 1234567)

## Database Schema

### Users Collection
- `student_id` (String, Unique) - 7 digits format
- `email` (String, Unique)
- `password` (String, Hashed)
- `first_name`, `last_name` (String)
- `year_level`, `course` (String)
- `created_at`, `last_login` (Date)
- `is_active` (Boolean)

### Peer Counselors Collection
- `counselor_id` (String, Unique)
- `email` (String, Unique)
- `password` (String, Hashed)
- `first_name`, `last_name` (String)
- `specialties` (Array of Strings)
- `rating`, `sessions_count` (Number)
- `is_available` (Boolean)

### Resources Collection
- `name`, `type` (String)
- `description`, `contact_info`, `location`, `website` (String)
- `is_active` (Boolean)
- `created_at` (Date)

### Counseling Sessions Collection
- `student_id`, `counselor_id` (ObjectId references)
- `category`, `urgency`, `status` (String)
- `started_at`, `ended_at` (Date)

### Mood Logs Collection
- `user_id` (ObjectId reference)
- `mood` (String, Enum)
- `notes` (String)
- `logged_at` (Date)

## Troubleshooting

### Connection Issues
- Ensure MongoDB service is running
- Check if the connection string is correct
- Verify network connectivity for Atlas connections

### Authentication Issues
- Make sure email domain is @ust-legazpi.edu.ph
- Check password requirements (8+ chars, uppercase, lowercase, number)
- Verify Student ID format (7 digits)

### Database Errors
- Run the initialization script to reset the database
- Check MongoDB logs for detailed error messages
- Ensure proper permissions for database operations

## Support

For issues or questions:
1. Check the console logs for error messages
2. Verify MongoDB connection and database permissions
3. Ensure all required fields are provided during registration
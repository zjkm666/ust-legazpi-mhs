const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const dbConnection = require('../db/connection');
const User = require('../models/User');
const { generateToken, validateEmailDomain } = require('../middleware/auth');

// Login endpoint
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
], async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;
        const db = dbConnection.getDatabase();
        const usersCollection = db.collection('users');

        // Find user by email
        const userDoc = await usersCollection.findOne({ 
            email: email.toLowerCase(),
            isActive: true 
        });

        if (!userDoc) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const user = User.fromDocument(userDoc);

        // Verify password
        const isValidPassword = await user.verifyPassword(password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update last login
        user.updateLastLogin();
        await usersCollection.updateOne(
            { _id: userDoc._id },
            { $set: { lastLogin: user.lastLogin } }
        );

        // Generate token
        const token = generateToken(userDoc._id, user.type);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: user.getPublicProfile()
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Register endpoint (for students only)
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').trim().isLength({ min: 1 }),
    body('lastName').trim().isLength({ min: 1 }),
    body('studentId').optional().trim(),
    body('yearLevel').optional().isInt({ min: 1, max: 4 }),
    body('course').optional().trim()
], async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, password, firstName, lastName, studentId, yearLevel, course } = req.body;
        const db = dbConnection.getDatabase();
        const usersCollection = db.collection('users');

        // Validate email domain
        if (!validateEmailDomain(email)) {
            return res.status(400).json({
                success: false,
                message: 'Only @ust-legazpi.edu.ph email addresses are allowed'
            });
        }

        // Check if user already exists
        const existingUser = await usersCollection.findOne({ 
            email: email.toLowerCase() 
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create new user
        const userData = {
            email: email.toLowerCase(),
            password,
            type: 'student',
            firstName,
            lastName,
            studentId,
            yearLevel,
            course,
            isActive: true,
            createdAt: new Date(),
            lastLogin: null
        };

        const user = new User(userData);
        
        // Validate user data
        const validation = user.validate();
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user data',
                errors: validation.errors
            });
        }

        // Hash password
        await user.hashPassword();

        // Insert user into database
        const result = await usersCollection.insertOne(user);
        user._id = result.insertedId;

        // Generate token
        const token = generateToken(user._id, user.type);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                token,
                user: user.getPublicProfile()
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Logout endpoint (client-side token removal)
router.post('/logout', (req, res) => {
    res.json({
        success: true,
        message: 'Logout successful'
    });
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const jwt = require('jsonwebtoken');
        const config = require('../config');
        const decoded = jwt.verify(token, config.jwt.secret);
        
        const db = dbConnection.getDatabase();
        const usersCollection = db.collection('users');
        const userDoc = await usersCollection.findOne({ 
            _id: decoded.userId,
            isActive: true 
        });

        if (!userDoc) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        const user = User.fromDocument(userDoc);

        res.json({
            success: true,
            message: 'Token is valid',
            data: {
                user: user.getPublicProfile()
            }
        });

    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        console.error('Token verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;
const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const dbConnection = require('../db/connection');
const User = require('../models/User');
const { verifyToken, verifyStudent } = require('../middleware/auth');

// Get user profile
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const user = User.fromDocument(req.user);
        res.json({
            success: true,
            data: {
                user: user.getPublicProfile()
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Update user profile
router.put('/profile', verifyToken, verifyStudent, [
    body('firstName').optional().trim().isLength({ min: 1 }),
    body('lastName').optional().trim().isLength({ min: 1 }),
    body('studentId').optional().trim(),
    body('yearLevel').optional().isInt({ min: 1, max: 4 }),
    body('course').optional().trim(),
    body('emergencyContact').optional().isObject()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const db = dbConnection.getDatabase();
        const usersCollection = db.collection('users');

        const updateData = {
            updatedAt: new Date()
        };

        // Only update provided fields
        if (req.body.firstName) updateData.firstName = req.body.firstName;
        if (req.body.lastName) updateData.lastName = req.body.lastName;
        if (req.body.studentId) updateData.studentId = req.body.studentId;
        if (req.body.yearLevel) updateData['profile.yearLevel'] = req.body.yearLevel;
        if (req.body.course) updateData['profile.course'] = req.body.course;
        if (req.body.emergencyContact) updateData['profile.emergencyContact'] = req.body.emergencyContact;

        await usersCollection.updateOne(
            { _id: req.user._id },
            { $set: updateData }
        );

        // Get updated user
        const updatedUser = await usersCollection.findOne({ _id: req.user._id });
        const user = User.fromDocument(updatedUser);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: user.getPublicProfile()
            }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Change password
router.put('/change-password', verifyToken, [
    body('currentPassword').isLength({ min: 6 }),
    body('newPassword').isLength({ min: 6 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { currentPassword, newPassword } = req.body;
        const db = dbConnection.getDatabase();
        const usersCollection = db.collection('users');

        const user = User.fromDocument(req.user);

        // Verify current password
        const isValidPassword = await user.verifyPassword(currentPassword);
        if (!isValidPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update password
        await usersCollection.updateOne(
            { _id: req.user._id },
            { $set: { password: hashedPassword } }
        );

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get user statistics
router.get('/stats', verifyToken, verifyStudent, async (req, res) => {
    try {
        const db = dbConnection.getDatabase();
        const userId = req.user._id;

        // Get counseling sessions count
        const counselingCollection = db.collection('counseling_sessions');
        const counselingCount = await counselingCollection.countDocuments({
            userId: userId,
            status: 'completed'
        });

        // Get bookmarked resources count
        const usersCollection = db.collection('users');
        const user = await usersCollection.findOne({ _id: userId });
        const bookmarkedCount = user?.profile?.resourcesBookmarked || 0;

        // Get mood logs count
        const moodLogsCollection = db.collection('mood_logs');
        const moodLogsCount = await moodLogsCollection.countDocuments({
            userId: userId
        });

        res.json({
            success: true,
            data: {
                counselingSessions: counselingCount,
                resourcesBookmarked: bookmarkedCount,
                moodLogs: moodLogsCount
            }
        });

    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Deactivate account
router.delete('/account', verifyToken, async (req, res) => {
    try {
        const db = dbConnection.getDatabase();
        const usersCollection = db.collection('users');

        // Soft delete - mark as inactive
        await usersCollection.updateOne(
            { _id: req.user._id },
            { 
                $set: { 
                    isActive: false,
                    deactivatedAt: new Date()
                } 
            }
        );

        res.json({
            success: true,
            message: 'Account deactivated successfully'
        });

    } catch (error) {
        console.error('Deactivate account error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;
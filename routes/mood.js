const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const dbConnection = require('../db/connection');
const MoodLog = require('../models/MoodLog');
const { verifyToken, verifyStudent } = require('../middleware/auth');

// Log mood
router.post('/log', verifyToken, verifyStudent, [
    body('mood').isIn(['excellent', 'good', 'okay', 'difficult', 'struggling']),
    body('notes').optional().isLength({ max: 500 }),
    body('date').optional().isISO8601()
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

        const { mood, notes, date } = req.body;
        const db = dbConnection.getDatabase();
        const moodLogsCollection = db.collection('mood_logs');
        const usersCollection = db.collection('users');

        // Check if mood already logged for today
        const logDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(logDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(logDate);
        endOfDay.setHours(23, 59, 59, 999);

        const existingLog = await moodLogsCollection.findOne({
            userId: req.user._id,
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });

        if (existingLog) {
            return res.status(400).json({
                success: false,
                message: 'Mood already logged for this date'
            });
        }

        // Create mood log
        const moodLogData = {
            userId: req.user._id,
            mood,
            notes: notes || '',
            date: logDate,
            timestamp: new Date()
        };

        const moodLog = new MoodLog(moodLogData);
        
        // Validate mood log
        const validation = moodLog.validate();
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid mood data',
                errors: validation.errors
            });
        }

        // Insert mood log
        const result = await moodLogsCollection.insertOne(moodLog);
        moodLog._id = result.insertedId;

        // Update user mood logs count
        await usersCollection.updateOne(
            { _id: req.user._id },
            { $inc: { 'profile.moodLogs': 1 } }
        );

        // Check if user needs support
        if (moodLog.needsSupport()) {
            // In a real application, this could trigger alerts to counselors
            console.log(`User ${req.user.email} logged struggling mood and may need support`);
        }

        res.status(201).json({
            success: true,
            message: 'Mood logged successfully',
            data: {
                moodLog: moodLog.toJSON()
            }
        });

    } catch (error) {
        console.error('Log mood error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get mood history
router.get('/history', verifyToken, verifyStudent, async (req, res) => {
    try {
        const db = dbConnection.getDatabase();
        const moodLogsCollection = db.collection('mood_logs');
        
        const { days = 30, page = 1, limit = 50 } = req.query;
        const skip = (page - 1) * limit;

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        // Get mood logs
        const moodLogs = await moodLogsCollection.find({
            userId: req.user._id,
            date: {
                $gte: startDate,
                $lte: endDate
            }
        })
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .toArray();

        // Convert to MoodLog objects and format
        const formattedLogs = moodLogs.map(doc => {
            const moodLog = MoodLog.fromDocument(doc);
            return moodLog.toJSON();
        });

        // Get total count for pagination
        const totalCount = await moodLogsCollection.countDocuments({
            userId: req.user._id,
            date: {
                $gte: startDate,
                $lte: endDate
            }
        });

        res.json({
            success: true,
            data: {
                moodLogs: formattedLogs,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalCount,
                    pages: Math.ceil(totalCount / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get mood history error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get mood statistics
router.get('/stats', verifyToken, verifyStudent, async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const db = dbConnection.getDatabase();
        
        const stats = await MoodLog.getMoodStats(db, req.user._id, parseInt(days));

        res.json({
            success: true,
            data: {
                stats
            }
        });

    } catch (error) {
        console.error('Get mood stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Update mood log
router.put('/log/:id', verifyToken, verifyStudent, [
    body('notes').optional().isLength({ max: 500 })
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

        const { id } = req.params;
        const { notes } = req.body;
        const db = dbConnection.getDatabase();
        const moodLogsCollection = db.collection('mood_logs');

        // Verify ownership
        const existingLog = await moodLogsCollection.findOne({
            _id: id,
            userId: req.user._id
        });

        if (!existingLog) {
            return res.status(404).json({
                success: false,
                message: 'Mood log not found'
            });
        }

        // Update notes
        await moodLogsCollection.updateOne(
            { _id: id },
            { 
                $set: { 
                    notes: notes || '',
                    updatedAt: new Date()
                } 
            }
        );

        // Get updated log
        const updatedLog = await moodLogsCollection.findOne({ _id: id });
        const moodLog = MoodLog.fromDocument(updatedLog);

        res.json({
            success: true,
            message: 'Mood log updated successfully',
            data: {
                moodLog: moodLog.toJSON()
            }
        });

    } catch (error) {
        console.error('Update mood log error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Delete mood log
router.delete('/log/:id', verifyToken, verifyStudent, async (req, res) => {
    try {
        const { id } = req.params;
        const db = dbConnection.getDatabase();
        const moodLogsCollection = db.collection('mood_logs');
        const usersCollection = db.collection('users');

        // Verify ownership and delete
        const result = await moodLogsCollection.deleteOne({
            _id: id,
            userId: req.user._id
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Mood log not found'
            });
        }

        // Update user mood logs count
        await usersCollection.updateOne(
            { _id: req.user._id },
            { $inc: { 'profile.moodLogs': -1 } }
        );

        res.json({
            success: true,
            message: 'Mood log deleted successfully'
        });

    } catch (error) {
        console.error('Delete mood log error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;
const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const dbConnection = require('../db/connection');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// Get admin dashboard statistics
router.get('/stats', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const db = dbConnection.getDatabase();
        const usersCollection = db.collection('users');
        const sessionsCollection = db.collection('counseling_sessions');
        const moodLogsCollection = db.collection('mood_logs');

        // Get user statistics
        const totalUsers = await usersCollection.countDocuments({ 
            type: 'student',
            isActive: true 
        });
        
        const activeSessions = await sessionsCollection.countDocuments({ 
            status: 'active' 
        });
        
        const totalSessions = await sessionsCollection.countDocuments();
        
        const peerCounselors = await usersCollection.countDocuments({ 
            type: 'counselor',
            isActive: true 
        });

        // Get recent activity
        const recentUsers = await usersCollection.find({
            type: 'student',
            isActive: true
        })
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray();

        const recentSessions = await sessionsCollection.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray();

        // Get mood statistics
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayMoodLogs = await moodLogsCollection.countDocuments({
            date: { $gte: today }
        });

        const strugglingUsers = await moodLogsCollection.distinct('userId', {
            mood: { $in: ['difficult', 'struggling'] },
            date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
        });

        res.json({
            success: true,
            data: {
                stats: {
                    totalUsers,
                    activeSessions,
                    totalSessions,
                    peerCounselors,
                    todayMoodLogs,
                    strugglingUsers: strugglingUsers.length
                },
                recentActivity: {
                    users: recentUsers.map(user => ({
                        id: user._id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        createdAt: user.createdAt
                    })),
                    sessions: recentSessions.map(session => ({
                        id: session._id,
                        userId: session.userId,
                        category: session.category,
                        status: session.status,
                        createdAt: session.createdAt
                    }))
                }
            }
        });

    } catch (error) {
        console.error('Get admin stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get all users with pagination
router.get('/users', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const db = dbConnection.getDatabase();
        const usersCollection = db.collection('users');
        
        const { page = 1, limit = 20, type, search } = req.query;
        const skip = (page - 1) * limit;

        // Build query
        const query = { isActive: true };
        if (type && type !== 'all') {
            query.type = type;
        }
        if (search) {
            query.$or = [
                { email: { $regex: search, $options: 'i' } },
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await usersCollection.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .toArray();

        const totalCount = await usersCollection.countDocuments(query);

        // Get user statistics
        const userIds = users.map(user => user._id);
        const sessionsCollection = db.collection('counseling_sessions');
        const moodLogsCollection = db.collection('mood_logs');

        const userStats = await Promise.all(userIds.map(async (userId) => {
            const [sessionCount, moodLogCount] = await Promise.all([
                sessionsCollection.countDocuments({ userId, status: 'completed' }),
                moodLogsCollection.countDocuments({ userId })
            ]);

            return {
                userId,
                sessionCount,
                moodLogCount
            };
        }));

        const usersWithStats = users.map(user => {
            const stats = userStats.find(s => s.userId.toString() === user._id.toString());
            return {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                type: user.type,
                studentId: user.studentId,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin,
                stats: {
                    counselingSessions: stats?.sessionCount || 0,
                    moodLogs: stats?.moodLogCount || 0
                }
            };
        });

        res.json({
            success: true,
            data: {
                users: usersWithStats,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalCount,
                    pages: Math.ceil(totalCount / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get admin users error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get counseling sessions
router.get('/sessions', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const db = dbConnection.getDatabase();
        const sessionsCollection = db.collection('counseling_sessions');
        
        const { page = 1, limit = 20, status, category } = req.query;
        const skip = (page - 1) * limit;

        const query = {};
        if (status) query.status = status;
        if (category) query.category = category;

        const sessions = await sessionsCollection.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .toArray();

        const totalCount = await sessionsCollection.countDocuments(query);

        // Get user details for sessions
        const userIds = [...new Set(sessions.map(session => session.userId))];
        const usersCollection = db.collection('users');
        const users = await usersCollection.find({
            _id: { $in: userIds }
        }).toArray();

        const userMap = {};
        users.forEach(user => {
            userMap[user._id.toString()] = user;
        });

        const sessionsWithUsers = sessions.map(session => ({
            id: session._id,
            userId: session.userId,
            userEmail: userMap[session.userId.toString()]?.email || 'Unknown',
            userName: `${userMap[session.userId.toString()]?.firstName || ''} ${userMap[session.userId.toString()]?.lastName || ''}`.trim(),
            category: session.category,
            urgency: session.urgency,
            status: session.status,
            counselorId: session.counselorId,
            startTime: session.startTime,
            endTime: session.endTime,
            rating: session.rating,
            feedback: session.feedback,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt
        }));

        res.json({
            success: true,
            data: {
                sessions: sessionsWithUsers,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalCount,
                    pages: Math.ceil(totalCount / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get admin sessions error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Deactivate user
router.put('/users/:id/deactivate', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const db = dbConnection.getDatabase();
        const usersCollection = db.collection('users');

        const result = await usersCollection.updateOne(
            { _id: id },
            { 
                $set: { 
                    isActive: false,
                    deactivatedAt: new Date(),
                    deactivatedBy: req.user._id
                } 
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User deactivated successfully'
        });

    } catch (error) {
        console.error('Deactivate user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Reactivate user
router.put('/users/:id/reactivate', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const db = dbConnection.getDatabase();
        const usersCollection = db.collection('users');

        const result = await usersCollection.updateOne(
            { _id: id },
            { 
                $set: { 
                    isActive: true
                },
                $unset: {
                    deactivatedAt: "",
                    deactivatedBy: ""
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User reactivated successfully'
        });

    } catch (error) {
        console.error('Reactivate user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get mood analytics
router.get('/analytics/mood', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const db = dbConnection.getDatabase();
        const moodLogsCollection = db.collection('mood_logs');
        
        const { days = 30 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        // Get mood distribution
        const moodDistribution = await moodLogsCollection.aggregate([
            {
                $match: {
                    date: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$mood',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]).toArray();

        // Get daily mood trends
        const dailyTrends = await moodLogsCollection.aggregate([
            {
                $match: {
                    date: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$date' },
                        month: { $month: '$date' },
                        day: { $dayOfMonth: '$date' }
                    },
                    count: { $sum: 1 },
                    averageScore: { $avg: {
                        $switch: {
                            branches: [
                                { case: { $eq: ['$mood', 'excellent'] }, then: 5 },
                                { case: { $eq: ['$mood', 'good'] }, then: 4 },
                                { case: { $eq: ['$mood', 'okay'] }, then: 3 },
                                { case: { $eq: ['$mood', 'difficult'] }, then: 2 },
                                { case: { $eq: ['$mood', 'struggling'] }, then: 1 }
                            ],
                            default: 0
                        }
                    }}
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
            }
        ]).toArray();

        // Get users needing support
        const strugglingUsers = await moodLogsCollection.aggregate([
            {
                $match: {
                    mood: { $in: ['difficult', 'struggling'] },
                    date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                }
            },
            {
                $group: {
                    _id: '$userId',
                    count: { $sum: 1 },
                    latestMood: { $last: '$mood' },
                    latestDate: { $last: '$date' }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]).toArray();

        res.json({
            success: true,
            data: {
                moodDistribution,
                dailyTrends,
                strugglingUsers: strugglingUsers.length,
                strugglingUsersDetails: strugglingUsers.slice(0, 10) // Top 10
            }
        });

    } catch (error) {
        console.error('Get mood analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;
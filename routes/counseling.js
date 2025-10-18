const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const dbConnection = require('../db/connection');
const CounselingSession = require('../models/CounselingSession');
const { verifyToken, verifyStudent } = require('../middleware/auth');

// Create counseling session request
router.post('/request', verifyToken, verifyStudent, [
    body('category').isIn(['Academic Stress', 'Social Anxiety', 'Depression & Mood', 'Relationship Issues', 'Identity & Self-Esteem', 'Life Transitions']),
    body('urgency').isIn(['low', 'medium', 'high'])
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

        const { category, urgency } = req.body;
        const db = dbConnection.getDatabase();
        const sessionsCollection = db.collection('counseling_sessions');

        // Check for existing pending session
        const existingSession = await sessionsCollection.findOne({
            userId: req.user._id,
            status: { $in: ['pending', 'active'] }
        });

        if (existingSession) {
            return res.status(400).json({
                success: false,
                message: 'You already have an active or pending counseling session'
            });
        }

        // Create new session
        const sessionData = {
            userId: req.user._id,
            category,
            urgency,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const session = new CounselingSession(sessionData);
        
        // Validate session
        const validation = session.validate();
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid session data',
                errors: validation.errors
            });
        }

        // Insert session
        const result = await sessionsCollection.insertOne(session);
        session._id = result.insertedId;

        // Simulate counselor matching (in real app, this would match with available counselors)
        setTimeout(async () => {
            try {
                await sessionsCollection.updateOne(
                    { _id: result.insertedId },
                    { 
                        $set: { 
                            status: 'active',
                            counselorId: 'peer-counselor-001', // Mock counselor ID
                            startTime: new Date(),
                            updatedAt: new Date()
                        } 
                    }
                );
            } catch (error) {
                console.error('Error updating session status:', error);
            }
        }, 2000); // Simulate 2-second matching process

        res.status(201).json({
            success: true,
            message: 'Counseling session requested successfully',
            data: {
                session: session.toJSON()
            }
        });

    } catch (error) {
        console.error('Create counseling session error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get user's counseling sessions
router.get('/sessions', verifyToken, verifyStudent, async (req, res) => {
    try {
        const db = dbConnection.getDatabase();
        const sessionsCollection = db.collection('counseling_sessions');
        
        const { status, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const query = { userId: req.user._id };
        if (status) {
            query.status = status;
        }

        const sessions = await sessionsCollection.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .toArray();

        const formattedSessions = sessions.map(doc => {
            const session = CounselingSession.fromDocument(doc);
            return session.toJSON();
        });

        const totalCount = await sessionsCollection.countDocuments(query);

        res.json({
            success: true,
            data: {
                sessions: formattedSessions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalCount,
                    pages: Math.ceil(totalCount / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get counseling sessions error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get current active session
router.get('/current', verifyToken, verifyStudent, async (req, res) => {
    try {
        const db = dbConnection.getDatabase();
        const sessionsCollection = db.collection('counseling_sessions');

        const activeSession = await sessionsCollection.findOne({
            userId: req.user._id,
            status: { $in: ['pending', 'active'] }
        });

        if (!activeSession) {
            return res.json({
                success: true,
                data: {
                    session: null
                }
            });
        }

        const session = CounselingSession.fromDocument(activeSession);

        res.json({
            success: true,
            data: {
                session: session.toJSON()
            }
        });

    } catch (error) {
        console.error('Get current session error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Send message in counseling session
router.post('/sessions/:id/message', verifyToken, verifyStudent, [
    body('message').isLength({ min: 1, max: 500 }),
    body('sender').isIn(['user', 'counselor'])
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
        const { message, sender } = req.body;
        const db = dbConnection.getDatabase();
        const sessionsCollection = db.collection('counseling_sessions');

        // Verify session ownership and status
        const session = await sessionsCollection.findOne({
            _id: id,
            userId: req.user._id,
            status: 'active'
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Active session not found'
            });
        }

        // Add message
        const newMessage = {
            sender,
            message,
            timestamp: new Date()
        };

        await sessionsCollection.updateOne(
            { _id: id },
            { 
                $push: { messages: newMessage },
                $set: { updatedAt: new Date() }
            }
        );

        // Simulate counselor response for demo purposes
        if (sender === 'user') {
            setTimeout(async () => {
                try {
                    const counselorResponses = [
                        "I understand how you're feeling. That sounds really challenging.",
                        "Can you tell me more about what's been on your mind?",
                        "It's completely normal to feel that way. You're not alone.",
                        "What do you think might help you feel better about this situation?",
                        "Have you considered talking to someone close to you about this?",
                        "Let's explore some strategies that might help you cope with these feelings.",
                        "Thank you for sharing that with me. It takes courage to open up.",
                        "How has this been affecting your daily life?",
                        "What are some things that usually help you feel better?",
                        "Would you like to talk about some coping strategies?"
                    ];

                    const randomResponse = counselorResponses[Math.floor(Math.random() * counselorResponses.length)];
                    
                    const counselorMessage = {
                        sender: 'counselor',
                        message: randomResponse,
                        timestamp: new Date()
                    };

                    await sessionsCollection.updateOne(
                        { _id: id },
                        { 
                            $push: { messages: counselorMessage },
                            $set: { updatedAt: new Date() }
                        }
                    );
                } catch (error) {
                    console.error('Error sending counselor response:', error);
                }
            }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
        }

        res.json({
            success: true,
            message: 'Message sent successfully',
            data: {
                message: newMessage
            }
        });

    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// End counseling session
router.post('/sessions/:id/end', verifyToken, verifyStudent, [
    body('rating').optional().isInt({ min: 1, max: 5 }),
    body('feedback').optional().isLength({ max: 1000 })
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
        const { rating, feedback } = req.body;
        const db = dbConnection.getDatabase();
        const sessionsCollection = db.collection('counseling_sessions');
        const usersCollection = db.collection('users');

        // Verify session ownership and status
        const sessionDoc = await sessionsCollection.findOne({
            _id: id,
            userId: req.user._id,
            status: 'active'
        });

        if (!sessionDoc) {
            return res.status(404).json({
                success: false,
                message: 'Active session not found'
            });
        }

        const session = CounselingSession.fromDocument(sessionDoc);

        // End session
        session.endSession();
        if (rating) {
            session.rateSession(rating, feedback || '');
        }

        await sessionsCollection.updateOne(
            { _id: id },
            { 
                $set: {
                    status: session.status,
                    endTime: session.endTime,
                    rating: session.rating,
                    feedback: session.feedback,
                    updatedAt: session.updatedAt
                }
            }
        );

        // Update user counseling sessions count
        await usersCollection.updateOne(
            { _id: req.user._id },
            { $inc: { 'profile.counselingSessions': 1 } }
        );

        res.json({
            success: true,
            message: 'Session ended successfully',
            data: {
                session: session.toJSON()
            }
        });

    } catch (error) {
        console.error('End session error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Cancel counseling session
router.post('/sessions/:id/cancel', verifyToken, verifyStudent, async (req, res) => {
    try {
        const { id } = req.params;
        const db = dbConnection.getDatabase();
        const sessionsCollection = db.collection('counseling_sessions');

        // Verify session ownership and status
        const sessionDoc = await sessionsCollection.findOne({
            _id: id,
            userId: req.user._id,
            status: { $in: ['pending', 'active'] }
        });

        if (!sessionDoc) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        const session = CounselingSession.fromDocument(sessionDoc);
        session.cancelSession();

        await sessionsCollection.updateOne(
            { _id: id },
            { 
                $set: {
                    status: session.status,
                    endTime: session.endTime,
                    updatedAt: session.updatedAt
                }
            }
        );

        res.json({
            success: true,
            message: 'Session cancelled successfully',
            data: {
                session: session.toJSON()
            }
        });

    } catch (error) {
        console.error('Cancel session error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;
const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const dbConnection = require('../db/connection');
const { verifyToken, verifyStudent, optionalAuth } = require('../middleware/auth');

// Mental health resources data (same as frontend)
const mentalHealthResources = [
    {
        name: "UST-Legazpi Office of Guidance and Testing",
        type: "University Counseling",
        address: "Aquinas University Campus, Rawis, Legazpi City",
        phone: "(052) 482-0203 local 312",
        email: "ogt@ust-legazpi.edu.ph",
        specialties: ["Student Counseling", "Academic Support", "Career Guidance"],
        cost: "Free for students",
        hours: "Monday-Friday 7:30am-5:30pm",
        rating: 4.5
    },
    {
        name: "Dr. Tan Mental Health Clinic",
        type: "Private Practice",
        address: "Estevez Street, Legazpi City",
        phone: "Contact via UST Hospital",
        specialties: ["General Psychiatry", "Depression", "Anxiety"],
        cost: "₱1,500 per session",
        hours: "By appointment",
        rating: 4.2
    },
    {
        name: "Clinica Legazpi - Dr. Cabacang",
        type: "Mental Health Clinic",
        address: "Legazpi City",
        specialties: ["Clinical Psychology", "Therapy", "Mental Health Assessment"],
        cost: "Varies",
        hours: "By appointment",
        rating: 4.0
    },
    {
        name: "UST-Legazpi Hospital Psychiatry Department",
        type: "Hospital Service",
        address: "UST-Legazpi Hospital, Legazpi City",
        phone: "(052) 482-0234",
        specialties: ["Psychiatry", "Crisis Intervention", "Inpatient Care"],
        cost: "According to PhilHealth rates",
        hours: "24/7 emergency, scheduled appointments",
        rating: 4.3
    },
    {
        name: "Legazpi City Mental Health Unit",
        type: "Government Service",
        address: "Legazpi City Health Office, Legazpi City",
        phone: "(052) 480-2234",
        specialties: ["Community Mental Health", "Basic Counseling", "Referrals"],
        cost: "Free",
        hours: "Monday-Friday 8:00am-5:00pm",
        rating: 3.8
    }
];

// Get all resources
router.get('/', optionalAuth, async (req, res) => {
    try {
        const { type, search } = req.query;
        let filteredResources = [...mentalHealthResources];

        // Filter by type
        if (type && type !== 'all') {
            filteredResources = filteredResources.filter(resource => 
                resource.type === type
            );
        }

        // Search functionality
        if (search) {
            const searchLower = search.toLowerCase();
            filteredResources = filteredResources.filter(resource =>
                resource.name.toLowerCase().includes(searchLower) ||
                resource.specialties.some(specialty => 
                    specialty.toLowerCase().includes(searchLower)
                ) ||
                resource.type.toLowerCase().includes(searchLower)
            );
        }

        // Add bookmark status if user is authenticated
        if (req.user) {
            const db = dbConnection.getDatabase();
            const usersCollection = db.collection('users');
            
            const user = await usersCollection.findOne({ _id: req.user._id });
            const bookmarkedResources = user?.profile?.bookmarkedResources || [];

            filteredResources = filteredResources.map((resource, index) => ({
                ...resource,
                id: index,
                isBookmarked: bookmarkedResources.includes(index)
            }));
        } else {
            filteredResources = filteredResources.map((resource, index) => ({
                ...resource,
                id: index,
                isBookmarked: false
            }));
        }

        res.json({
            success: true,
            data: {
                resources: filteredResources,
                total: filteredResources.length
            }
        });

    } catch (error) {
        console.error('Get resources error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get resource by ID
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const resourceIndex = parseInt(id);

        if (resourceIndex < 0 || resourceIndex >= mentalHealthResources.length) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found'
            });
        }

        const resource = { ...mentalHealthResources[resourceIndex], id: resourceIndex };

        // Add bookmark status if user is authenticated
        if (req.user) {
            const db = dbConnection.getDatabase();
            const usersCollection = db.collection('users');
            
            const user = await usersCollection.findOne({ _id: req.user._id });
            const bookmarkedResources = user?.profile?.bookmarkedResources || [];
            
            resource.isBookmarked = bookmarkedResources.includes(resourceIndex);
        } else {
            resource.isBookmarked = false;
        }

        res.json({
            success: true,
            data: {
                resource
            }
        });

    } catch (error) {
        console.error('Get resource error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Toggle bookmark for resource
router.post('/:id/bookmark', verifyToken, verifyStudent, async (req, res) => {
    try {
        const { id } = req.params;
        const resourceIndex = parseInt(id);

        if (resourceIndex < 0 || resourceIndex >= mentalHealthResources.length) {
            return res.status(404).json({
                success: false,
                message: 'Resource not found'
            });
        }

        const db = dbConnection.getDatabase();
        const usersCollection = db.collection('users');

        const user = await usersCollection.findOne({ _id: req.user._id });
        const bookmarkedResources = user?.profile?.bookmarkedResources || [];

        let newBookmarkedResources;
        let action;

        if (bookmarkedResources.includes(resourceIndex)) {
            // Remove bookmark
            newBookmarkedResources = bookmarkedResources.filter(index => index !== resourceIndex);
            action = 'removed';
        } else {
            // Add bookmark
            newBookmarkedResources = [...bookmarkedResources, resourceIndex];
            action = 'added';
        }

        // Update user's bookmarked resources
        await usersCollection.updateOne(
            { _id: req.user._id },
            { 
                $set: { 
                    'profile.bookmarkedResources': newBookmarkedResources,
                    'profile.resourcesBookmarked': newBookmarkedResources.length
                }
            }
        );

        res.json({
            success: true,
            message: `Resource bookmark ${action} successfully`,
            data: {
                isBookmarked: action === 'added',
                totalBookmarked: newBookmarkedResources.length
            }
        });

    } catch (error) {
        console.error('Toggle bookmark error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get bookmarked resources
router.get('/bookmarks/list', verifyToken, verifyStudent, async (req, res) => {
    try {
        const db = dbConnection.getDatabase();
        const usersCollection = db.collection('users');

        const user = await usersCollection.findOne({ _id: req.user._id });
        const bookmarkedResources = user?.profile?.bookmarkedResources || [];

        const bookmarkedList = bookmarkedResources
            .filter(index => index < mentalHealthResources.length)
            .map(index => ({
                ...mentalHealthResources[index],
                id: index,
                isBookmarked: true
            }));

        res.json({
            success: true,
            data: {
                resources: bookmarkedList,
                total: bookmarkedList.length
            }
        });

    } catch (error) {
        console.error('Get bookmarked resources error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get resource types
router.get('/types/list', (req, res) => {
    try {
        const types = [...new Set(mentalHealthResources.map(resource => resource.type))];
        
        res.json({
            success: true,
            data: {
                types
            }
        });

    } catch (error) {
        console.error('Get resource types error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;
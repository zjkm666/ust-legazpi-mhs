const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
function generateToken(user) {
    const payload = {
        id: user._id,
        email: user.email,
        type: user.type,
        firstName: user.firstName,
        lastName: user.lastName
    };
    
    return jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn
    });
}

/**
 * Validate email domain for UST Legazpi
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid domain
 */
function validateEmailDomain(email) {
    const allowedDomains = [
        'ust-legazpi.edu.ph',
        'ustl.edu.ph',
        'gmail.com', // For testing purposes
        'yahoo.com'  // For testing purposes
    ];
    
    const domain = email.split('@')[1];
    return allowedDomains.includes(domain);
}

/**
 * Verify JWT token middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function verifyToken(req, res, next) {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.'
        });
    }
    
    try {
        const decoded = jwt.verify(token, config.jwt.secret);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid token.'
        });
    }
}

/**
 * Check if user is admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function requireAdmin(req, res, next) {
    if (req.user.type !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }
    next();
}

/**
 * Alias for requireAdmin for backward compatibility
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function verifyAdmin(req, res, next) {
    return requireAdmin(req, res, next);
}

/**
 * Check if user is counselor
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function requireCounselor(req, res, next) {
    if (!['admin', 'counselor'].includes(req.user.type)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Counselor privileges required.'
        });
    }
    next();
}

/**
 * Check if user is student
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function verifyStudent(req, res, next) {
    if (req.user.type !== 'student') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Student privileges required.'
        });
    }
    next();
}

/**
 * Optional authentication middleware - doesn't require token but adds user info if present
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function optionalAuth(req, res, next) {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
        try {
            const decoded = jwt.verify(token, config.jwt.secret);
            req.user = decoded;
        } catch (error) {
            // Token is invalid, but we don't fail the request
            req.user = null;
        }
    } else {
        req.user = null;
    }
    
    next();
}

module.exports = {
    generateToken,
    validateEmailDomain,
    verifyToken,
    requireAdmin,
    verifyAdmin,
    requireCounselor,
    verifyStudent,
    optionalAuth
};
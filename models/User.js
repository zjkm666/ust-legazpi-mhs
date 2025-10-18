const bcrypt = require('bcryptjs');

class User {
    constructor(data) {
        this.email = data.email;
        this.password = data.password;
        this.type = data.type || 'student';
        this.firstName = data.firstName || '';
        this.lastName = data.lastName || '';
        this.studentId = data.studentId || null;
        this.isActive = data.isActive !== undefined ? data.isActive : true;
        this.createdAt = data.createdAt || new Date();
        this.lastLogin = data.lastLogin || null;
        this.profile = data.profile || {};
        
        // Student-specific fields
        if (this.type === 'student') {
            this.profile = {
                ...this.profile,
                yearLevel: data.yearLevel || null,
                course: data.course || null,
                emergencyContact: data.emergencyContact || null,
                counselingSessions: data.counselingSessions || 0,
                resourcesBookmarked: data.resourcesBookmarked || 0,
                moodLogs: data.moodLogs || 0
            };
        }
        
        // Admin-specific fields
        if (this.type === 'admin') {
            this.profile = {
                ...this.profile,
                role: data.role || 'Administrator',
                permissions: data.permissions || ['all']
            };
        }
    }

    // Hash password before saving
    async hashPassword() {
        if (this.password) {
            this.password = await bcrypt.hash(this.password, 12);
        }
    }

    // Verify password
    async verifyPassword(plainPassword) {
        return await bcrypt.compare(plainPassword, this.password);
    }

    // Convert to JSON (excluding password)
    toJSON() {
        const user = { ...this };
        delete user.password;
        return user;
    }

    // Validate user data
    validate() {
        const errors = [];

        // Email validation
        if (!this.email) {
            errors.push('Email is required');
        } else if (!this.email.endsWith('@ust-legazpi.edu.ph')) {
            errors.push('Email must be a valid UST-Legazpi email address');
        }

        // Password validation (only for new users or password updates)
        if (this.password !== undefined && !this.password) {
            errors.push('Password is required');
        } else if (this.password && this.password.length < 6) {
            errors.push('Password must be at least 6 characters long');
        }

        // Type validation
        if (!['student', 'admin'].includes(this.type)) {
            errors.push('Invalid user type');
        }

        // Student-specific validation
        if (this.type === 'student') {
            if (!this.firstName) errors.push('First name is required for students');
            if (!this.lastName) errors.push('Last name is required for students');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Create user from database document
    static fromDocument(doc) {
        return new User(doc);
    }

    // Get public profile (safe data for frontend)
    getPublicProfile() {
        return {
            _id: this._id,
            email: this.email,
            type: this.type,
            firstName: this.firstName,
            lastName: this.lastName,
            studentId: this.studentId,
            isActive: this.isActive,
            createdAt: this.createdAt,
            lastLogin: this.lastLogin,
            profile: this.profile
        };
    }

    // Update last login
    updateLastLogin() {
        this.lastLogin = new Date();
    }
}

module.exports = User;
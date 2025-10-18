class CounselingSession {
    constructor(data) {
        this.userId = data.userId;
        this.category = data.category;
        this.urgency = data.urgency || 'medium';
        this.status = data.status || 'pending'; // pending, active, completed, cancelled
        this.counselorId = data.counselorId || null;
        this.startTime = data.startTime || null;
        this.endTime = data.endTime || null;
        this.messages = data.messages || [];
        this.rating = data.rating || null;
        this.feedback = data.feedback || '';
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }

    // Add message to session
    addMessage(message) {
        this.messages.push({
            ...message,
            timestamp: new Date()
        });
        this.updatedAt = new Date();
    }

    // Start session
    startSession(counselorId) {
        this.status = 'active';
        this.counselorId = counselorId;
        this.startTime = new Date();
        this.updatedAt = new Date();
    }

    // End session
    endSession() {
        this.status = 'completed';
        this.endTime = new Date();
        this.updatedAt = new Date();
    }

    // Cancel session
    cancelSession() {
        this.status = 'cancelled';
        this.endTime = new Date();
        this.updatedAt = new Date();
    }

    // Rate session
    rateSession(rating, feedback = '') {
        this.rating = rating;
        this.feedback = feedback;
        this.updatedAt = new Date();
    }

    // Get session duration in minutes
    getDuration() {
        if (!this.startTime) return 0;
        
        const endTime = this.endTime || new Date();
        return Math.round((endTime - this.startTime) / (1000 * 60));
    }

    // Validate session data
    validate() {
        const errors = [];

        if (!this.userId) {
            errors.push('User ID is required');
        }

        if (!this.category) {
            errors.push('Category is required');
        }

        if (!['low', 'medium', 'high'].includes(this.urgency)) {
            errors.push('Invalid urgency level');
        }

        if (!['pending', 'active', 'completed', 'cancelled'].includes(this.status)) {
            errors.push('Invalid session status');
        }

        if (this.rating && (this.rating < 1 || this.rating > 5)) {
            errors.push('Rating must be between 1 and 5');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Convert to JSON
    toJSON() {
        return {
            _id: this._id,
            userId: this.userId,
            category: this.category,
            urgency: this.urgency,
            status: this.status,
            counselorId: this.counselorId,
            startTime: this.startTime,
            endTime: this.endTime,
            messages: this.messages,
            rating: this.rating,
            feedback: this.feedback,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            duration: this.getDuration()
        };
    }

    // Create session from database document
    static fromDocument(doc) {
        return new CounselingSession(doc);
    }
}

module.exports = CounselingSession;
class MoodLog {
    constructor(data) {
        this.userId = data.userId;
        this.mood = data.mood; // excellent, good, okay, difficult, struggling
        this.notes = data.notes || '';
        this.date = data.date || new Date();
        this.timestamp = data.timestamp || new Date();
    }

    // Validate mood data
    validate() {
        const errors = [];

        if (!this.userId) {
            errors.push('User ID is required');
        }

        if (!this.mood) {
            errors.push('Mood is required');
        }

        const validMoods = ['excellent', 'good', 'okay', 'difficult', 'struggling'];
        if (!validMoods.includes(this.mood)) {
            errors.push('Invalid mood value');
        }

        if (this.notes && this.notes.length > 500) {
            errors.push('Notes cannot exceed 500 characters');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Get mood score (for analytics)
    getMoodScore() {
        const moodScores = {
            'excellent': 5,
            'good': 4,
            'okay': 3,
            'difficult': 2,
            'struggling': 1
        };
        return moodScores[this.mood] || 0;
    }

    // Get mood emoji
    getMoodEmoji() {
        const moodEmojis = {
            'excellent': '😊',
            'good': '🙂',
            'okay': '😐',
            'difficult': '😟',
            'struggling': '😢'
        };
        return moodEmojis[this.mood] || '😐';
    }

    // Check if mood indicates need for support
    needsSupport() {
        return ['difficult', 'struggling'].includes(this.mood);
    }

    // Convert to JSON
    toJSON() {
        return {
            _id: this._id,
            userId: this.userId,
            mood: this.mood,
            notes: this.notes,
            date: this.date,
            timestamp: this.timestamp,
            moodScore: this.getMoodScore(),
            moodEmoji: this.getMoodEmoji(),
            needsSupport: this.needsSupport()
        };
    }

    // Create mood log from database document
    static fromDocument(doc) {
        return new MoodLog(doc);
    }

    // Get mood statistics for a user
    static async getMoodStats(db, userId, days = 30) {
        const collection = db.collection('mood_logs');
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const moodLogs = await collection.find({
            userId: userId,
            date: { $gte: startDate }
        }).sort({ date: 1 }).toArray();

        const stats = {
            total: moodLogs.length,
            averageScore: 0,
            moodDistribution: {},
            recentTrend: 'stable',
            needsSupportCount: 0
        };

        if (moodLogs.length > 0) {
            let totalScore = 0;
            moodLogs.forEach(log => {
                const moodLog = new MoodLog(log);
                totalScore += moodLog.getMoodScore();
                
                stats.moodDistribution[moodLog.mood] = (stats.moodDistribution[moodLog.mood] || 0) + 1;
                
                if (moodLog.needsSupport()) {
                    stats.needsSupportCount++;
                }
            });

            stats.averageScore = totalScore / moodLogs.length;

            // Calculate trend (simplified)
            if (moodLogs.length >= 7) {
                const recentWeek = moodLogs.slice(-7);
                const previousWeek = moodLogs.slice(-14, -7);
                
                if (recentWeek.length > 0 && previousWeek.length > 0) {
                    const recentAvg = recentWeek.reduce((sum, log) => sum + new MoodLog(log).getMoodScore(), 0) / recentWeek.length;
                    const previousAvg = previousWeek.reduce((sum, log) => sum + new MoodLog(log).getMoodScore(), 0) / previousWeek.length;
                    
                    if (recentAvg > previousAvg + 0.5) {
                        stats.recentTrend = 'improving';
                    } else if (recentAvg < previousAvg - 0.5) {
                        stats.recentTrend = 'declining';
                    }
                }
            }
        }

        return stats;
    }
}

module.exports = MoodLog;
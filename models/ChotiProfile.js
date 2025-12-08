const mongoose = require('mongoose');

// Track Choti's moods, preferences, and behavioral patterns
const moodEntrySchema = new mongoose.Schema({
    mood: {
        type: String,
        enum: ['happy', 'sad', 'angry', 'anxious', 'lonely', 'excited', 'stressed', 'peaceful', 'confused', 'hopeful', 'neutral'],
        required: true
    },
    intensity: {
        type: Number,
        min: 1,
        max: 10,
        default: 5
    },
    context: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const topicInterestSchema = new mongoose.Schema({
    topic: {
        type: String,
        required: true
    },
    frequency: {
        type: Number,
        default: 1
    },
    sentiment: {
        type: String,
        enum: ['positive', 'negative', 'neutral'],
        default: 'neutral'
    },
    lastMentioned: {
        type: Date,
        default: Date.now
    }
});

const chotiProfileSchema = new mongoose.Schema({
    oderId: {
        type: String,
        required: true,
        unique: true
    },
    // Emotional patterns
    moodHistory: [moodEntrySchema],
    dominantMood: {
        type: String,
        default: 'neutral'
    },

    // Topics she talks about frequently
    topicInterests: [topicInterestSchema],

    // Behavioral insights
    traits: {
        communicationStyle: {
            type: String,
            enum: ['expressive', 'reserved', 'mixed'],
            default: 'mixed'
        },
        emotionalOpenness: {
            type: Number,
            min: 1,
            max: 10,
            default: 5
        },
        supportPreference: {
            type: String,
            enum: ['advice', 'listening', 'distraction', 'validation'],
            default: 'listening'
        }
    },

    // Key memories and important things she's shared
    keyMemories: [{
        memory: String,
        category: {
            type: String,
            enum: ['achievement', 'struggle', 'relationship', 'dream', 'fear', 'joy', 'other']
        },
        importance: {
            type: Number,
            min: 1,
            max: 10,
            default: 5
        },
        dateShared: {
            type: Date,
            default: Date.now
        }
    }],

    // Summary insights (updated periodically)
    insights: {
        summary: String,
        lastUpdated: Date,
        conversationCount: {
            type: Number,
            default: 0
        },
        totalMessages: {
            type: Number,
            default: 0
        }
    },

    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Method to get profile summary for AI context
chotiProfileSchema.methods.getContextSummary = function () {
    const recentMoods = this.moodHistory.slice(-5).map(m => m.mood).join(', ');
    const topTopics = this.topicInterests
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5)
        .map(t => t.topic)
        .join(', ');
    const recentMemories = this.keyMemories
        .slice(-3)
        .map(m => m.memory)
        .join('; ');

    return {
        recentMoods: recentMoods || 'No mood data yet',
        topTopics: topTopics || 'No topics tracked yet',
        recentMemories: recentMemories || 'No memories shared yet',
        dominantMood: this.dominantMood,
        traits: this.traits,
        conversationCount: this.insights.conversationCount,
        summary: this.insights.summary || 'Still learning about Choti...'
    };
};

module.exports = mongoose.model('ChotiProfile', chotiProfileSchema);

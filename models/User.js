const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    nickname: {
        type: String,
        trim: true
    },
    hobby: {
        type: String,
        trim: true
    },
    passion: {
        type: String,
        trim: true
    },
    educationalBackground: {
        type: String,
        trim: true
    },
    bio: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Method to get profile summary for AI context
userSchema.methods.getProfileSummary = function() {
    return {
        name: this.name,
        nickname: this.nickname,
        hobby: this.hobby,
        passion: this.passion,
        educationalBackground: this.educationalBackground,
        bio: this.bio
    };
};

module.exports = mongoose.model('User', userSchema);

// models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/.+@.+\..+/, 'Please fill a valid email address']
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    channelName: {
        type: String,
        trim: true
    },
    profilePicture: {
        type: String,
        default: 'https://placehold.co/150x150/cccccc/000000?text=User'
    },
    subscribers: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        default: [] 
    }],
    watchHistory: [{
        video: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
        watchedAt: { type: Date, default: Date.now }
    }],
    watchLater: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video',
        default: []
    }],
    joinedDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

userSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
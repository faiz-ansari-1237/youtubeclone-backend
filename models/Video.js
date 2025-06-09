// models/Video.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const videoSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    videoUrl: {
        type: String,
        required: true
    },
    thumbnailUrl: {
        type: String,
        default: 'https://placehold.co/320x180/cccccc/000000?text=Video'
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    views: {
        type: Number,
        default: 0,
    },
    likes: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: []
    }],
    duration: {
        type: Number,
        required: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    viewedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: [],
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Video', videoSchema);
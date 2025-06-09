// models/Comment.js

const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    content: 
    { 
        type: String, 
        required: true 
    },
    videoId: 
    { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Video', 
        required: true 
    },
    userId: 
    { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true },
    username: 
    { 
        type: String, 
        required: true 
    },
    createdAt: 
    { 
        type: Date, 
        default: Date.now 
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null
    }
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
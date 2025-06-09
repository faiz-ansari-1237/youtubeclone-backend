// routes/comments.js

const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const User = require('../models/User');
const Video = require('../models/Video');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// Helper to nest comments
function nestComments(comments) {
    const map = {};
    const roots = [];
    comments.forEach(c => {
        map[c._id] = { ...c._doc, replies: [] };
    });
    comments.forEach(c => {
        if (c.parentId) {
            map[c.parentId]?.replies.push(map[c._id]);
        } else {
            roots.push(map[c._id]);
        }
    });
    return roots;
}

// GET all comments (optionally filter by videoId or userId)
router.get('/', async (req, res) => {
    try {
        const { videoId, userId, page = 1, limit = 10 } = req.query;
        let query = {};
        if (videoId) query.videoId = videoId;
        if (userId) query.userId = userId;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const comments = await Comment.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('userId', 'username profilePicture');

        const total = await Comment.countDocuments(query);

        res.json({
            comments: comments.map(c => ({
                content: c.content,
                userId: c.userId,
                videoId: c.videoId,
                createdAt: c.createdAt,
            })),
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET a single comment by ID
router.get('/:id', async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id)
            .populate('userId', 'username profilePicture');
        if (!comment) return res.status(404).json({ message: 'Comment not found' });
        res.json({
            content: comment.content,
            userId: comment.userId,
            videoId: comment.videoId,
            createdAt: comment.createdAt,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST a new comment or reply
router.post('/', auth, async (req, res) => {
    const { content, videoId, parentId } = req.body;
    const userId = req.user.id;

    const videoExists = await Video.findById(videoId);
    if (!videoExists) return res.status(404).json({ message: 'Video not found' });

    const userExists = await User.findById(userId);
    if (!userExists) return res.status(404).json({ message: 'User not found' });

    const username = userExists.username;

    const comment = new Comment({
        content,
        videoId,
        userId,
        username,
        parentId: parentId || null
    });

    try {
        const newComment = await comment.save();
        await newComment.populate('userId', 'username profilePicture');

        // Notify video owner if the comment is not by the owner
        const video = await Video.findById(videoId);
        if (video.owner.toString() !== req.user.id) {
            await Notification.create({
                user: video.owner,
                message: `${req.user.username} commented on your video "${video.title}"`,
                link: `/watch/${video._id}`,
            });
        }

        res.status(201).json({
            content: newComment.content,
            userId: newComment.userId,
            username: newComment.username,
            videoId: newComment.videoId,
            parentId: newComment.parentId,
            createdAt: newComment.createdAt,
            _id: newComment._id
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update
router.put('/:id', auth, async (req, res) => {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized' });
    }

    try {
        if (req.body.content != null) comment.content = req.body.content;

        const updatedComment = await comment.save();
        await updatedComment.populate('userId', 'username profilePicture');
        await updatedComment.populate('videoId', 'title');
        res.json(updatedComment);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete
router.delete('/:id', auth, async (req, res) => {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized' });
    }
    await Comment.deleteOne({ _id: req.params.id });
    res.json({ message: 'Comment deleted successfully' });
});

// GET nested comments for a video
router.get('/video/:videoId', async (req, res) => {
    try {
        const comments = await Comment.find({ videoId: req.params.videoId })
            .populate('userId', 'username profilePicture')
            .sort({ createdAt: 1 });
        const nested = nestComments(comments);
        res.json(nested);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
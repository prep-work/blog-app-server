const mongoose = require('mongoose')

const blogCommentsSchema = new mongoose.Schema(
    {
        text: {
            type: String,
            required: [true, 'Text is mandatory field']
        },
        commentedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
        },
        commentedPost: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'blogPost'
        },
        parentComment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'blogComments'
        },
        numberOfReplies: {
            type: Number,
        }
    },
    {
        timestamps: true, 
    },
    {
        collection: 'blogComments'
    }
) 

module.exports = mongoose.model.blogComments || mongoose.model('blogComments', blogCommentsSchema)
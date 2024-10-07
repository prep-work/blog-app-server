const express = require('express')
const router = express.Router()

const { check } = require('express-validator')
const { verify } = require('../middleware/verify')
const { newBlogPost, getAllUserPosts, getAllPostsExceptUser, editBlogPost, deleteBlogPost, editBlogLikes, getABlogDetails, addACommentToBlog, addAReplyToExistingComment, getAllReplyToTheCorrespondingComment } = require('../controllers/blogController')
const upload = require('../middleware/imageUpload')


router.post(
    '/newPost',
    upload.single('image'),
    verify,
    newBlogPost
)

router.put(
    '/editBlog/:blogID',
    upload.single('image'),
    verify,
    editBlogPost
)

router.delete(
    '/deleteBlog/:blogID',
    verify,
    deleteBlogPost
)

router.get(
    '/getAllPosts',
    // verify,
    getAllPostsExceptUser
)

router.get(
    '/getAllUserPosts',
    verify,
    getAllUserPosts
)

// Like in blog

router.get(
    '/blogDetails/:blogID',
    verify,
    getABlogDetails
)

router.post(
    '/editLike/:blogID',
    verify,
    editBlogLikes 
)

// Comments in blog 

router.post(
    '/addComment/:blogID',
    check('text')
        .not()
        .isEmpty(),
    verify,
    addACommentToBlog
)

router.patch(
    '/addReplyComment/:blogID',
    check('text')
        .not()
        .isEmpty(),
    check('parentCommand')
        .not()
        .isEmpty(),
    verify,
    addAReplyToExistingComment
)

router.get(
    '/replyComment/:commentID',
    verify,
    getAllReplyToTheCorrespondingComment
)

module.exports = router
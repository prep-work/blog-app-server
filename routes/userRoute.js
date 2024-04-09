const express = require('express')
const router = express.Router()

const { check } = require('express-validator')
const { login, logout } = require('../controllers/authController')
const validate = require('../middleware/validate')
const { verify } = require('../middleware/verify')
const { authenticateUser, editProfile, signUp, deleteProfile, newBlogPost, getAllUserPosts, getAllPostsExceptUser, editBlogPost, deleteBlogPost, editBlogLikes, getABlogLikesDetail } = require('../controllers/userController')
const upload = require('../middleware/imageUpload')


// User Routes 

router.post(
    '/signup',
    upload.single('image'),
    check('email')
        .isEmail()
        .withMessage('Enter a valid Email address')
        .normalizeEmail(),
    check('firstName')
        .not()
        .isEmpty()
        .withMessage('First name is a mandatory field')
        .trim()
        .escape(),
    check('lastName')
        .not()
        .isEmpty()
        .withMessage('First name is a mandatory field')
        .trim()
        .escape(),
    check('password')
        .notEmpty()
        .isLength({min: 8})
        .withMessage('Password length is atleast 8 character'),
    signUp
)

router.post(
    '/login',
    check('email')
        .isEmail()
        .withMessage('Enter a valid email address')
        .normalizeEmail(),
    check('password')
        .not()
        .isEmpty(),
    validate,
    login
)

router.get(
    '/authenticate',
    verify,
    authenticateUser
)

router.patch(
    '/editProfile',
    verify,
    editProfile
)

router.get(
    '/logout',
    verify,
    logout
)

router.delete(
    '/deleteProfile',
    verify,
    deleteProfile
)


// Blog Post Routes

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
    verify,
    getAllPostsExceptUser
)

router.get(
    '/getAllUserPosts',
    verify,
    getAllUserPosts
)

// Like in blog

router.get(
    '/blogLikes/:blogID',
    verify,
    getABlogLikesDetail
)

router.post(
    '/editLike/:blogID',
    verify,
    editBlogLikes 
)

module.exports = router
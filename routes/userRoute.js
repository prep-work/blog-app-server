const express = require('express')
const router = express.Router()

const { check } = require('express-validator')
const { login, logout } = require('../controllers/authController')
const validate = require('../middleware/validate')
const { verify } = require('../middleware/verify')
const { authenticateUser, editProfile, signUp, deleteProfile } = require('../controllers/userController')
const upload = require('../middleware/imageUpload')

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

module.exports = router
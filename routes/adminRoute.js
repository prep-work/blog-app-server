const express = require('express')
const router = express.Router()

const {check} = require('express-validator')
const validate = require('../middleware/validate')
const {login, logout} = require('../controllers/authController')
const { verify, verifyAmin } = require('../middleware/verify')
const { authenticateAdmin, createUser, editUser, deleteUser } = require('../controllers/adminController')
const upload = require('../middleware/imageUpload')

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
    verifyAmin,
    authenticateAdmin
)

router.post(
    '/createUser',
    // verify,
    // verifyAmin,
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
    validate,
    createUser
)

router.patch(
    '/editUser/:id',
    verify,
    verifyAmin,
    editUser
)

router.delete(
    '/deleteUser/:id',
    verify,
    verifyAmin,
    deleteUser
)

router.get(
    '/logout',
    verify,
    logout
)

module.exports = router

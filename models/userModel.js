const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const {ACCESS_TOKEN} = require('../configuration/config')

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String, 
            required: [true, 'First name is mandatory field'],
            max: 25,
        },
        lastName: {
            type: String, 
            required: [true, 'Last name is mandatory field'],
            max: 25,
        },
        email: {
            type: String, 
            required: [true, 'Email is mandatory field'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String, 
            required: [true, 'Password is mandatory field'],
            select: false, 
            max: 25,
        },
        image: {
            type: String, 
            required: true,
        },
        role: {
            type: String,
            required: true,
            default: 'user',
        }
    }, 
    {
        timestamps: true,
    }, 
    {
        collection: 'users'
    }
)

userSchema.pre('save', function(next) {
    const user = this

    if(!user.isModified('password')) return next()
    bcrypt.genSalt(10, (error, salt) => {
        if(error) return next(error)

        bcrypt.hash(user.password, salt, (error, hash) => {
            if(error) return next(error)

            user.password = hash
            next()
        })
    })
})

userSchema.methods.generateAccessJWT = function() {
    let payload = { id : this._id}
    return jwt.sign(payload, ACCESS_TOKEN, {expiresIn: '30d'})
}

module.exports = mongoose.model.users || mongoose.model('users', userSchema)

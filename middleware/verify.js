const jwt = require('jsonwebtoken')
const { ACCESS_TOKEN } = require('../configuration/config')
const userModel = require('../models/userModel')

const verify = async (request, response, next) => {
    try {
        const authHeader = request.headers['cookie']

        if(!authHeader){
            return response.status(401).send({ message: 'Token not found' })
        }

        const cookie = authHeader.split('=')[1]
        const accessToken = cookie.split(';')[0]

        jwt.verify(cookie, ACCESS_TOKEN, async (error, decoded) => {
            if(error) {
                return response.status(401).json({ message:'Session expired' })
            }           
            const {id} = decoded
            const existingUser = await userModel.findById({_id: id})
            const password = existingUser?._doc?.password
            if(password) {
                const {password, ...data} = existingUser?._doc
                request.user = data
                next()
            } else {
                request.user = existingUser
                next()
            }
        })
    }
    catch(error) {
        response.status(500).json({ message: error.message })
    }
}

const verifyAmin = (request, response, next) => {
    try{
        const {role} = request.user
        if(role != 'admin') {
            return response.status(401).json({ message: 'Unauthorized access' })
        }
        next()
    }
    catch(error) {
        response.status(500).json({ message: error.message })
    }
    
}

module.exports = {
    verify,
    verifyAmin
}
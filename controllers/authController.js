const userModel = require('../models/userModel')
const initialData = require('../database/initialData')

const bcrypt = require('bcrypt')

const login = async (request, response) => {
    const allUserData = await userModel.find()
    if(allUserData.length == 0) {
        const initialUser = new userModel(initialData)
        await initialUser.save()
    }    

    const {email} = request.body 
    try{
        const existingUser = await userModel.findOne({ email }).select('+password') 
        if(!existingUser) {
            return response.status(401).send({ message: 'Invalid email address' })
        }

        const validatePassword = await bcrypt.compare(`${request.body.password}`, existingUser.password)
        if(!validatePassword) {
            return response.status(401).send({ message: 'Invalid password' })
        }

        const {password, _id, createdAt, __v, updatedAt, ...userData} = existingUser?._doc

        let options = {
            httpOnly: true,
            secure: true,
            sameSite: 'None'
        }
        const token = existingUser.generateAccessJWT()     
        response.cookie('SessionID', token, options)
        response.status(200).send({ message: 'Login Successfully', userData: userData })
    } 
    catch(error) {
        response.status(500).send({ message: error.message })
    }
}

const logout = async (request, response) => {
    console.log("first")
    const authHeader = request.headers['cookie']
    try {
        if(!authHeader){
            return response.status(204).send({ message: 'No Content' })
        }
    
        const cookie = authHeader.split('=')[1]
        const accessToken = cookie.split(';')[0]
    
        response.setHeader('Clear-Site-Data', '"cookies"')
        response.status(200).send({ message: "Logged out!" })
    }
    catch(error) {
        response.status(500).send({ message: error.message })
    }
    
}

module.exports = {
    login,
    logout
}
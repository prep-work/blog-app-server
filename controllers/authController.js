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
        const existingUser = await userModel.findOne({ email }).select('+password') // default the mongoose doesn't provide password
        if(!existingUser) {
            return response.status(401).send({status: 'failed', code: 401, message: 'Invalid email address'})
        }

        const validatePassword = await bcrypt.compare(`${request.body.password}`, existingUser.password)
        if(!validatePassword) {
            return response.status(401).send({status: 'failed', code: 401, message: 'Invalid password'})
        }

        let options = {
            // maxAge: 30 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: true,
            sameSite: 'None'
        }

        const token = existingUser.generateAccessJWT()     
        response.cookie('SessionID', token, options)
        response.status(200).send({status: 'success', code: 200, data: [token], message: 'Login Successfully'})
    } 
    catch(error) {
        response.status(500).send({status: 'error', code:500, message: error.message})
    }
}

const logout = async (request, response) => {
    const authHeader = request.headers['cookie']
    if(!authHeader){
        return response.status(204).send({status: 'error', code: 204, message: 'No Content'})
    }

    const cookie = authHeader.split('=')[1]
    const accessToken = cookie.split(';')[0]

    response.setHeader('Clear-Site-Data', '"cookies"')
    response.status(200).send({status: "success", code: 200, message: "Logged out!"})
}

module.exports = {
    login,
    logout
}
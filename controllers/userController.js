const blogCommentsModel = require("../models/blogCommentsModel")
const blogLikesModel = require("../models/blogLikesModel")
const blogPostModel = require("../models/blogPostModel")
const userModel = require("../models/userModel")
const {ObjectId} = require('mongodb')

// authenticateUser authenticate whether he is valid user and he is logged in 
const authenticateUser = (request, response) => {
    response.status(200).send({ message: `Verified User` })
}

// signUp create new user
const signUp = async (request, response) => {
    const {firstName, lastName, email, password} = request.body
    const {filename} = request.file

    try{
        const existingUser = await userModel.findOne({email})
        if(existingUser) {
            return response.status(409).send({ message: 'Email id already exist' })
        }
        const image = 'public/images/' + filename
        const userToBeRegistered = new userModel({firstName, lastName, email, password, image})

        await userToBeRegistered.save()
        const {password: userPassword, _id: userId, ...userData} = userToBeRegistered?._doc

        let options = {
            httpOnly: true,
            secure: true,
            sameSite: 'None'
        }
        const token = userToBeRegistered.generateAccessJWT()
        response.cookie('SessionID', token, options)
        response.status(201).send({ message: 'User created successfully', userData})
    } 
    catch(error) {
        response.status(500).send({ message: error.message})
    }
}

// editProfile edit the user profile
const editProfile = async (request, response) => {
    const {_id} = request.user
    const userDetail = request.body
    try{
        const user = await userModel.findOne({ _id })
        if(user) {
            if(userDetail) {
                // update the existing user with new values 
                Object.keys(userDetail).forEach( detail => {
                    if( userDetail[detail] !== undefined) {
                        user[detail] = userDetail[detail]
                    }
                })
                const updatedUser = await user.save()
                const {role: userRole, ...userData} = updatedUser._doc
                response.status(201).send({ message: 'User updated successfully' })
            } 
            else {
                response.status(400).send({ message: 'No user data provided to update' })
            }
        } 
        else {
            response.status(404).send({ message: 'User not found' })
        }
    }
    catch(error) {
        response.status(500).json({ message: error.message })
    }
}

// deleteProfile delete the user profile
const deleteProfile = async (request, response) => {
    const id = request.user._id
    try {
        const user = await userModel.findOne({ _id: id })
        if(user) {
            await userModel.deleteOne({ _id: id })
            response.status(201).send({ message: 'User deleted successfully' })
        }
        else {
            response.status(404).send({ message: 'User not found' })
        }

    }
    catch(error) {
        response.status(500).json({ message: error.message })
    }
}

module.exports = {
    authenticateUser,
    signUp,
    editProfile,
    deleteProfile,

}
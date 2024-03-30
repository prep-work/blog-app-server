const userModel = require("../models/userModel")

const authenticateUser = (request, response) => {
    response.status(200).send({status: 'success', code: 200,  message: ` Welcome to User Dashboard`})
}

const signUp = async (request, response) => {
    const {firstName, lastName, email, password} = request.body
    const {filename} = request.file

    try{
        const existingUser = await userModel.findOne({email})
        if(existingUser) {
            response.status(409).send({status: 'success', code: 409, message: 'Email id already exist'})
        }
        const image = 'public/images/' + filename
        const userToBeRegistered = new userModel({firstName, lastName, email, password, image})

        await userToBeRegistered.save()
        response.status(201).send({status: 'success', code: 201, message: 'User created successfully'})
    } 
    catch(error) {
        response.status(500).send({status: 'error', code:500, message: error.message})
    }
}

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
                response.status(201).send({status: 'success', code: 201, message: 'User updated successfully'})
            } 
            else {
                response.status(400).send({status: 'error', code: 400, message: 'No user data provided to update'})
            }
        } 
        else {
            response.status(404).send({status: 'error', code: 404, message: 'User not found'})
        }
    }
    catch(error) {
        response.status(500).json({status: 'error', code:500, message: error.message})
    }
}

const deleteProfile = async (request, response) => {
    const id = request.user._id
    try {
        const user = await userModel.findOne({ _id: id })
        if(user) {
            await userModel.deleteOne({ _id: id })
            response.status(201).send({status: 'success', code: 201, message: 'User deleted successfully'})
        }
        else {
            response.status(404).send({status: 'error', code: 404, message: 'User not found'})
        }

    }
    catch(error) {
        response.status(500).json({status: 'error', code:500, message: error.message,})
    }
}

module.exports = {
    authenticateUser,
    signUp,
    editProfile,
    deleteProfile,
}
const userModel = require("../models/userModel")

const authenticateAdmin = (request, response) => {
    response.status(200).send({ message: `${request.user.firstName} Welcome to Admin Dashboard` })
}

const createUser = async (request, response) => {
    const {firstName, lastName, email, password} = request.body
    const {filename} = request.file

    try{
        const existingUser = await userModel.findOne({email})
        if(existingUser) {
            response.status(409).send({ message: 'Email id already exist' })
        }
        const image = 'public/images/' + filename
        const userToBeRegistered = new userModel({firstName, lastName, email, password, image})

        const newUser = await userToBeRegistered.save()
        const {password: userPassword, ...user_data} = newUser._doc
        response.status(201).send({ data: [user_data], message: 'User created successfully'})
    } 
    catch(error) {
        response.status(500).json({ message: error.message })
    }
}

const editUser = async (request, response) => {
    const {id} = request.params
    const userDetail = request.body
    console.log(userDetail)
    try{
        const user = await userModel.findOne({ _id: id})
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
                response.status(201).send({ data: [userData], message: 'User updated successfully' })
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

const deleteUser = async (request, response) => {
    const {id} = request.params
    console.log(id)
    try {
        const user = await userModel.findOne({ _id: id })
        if(user) {
            await userModel.deleteOne({ _id: id })
            response.status(200).send({ data: [user], message: 'User deleted successfully' })
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
    authenticateAdmin,
    createUser,
    editUser,
    deleteUser
}
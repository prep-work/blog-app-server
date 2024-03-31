const blogPostModel = require("../models/blogPostModel")
const userModel = require("../models/userModel")

// authenticateUser authenticate whether he is valid user and he is logged in 
const authenticateUser = (request, response) => {
    response.status(200).send({status: 'success', code: 200,  message: ` Welcome to User Dashboard`})
}

// signUp create new user
const signUp = async (request, response) => {
    const {firstName, lastName, email, password} = request.body
    const {filename} = request.file

    try{
        const existingUser = await userModel.findOne({email})
        if(existingUser) {
            response.status(409).send({status: 'error', code: 409, message: 'Email id already exist'})
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

// deleteProfile delete the user profile
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


// ------Blog Controller------- 

// newBlogPost creates a new blog 
const newBlogPost = async (request, response) => {
    const {title, description, blogContent} = request.body
    const {filename} = request.file
    const {email} = request.user 

    try{
        const existingAuthor = await userModel.findOne({email})
        if(!existingAuthor) {
            response.status(404).send({status: 'error', code: 404, message: 'User not found'})
        }
        const image = 'public/images/' + filename

        const newBlog = new blogPostModel({ author: existingAuthor._id, title, description, blogContent, image})
        await newBlog.save()
        response.status(201).send({status: 'success', code: 201, message: 'Blog successfully published'})

    } catch(error) {
        response.status(500).send({status: 'error', code:500, message: error.message})
    }
}

// editBlogPost edit the existing blog from the author 
const editBlogPost = async (request, response) => {
    const {blogID} = request.params
    const {_id} = request.user
    const blogDetails = request.body
    const filename = request.file ? request.file.filename : undefined;

    try{
        if(blogDetails || filename) {
            const blog = await blogPostModel.findOne({ _id: blogID})
            if(!blog) {
                response.status(200).send({status: 'success', code: 200, message: 'No Blog Found '})
            }
            Object.keys(blogDetails).forEach( detail => {
                if( blogDetails[detail] !== undefined) {
                    blog[detail] = blogDetails[detail]
                }
            })
            if(filename) {
                blog.image = filename
            }
            await blog.save()
            // response.status(201).send({status: 'success', code: 201, message: 'User updated successfully'})
            response.status(201).send({status: 'success', code: 201, message: 'Blog updated successfully'})
        } 
        else {
            response.status(400).send({status: 'error', code: 400, message: 'No user data provided to update'})
        }
    }
    catch(error) {
        response.status(500).json({status: 'error', code:500, message: error.message})
    }
}

// deleteUser delete the existing blog from the author
const deleteBlogPost = async (request, response) => {
    const {blogID} = request.params
    try {
        const blog = await blogPostModel.findOne({ _id: blogID})
        console.log(blog)
        if(!blog) {
            response.status(200).send({status: 'success', code: 200, message: 'No Blog Found '})
        }
        await blogPostModel.deleteOne({ _id: blogID})
        response.status(200).send({status: 'success', code: 200, message: 'Blog deleted successfully'})
    }
    catch(error) {
        response.status(500).json({status: 'error', code:500, message: error.message})
    }
}

// getAllUserPosts get the all posts of the author 
const getAllUserPosts = async (request, response) => {
    const {_id} = request.user
    try {
        const allUserPost = await blogPostModel.find({ author: _id }).lean().populate('author', 'firstName lastName image')
        allUserPost.forEach( user => {
            // const path = (__dirname).split('/controllers')[0] + user.image
            const baseUrl = 'http://localhost:3500/api/v1/';
            allUserPost.forEach(user => {
                if (!user.image.includes(baseUrl)) {
                    user.image = baseUrl + user.image;
                }

                if (!user.author.image.includes(baseUrl)) {
                    user.author.image = baseUrl + user.author.image;
                }
            })
        })
        response.status(200).send(allUserPost)
    } 
    catch(error) {
        response.status(500).send({status: 'error', code:500, message: error.message})
    }
}

// getAllPosts returns all the posts except the author 
const getAllPostsExceptUser = async (request, response) => {

}



module.exports = {
    authenticateUser,
    signUp,
    editProfile,
    deleteProfile,
    newBlogPost,
    editBlogPost,
    deleteBlogPost,
    getAllUserPosts,
    getAllPostsExceptUser
}
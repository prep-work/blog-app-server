const blogLikesModel = require("../models/blogLikesModel")
const blogPostModel = require("../models/blogPostModel")
const userModel = require("../models/userModel")
const {ObjectId} = require('mongodb')

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
            allUserPost.forEach(blog => {
                if (!blog.image.includes(baseUrl)) {
                    blog.image = baseUrl + blog.image;
                }

                if (!blog.author.image.includes(baseUrl)) {
                    blog.author.image = baseUrl + blog.author.image;
                }
            })
        })
        response.status(200).send({status: 'success', code: 200, data: allUserPost, message: 'Authors Blog'})
    } 
    catch(error) {
        response.status(500).send({status: 'error', code:500, message: error.message})
    }
}

// getAllPosts returns all the posts except the author 
const getAllPostsExceptUser = async (request, response) => {
    const {_id} = request.user

    try {

        const blogPosts = await blogPostModel.aggregate([
            {
              $lookup: {
                from: "bloglikes",
                localField: "_id",
                foreignField: "likedPost",
                as: "likes"
              }
            },
            {
                $addFields: {
                  "image": {
                    $concat: ["http://localhost:3500/api/v1/", "$image"]
                  }
                }
            },
            {
                $addFields: {
                    likesCount: {
                    $size: {
                        $ifNull: ["$likes", []]
                    }
                   }
                }
             },
            {
                $lookup: {
                from: "users",
                localField: "author",
                foreignField: "_id",
                as: "author"
                }
            },
            {
                $addFields: {
                author: {
                    $first: "$author"
               }
                }
             },
            {
                $match: {
                    "author._id": { $ne: _id}
                }
            },
            {
                $addFields: {
                    "author.image": {
                        $concat: ["http://localhost:3500/api/v1/", "$author.image"]
                    }
                }
            },
            {
                $project: {
                "author.password": 0
                }
            },
            {
                $set: {
                  isUserLikedPost: {
                    $anyElementTrue: {
                      $map: {
                        input: "$likes",
                        as: "like",
                        in: {
                        //   $eq: ["$$like.likedUser", ObjectId(_id)]
                          $eq: ["$$like.likedUser", _id]
                        }
                      }
                    }
                  }
                }
            },
        ])
        response.status(200).send({status: 'success', code: 200, data: blogPosts, message: 'Recommended Blog'})
    }
    catch(error) {
        response.status(500).send({status: 'error', code:500, message: error.message})
    }
}


// Blog Like 

// editBlogLikes add like or remove dislike 
const editBlogLikes = async (request, response) => {
    const {blogID} = request.params
    const userID = request.user._id
    const {firstName} = request.user
    const {isBlogLiked} = request.body

    try{
        const isLiked = await blogLikesModel.findOne({
            likedUser: userID,
            likedPost: blogID
        })

        if(!isBlogLiked && isLiked  == null) {
            const like = await new blogLikesModel({
                likedUser: userID,
                likedPost: blogID
            })
            await like.save()
            response.status(201).send({status: 'success', code: 201, message: "You liked this post"})
        }
        if(isBlogLiked && isLiked) {
            await blogLikesModel.deleteOne({
                _id: isLiked._id
            })
            response.status(200).send({status: 'success', code: 200, message: "You removed like from this post"})
        }

    }
    catch(error) {
        response.status(500).send({status: 'error', code:500, message: error.message})
    }
}

const getABlogLikesDetail = async (request, response) => {
    const {blogID} = request.params
    const blogObjectID = new ObjectId(blogID)
    const userID = request.user._id
    try{
        const blogPosts = await blogPostModel.aggregate([
            {
                $match: {
                    _id: blogObjectID
                }
            },
            {
                $lookup: {
                    from: "bloglikes",
                    localField: "_id",
                    foreignField: "likedPost",
                    as: "likes"
                }
            },
            {
                $addFields: {
                  "image": {
                    $concat: ["http://localhost:3500/api/v1/", "$image"]
                  }
                }
            },
            {
                $addFields: {
                    likesCount: {
                    $size: {
                        $ifNull: ["$likes", []]
                    }
                   }
                }
            },
            
            {
                $lookup: {
                from: "users",
                localField: "author",
                foreignField: "_id",
                as: "author"
                }
            },
            {
                $addFields: {
                    author: {
                        $first: "$author"
                   }
                }
            },
            {
                $match: {
                    "author._id": { $ne: userID}
                }
            },
            {
                $addFields: {
                  "author.image": {
                    $concat: ["http://localhost:3500/api/v1/", "$author.image"]
                  }
                }
              },
            {
                $project: {
                "author.password": 0
                }
            },
            {
                $set: {
                    isUserLikedPost: {
                        $anyElementTrue: {
                        $map: {
                            input: "$likes",
                            as: "like",
                            in: {
                            $eq: ["$$like.likedUser", userID]
                            }
                        }
                        }
                    }
                }
            },
            
          ])

          response.status(200).send({status: 'success', code: 200, data: blogPosts, message: 'All data of this specific blog'})
    }
    catch(error) {
        response.status(500).send({status: 'error', code:500, message: error.message})
    }
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
    getAllPostsExceptUser,
    getABlogLikesDetail,
    editBlogLikes
}
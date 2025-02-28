const blogCommentsModel = require("../models/blogCommentsModel")
const blogLikesModel = require("../models/blogLikesModel")
const blogPostModel = require("../models/blogPostModel")
const userModel = require("../models/userModel")
const {ObjectId} = require('mongodb')

const   newBlogPost = async (request, response) => {
    const {title, description, blogContent} = request.body
    const {filename} = request.file
    const {email} = request.user 

    try{
        const existingAuthor = await userModel.findOne({email})
        if(!existingAuthor) {
            response.status(404).send({ message: 'User not found' })
        }
        const image = 'public/images/' + filename

        const newBlog = new blogPostModel({ author: existingAuthor._id, title, description, blogContent, image})
        console.log(newBlog)
        await newBlog.save()
        response.status(201).send({ message: 'Blog successfully published' })

    } catch(error) {
        response.status(500).send({ message: error.message })
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
                response.status(200).send({ message: 'No Blog Found ' })
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
            response.status(201).send({ message: 'Blog updated successfully' })
        } 
        else {
            response.status(400).send({ message: 'No user data provided to update' })
        }
    }
    catch(error) {
        response.status(500).json({ message: error.message })
    }
}

// deleteUser delete the existing blog from the author
const deleteBlogPost = async (request, response) => {
    const {blogID} = request.params
    try {
        const blog = await blogPostModel.findOne({ _id: blogID})
        if(!blog) {
            response.status(200).send({ message: 'No Blog Found ' })
        }
        await blogPostModel.deleteOne({ _id: blogID})
        response.status(200).send({ message: 'Blog deleted successfully' })
    }
    catch(error) {
        response.status(500).json({ message: error.message })
    }
}

// getAllUserPosts get the all posts of the author 
const getAllUserPosts = async (request, response) => {
    const {_id} = request.user
    try {
        const allUserPost = await blogPostModel.find({ author: _id }).lean().populate('author', 'firstName lastName image')
        allUserPost.forEach( user => {
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
        response.status(200).send({ data: allUserPost, message: 'Authors Blog'})
    } 
    catch(error) {
        response.status(500).send({ message: error.message})
    }
}

// getAllPosts returns all the posts except the author 
const getAllPostsExceptUser = async (request, response) => {
    const {_id} = request.user || {}

    try {

        // Base pipeline, common for both cases
        const pipeline = [
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
                    image: {
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
            }
        ]

        // If _id is present, add filtering and 'isUserLikedPost' calculation
        if (_id) {
            pipeline.push(
                {
                    $match: {
                        "author._id": { $ne: _id }
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
                                        $eq: ["$$like.likedUser", _id]
                                    }
                                }
                            }
                        }
                    }
                }
            )
        } else {
            // If _id is not present, set 'isUserLikedPost' to false
            pipeline.push(
                {
                    $set: {
                        isUserLikedPost: false
                    }
                }
            )
        }

        const blogPosts = await blogPostModel.aggregate(pipeline)

        response.status(200).send({ data: blogPosts, message: 'Recommended Blog' })
    }
    catch(error) {
        response.status(500).send({ message: error.message })
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
            response.status(201).send({ message: "You liked this post" })
        }
        if(isBlogLiked && isLiked) {
            await blogLikesModel.deleteOne({
                _id: isLiked._id
            })
            response.status(200).send({ message: "You removed like from this post" })
        }

    }
    catch(error) {
        response.status(500).send({ message: error.message })
    }
}

const getABlogDetails = async (request, response) => {
    const {blogID} = request.params
    const blogObjectID = new ObjectId(blogID)
    const userID = request.user._id
    try{
        const blogPosts = await blogPostModel.aggregate(
            [
                {
                  $match: {
                    _id: blogObjectID,
                  },
                },
                {
                  $lookup: {
                    from: "bloglikes",
                    localField: "_id",
                    foreignField: "likedPost",
                    as: "likes",
                  },
                },
                {
                  $addFields: {
                    likeCount: {
                      $size: {
                        $ifNull: ["$likes", []],
                      },
                    },
                  },
                },
                {
                  $set: {
                    isUserLikedPost: {
                      $anyElementTrue: {
                        $map: {
                          input: "$likes",
                          as: "like",
                          in: {
                            $eq: [
                              "$$like.likedUser",
                              userID,
                            ],
                          },
                        },
                      },
                    },
                  },
                },
                {
                  $lookup: {
                    from: "blogcomments",
                    localField: "_id",
                    foreignField: "commentedPost",
                    as: "comments",
                    pipeline: [
                      {
                        $match: {
                          parentComment: null,
                        },
                      },
                    ]
                  },
                },
                {
                        $set:{
                          isUserComment: {
                            $anyElementTrue: {
                              $map: {
                                input: "$comments",
                                as: "comment",
                                in: {
                                  $eq: [
                                    "$$comment.commentedBy",
                                    "$$comment.author._id",
                                  ],
                                },
                              },
                            },
                          },
                        },
                      },
                {
                  $unwind: "$comments",
                },
                {
                $set: {
                  "comments.isUserComment": {
                    $eq: ["$comments.commentedBy", userID]
                  }
                }
              },
                {
                  $lookup: {
                    from: "users",
                    localField: "comments.commentedBy",
                    foreignField: "_id",
                    as: "comments.author",
                    pipeline: [
                      {
                        $project: {
                          firstName: 1,
                          lastName: 1,
                          image: {
                            $concat: ["http://localhost:3500/api/v1/", "$image"],
                          }
                        },
                      },
                    ],
                  },
                },
                {
                  $addFields: {
                    "comments.author": {
                      $first: "$comments.author",
                    },
                  },
                },
                {
                  $group: {
                    _id: "$_id",
                    isUserLikedPost: {
                      $first: "$isUserLikedPost",
                    },
                    likeCount: { $first: "$likeCount" },
                    // author: { $first: "$author" },
                    isUserComment: { $first: "$isUserComment"},
                    comments: { $push: "$comments" },
                  },
                },
              
                {
                  $project: {
                    likeCount: 1,
                    isUserLikedPost: 1,
                    noOfCommentReplies: 1,
                    comments: 1,
                    author: 1,
                  },
                },
              ]
        )
        console.log(blogPosts)

          response.status(200).send({ message: 'All data of this specific blog' })
    }
    catch(error) {
        response.status(500).send({ message: error.message })
    }
}



// Blog Comments 


const addACommentToBlog = async (request, response) => {
    const {_id} = request.user
    const { blogID } = request.params
    const { commentText } = request.body
    // const parentId = request.body.parentId ? request.body.parentId : null
    const initialReply = 0

    console.log(request.body)
    try{
        const blog = await blogPostModel.findOne({ _id: blogID })
        if(!blog) {
            response.status(404).send({ message: 'Blog not found' })
        }

        const newComment = new blogCommentsModel(
            { 
                text: commentText,
                commentedBy: _id,
                commentedPost: blogID,
                parentComment: null,
                numberOfReplies: initialReply,
            }
        )

        await newComment.save()
        response.status(201).send({ message: 'Comment added' })
    }
    catch(error) {
        response.status(500).send({ message: error.message })
    }
}

const addAReplyToExistingComment = async (request, response) => {
    const { blogID } = request.params
    const { text, parentComment } = request.body
    const userID = request.user._id
    const initialReply = 0
    console.log(blogID)
    console.log(request.body)

    const existingParentComment = await blogCommentsModel.findOne({ _id: parentComment})
    existingParentComment.numberOfReplies += 1
    await existingParentComment.save()
    console.log(existingParentComment)

    const newReplyComment = new blogCommentsModel(
        {
            text: text,
            commentedBy: userID,
            commentedPost: existingParentComment.commentedPost,
            parentComment: parentComment,
            numberOfReplies: initialReply
        }
    )
    await newReplyComment.save()
    console.log(newReplyComment)

    response.status(201).send({ message: 'Reply Comment were added' })
}

const getAllReplyToTheCorrespondingComment = async (request, response) => {
    const {commentID} = request.params
    const commentObjectID = new ObjectId(commentID)
    const userID = request.user._id

    const replyComment = await blogCommentsModel.aggregate(
        [
            {
              $match: {
                parentComment: commentObjectID
              }
            },
            {
              $lookup: {
                from: "users",
                localField: "commentedBy",
                foreignField: "_id",
                as: "author",
                pipeline: [
                  {
                    $project: {
                      _id: 1,
                      firstName: 1,
                      lastName: 1,
                      image: {
                        $concat: [
                          "http://localhost:3500/api/v1/",
                          "$image",
                        ],
                      },
                    }
                  }
                ]
              }
            },
            {
              $addFields: {
                "author": {
                  $first: "$author",
                },
              },
            },
            {
                $set: {
                    "isUserComment": {
                        $eq: ["$commentedBy", userID]
                    }
                }
            },
            {
              $project: {
                commentedBy: 0,
                commentedPost: 0,
                parentComment: 0,
                updatedAt: 0,
              }
            }
          ]
    )

    response.status(200).send({ data: replyComment, message: 'Reply Comment were send' })
}

module.exports = {

    newBlogPost,
    editBlogPost,
    deleteBlogPost,

    getAllUserPosts,
    getAllPostsExceptUser,

    getABlogDetails,
    editBlogLikes,

    addACommentToBlog,
    addAReplyToExistingComment,
    getAllReplyToTheCorrespondingComment
}
const blogsRouter = require('express').Router()
const Blog = require('../models/note')

blogsRouter.get('/', (request, response) => {
  Blog.find({}).then(notes => {
    response.json(notes)
  })
})

blogRouter.post('/', (request, response, next) => {
  const blog = new Blog(request.body)

  blog.save().then(result => {
    response.status(201).json(result)
  })
  .catch(error => next(error))
})

module.exports = blogsRouter
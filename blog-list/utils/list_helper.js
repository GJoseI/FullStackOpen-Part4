const { groupBy } = require('lodash')
const countBy = require('lodash/countBy')
const maxBy = require('lodash/maxBy')

const dummy = blogs => {
  return 1
}

const totalLikes = blogs => {
  return blogs.reduce((sum, blog) => sum + blog.likes, 0)
}

const favoriteBlog = blogs => {
  return blogs.length === 0
    ? 0
    : blogs.reduce(
        (max, blog) => (blog.likes > max.likes ? blog : max),
        blogs[0],
      )
}

const mostBlogs = blogs => {
  const authors = countBy(blogs, blog => blog.author)
  const max = maxBy(Object.entries(authors), author => author[1])
  return blogs.length === 0 ? 0 : { author: max[0], blogs: max[1] }
}

const mostLikes = blogs => {
  const authorBlogs = groupBy(blogs, blog => blog.author)
  const authorLikes = Object.entries(authorBlogs).map(author => ({
    author: author[0],
    likes: author[1].reduce((likesSum, blog) => likesSum + blog.likes, 0),
  }))
  const maxLikes = maxBy(authorLikes, author => author.likes)
  return blogs.length === 0 ? 0 : maxLikes
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes,
}

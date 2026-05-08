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

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs
}

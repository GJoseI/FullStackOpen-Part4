const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
    let total = 0
    blogs.array.forEach(blog => {
        total += blog.likes
    });

    return total
}

module.exports = {
  dummy
}
const assert = require('node:assert')
const { test, after, beforeEach, describe } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const bcrypt = require('bcrypt')
const User = require('../models/user')
const helper = require('./test_helper')
const Blog = require('../models/blog')

const api = supertest(app)

describe('when there is initially some notes saved', () => {
  beforeEach(async () => {
    await Blog.deleteMany({})
    await User.deleteMany({})

    await Blog.insertMany(helper.initialBlogs)
  })

  test('all blogs are returned', async () => {
    const response = await api.get('/api/blogs')

    assert.strictEqual(response.body.length, helper.initialBlogs.length)
  })

  test('id property is named correctly', async () => {
    const blogs = await helper.blogsInDb()
    const blogToView = blogs[0]
    const result = blogToView.hasOwnProperty('id')

    assert(result)
  })

  test('a valid blog can be added ', async () => {
    const newBlog = {
      title: 'Blog añadido en test',
      author: 'Jose',
      url: 'https://homepages.cwi.nl/~storm/teaching/reader/Dijkstra68.pdf',
      likes: 5,
    }

    await api
      .post('/api/users')
      .send({ username: 'prueba', password: 'pruebacontra' })
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const login = await api
      .post('/api/login')
      .send({ username: 'prueba', password: 'pruebacontra' })
      .expect(200)
      .expect('Content-Type', /application\/json/)

    await api
      .post('/api/blogs')
      .send(newBlog)
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1)

    const title = blogsAtEnd.map(n => n.title)

    assert(title.includes('Blog añadido en test'))
  })

  test('blog with no likes defaults to 0 ', async () => {
    const newBlog = {
      title: 'Quiero keke',
      author: 'La Cobra',
      url: 'https://homepages.cwi.nl/~storm/teaching/reader/Dijkstra68.pdf',
    }

    await api
      .post('/api/users')
      .send({ username: 'prueba', password: 'pruebacontra' })
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const login = await api
      .post('/api/login')
      .send({ username: 'prueba', password: 'pruebacontra' })
      .expect(200)
      .expect('Content-Type', /application\/json/)

    await api
      .post('/api/blogs')
      .send(newBlog)
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(201)
      .expect('Content-Type', /application\/json/)
    const blogsAtEnd = await helper.blogsInDb()
    const lastLikes = blogsAtEnd[helper.initialBlogs.length].likes

    assert.deepStrictEqual(lastLikes, 0)
  })

  test('blog without title is not added', async () => {
    const newBlog = {
      author: 'Yo',
      url: 'https://homepages.cwi.nl/~storm/teaching/reader/Dijkstra68.pdf',
    }

    await api
      .post('/api/users')
      .send({ username: 'prueba', password: 'pruebacontra' })
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const login = await api
      .post('/api/login')
      .send({ username: 'prueba', password: 'pruebacontra' })
      .expect(200)
      .expect('Content-Type', /application\/json/)

    await api
      .post('/api/blogs')
      .send(newBlog)
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()

    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
  })

  test('blog without url is not added', async () => {
    const newBlog = {
      title: 'oye davo soy peruano',
      author: 'jeffo',
      likes: 5,
    }

    await api
      .post('/api/users')
      .send({ username: 'prueba', password: 'pruebacontra' })
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const login = await api
      .post('/api/login')
      .send({ username: 'prueba', password: 'pruebacontra' })
      .expect(200)
      .expect('Content-Type', /application\/json/)

    await api
      .post('/api/blogs')
      .send(newBlog)
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()

    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
  })

  test('a valid blog can be updated', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToUpdate = blogsAtStart[0]
    const updatedBlog = {
      likes: 25,
    }

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(updatedBlog)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    assert.strictEqual(blogsAtEnd[0].likes, 25)
  })

  describe('deletion of a blog', () => {
    test('succeeds if user created blog', async () => {
      await api
        .post('/api/users')
        .send({ username: 'prueba', password: 'pruebacontra' })
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const login = await api
        .post('/api/login')
        .send({ username: 'prueba', password: 'pruebacontra' })
        .expect(200)
        .expect('Content-Type', /application\/json/)

      const newBlog = await api
        .post('/api/blogs')
        .send({ title: 'title', author: 'author', url: 'url.com', likes: 5 })
        .set('Authorization', `Bearer ${login.body.token}`)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const blogsAtStart = await helper.blogsInDb()
      const blogToDelete = newBlog.body

      await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .set('Authorization', `Bearer ${login.body.token}`)
        .expect(204)

      const blogsAtEnd = await helper.blogsInDb()

      const ids = blogsAtEnd.map(n => n.id)
      assert(!ids.includes(blogToDelete.id))

      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
    })

    test('fails if user did not create blog', async () => {
      const blogsAtStart = await helper.blogsInDb()
      const blogToDelete = blogsAtStart[0]

      await api
        .post('/api/users')
        .send({ username: 'prueba', password: 'pruebacontra' })
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const login = await api
        .post('/api/login')
        .send({ username: 'prueba', password: 'pruebacontra' })
        .expect(200)
        .expect('Content-Type', /application\/json/)

      await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .set('Authorization', `Bearer ${login.body.token}`)
        .expect(500)

      const blogsAtEnd = await helper.blogsInDb()

      const ids = blogsAtEnd.map(n => n.id)
      assert(ids.includes(blogToDelete.id))

      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
    })
  })
})

describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })

    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    assert(usernames.includes(newUser.username))
  })

  test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'salainen',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert(result.body.error.includes('expected `username` to be unique'))

    assert.strictEqual(usersAtEnd.length, usersAtStart.length)
  })

  test('creation fails with proper statuscode and message if username has less than 3 characters', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'ro',
      name: 'usuario',
      password: 'salainen',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)
    const usersAtEnd = await helper.usersInDb()
    assert(result.body.error.includes('User validation failed'))

    assert.strictEqual(usersAtEnd.length, usersAtStart.length)
  })

  test('creation fails with proper statuscode and message if username is missing', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      name: 'usuario',
      password: 'salainen',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)
    const usersAtEnd = await helper.usersInDb()
    assert(result.body.error.includes('Path `username` is required'))

    assert.strictEqual(usersAtEnd.length, usersAtStart.length)
  })

  test('creation fails with proper statuscode and message if password has less than 3 characters', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'pepito',
      name: 'usuario',
      password: 'sa',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)
    const usersAtEnd = await helper.usersInDb()
    assert(
      result.body.error.includes('password should have more than 3 characters'),
    )

    assert.strictEqual(usersAtEnd.length, usersAtStart.length)
  })

  test('creation fails with proper statuscode and message if password is missing', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'pepito',
      name: 'usuario',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)
    const usersAtEnd = await helper.usersInDb()
    assert(result.body.error.includes('password is missing'))

    assert.strictEqual(usersAtEnd.length, usersAtStart.length)
  })
})

after(async () => {
  await mongoose.connection.close()
})

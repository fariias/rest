import request from 'supertest-as-promised'
import nock from 'nock'
import express from '../../services/express'
import { masterKey } from '../../config'
import { <%= userApiPascal %> } from '../<%= userApiKebab %>'
import routes, { PasswordReset } from '.'

const app = () => express(routes)

let <%= userApiCamel %>, passwordReset

beforeEach(async () => {
  nock('https://api.sendgrid.com').post('/v3/mail/send').reply(202)
  <%= userApiCamel %> = await <%= userApiPascal %>.create({ email: 'a@a.com', password: '123456' })
  passwordReset = await PasswordReset.create({ <%= userApiCamel %> })
})

afterEach(() => {
  nock.restore()
})

test('POST /password-resets 202 (master)', async () => {
  const { status } = await request(app())
    .post('/')
    .send({ access_token: masterKey, email: 'a@a.com', link: 'http://example.com' })
  expect(status).toBe(202)
})

test('POST /password-resets 400 (master) - invalid email', async () => {
  const { status, body } = await request(app())
    .post('/')
    .send({ access_token: masterKey, email: 'invalid', link: 'http://example.com' })
  expect(status).toBe(400)
  expect(typeof body).toBe('object')
  expect(body.param).toBe('email')
})

test('POST /password-resets 400 (master) - missing email', async () => {
  const { status, body } = await request(app())
    .post('/')
    .send({ access_token: masterKey, link: 'http://example.com' })
  expect(status).toBe(400)
  expect(typeof body).toBe('object')
  expect(body.param).toBe('email')
})

test('POST /password-resets 400 (master) - missing link', async () => {
  const { status, body } = await request(app())
    .post('/')
    .send({ access_token: masterKey, email: 'a@a.com' })
  expect(status).toBe(400)
  expect(typeof body).toBe('object')
  expect(body.param).toBe('link')
})

test('POST /password-resets 404 (master)', async () => {
  const { status } = await request(app())
    .post('/')
    .send({ access_token: masterKey, email: 'b@b.com', link: 'http://example.com' })
  expect(status).toBe(404)
})

test('POST /password-resets 401', async () => {
  const { status } = await request(app())
    .post('/')
    .send({ email: 'a@a.com', link: 'http://example.com' })
  expect(status).toBe(401)
})

test('GET /password-resets/:token 200', async () => {
  const { status, body } = await request(app()).get(`/${passwordReset.token}`)
  expect(status).toBe(200)
  expect(typeof body).toBe('object')
  expect(typeof body.token).toBe('string')
  expect(typeof body.<%= userApiCamel %>).toBe('object')
  expect(body.<%= userApiCamel %>.id).toBe(<%= userApiCamel %>.id)
})

test('GET /password-resets/:token 404', async () => {
  const { status } = await request(app()).get('/123')
  expect(status).toBe(404)
})

test('PUT /password-resets/:token 200', async () => {
  await PasswordReset.create({ <%= userApiCamel %> })
  const { status, body } = await request(app())
    .put(`/${passwordReset.token}`)
    .send({ password: '654321' })
  const [ updated<%= userApiPascal %>, passwordResets ] = await Promise.all([
    <%= userApiPascal %>.findById(passwordReset.<%= userApiCamel %>.id),
    PasswordReset.find({})
  ])
  expect(status).toBe(200)
  expect(typeof body).toBe('object')
  expect(body.id).toBe(<%= userApiCamel %>.id)
  expect(passwordResets.length).toBe(0)
  expect(await updated<%= userApiPascal %>.authenticate('123456')).toBeFalsy()
  expect(await updated<%= userApiPascal %>.authenticate('654321')).toBeTruthy()
})

test('PUT /password-resets/:token 400 - invalid password', async () => {
  const { status, body } = await request(app())
    .put(`/${passwordReset.token}`)
    .send({ password: '321' })
  expect(status).toBe(400)
  expect(typeof body).toBe('object')
  expect(body.param).toBe('password')
})

test('PUT /password-resets/:token 400 - missing password', async () => {
  const { status, body } = await request(app())
    .put(`/${passwordReset.token}`)
  expect(status).toBe(400)
  expect(typeof body).toBe('object')
  expect(body.param).toBe('password')
})

test('PUT /password-resets/:token 404', async () => {
  const { status } = await request(app())
    .put('/123')
    .send({ password: '654321' })
  expect(status).toBe(404)
})

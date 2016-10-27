<%_ if (authServices.length) { _%>
import { stub } from 'sinon'
<%_ } _%>
import request from 'supertest-as-promised'
<%_ if (passwordSignup) { _%>
import { masterKey } from '../../config'
import { <%= userApiPascal %> } from '../<%= userApiKebab %>'
<%_ } _%>
import { verify } from '../../services/jwt'
<%_ authServices.forEach(function(service) { _%>
import * as <%= service %> from '../../services/<%= service %>'
<%_ }) _%>
import express from '../../services/express'
import routes from '.'

const app = () => express(routes)
<%_ if (passwordSignup) { _%>

let <%= userApiCamel %>

beforeEach(async () => {
  <%= userApiCamel %> = await <%= userApiPascal %>.create({ email: 'a@a.com', password: '123456' })
})

test('POST /auth 201 (master)', async () => {
  const { status, body } = await request(app())
    .post('/')
    .query({ access_token: masterKey })
    .auth('a@a.com', '123456')
  expect(status).toBe(201)
  expect(typeof body).toBe('object')
  expect(typeof body.token).toBe('string')
  expect(typeof body.<%= userApiCamel %>).toBe('object')
  expect(body.<%= userApiCamel %>.id).toBe(<%= userApiCamel %>.id)
  expect(await verify(body.token)).toBeTruthy()
})

test('POST /auth 400 (master) - invalid email', async () => {
  const { status, body } = await request(app())
    .post('/')
    .query({ access_token: masterKey })
    .auth('invalid', '123456')
  expect(status).toBe(400)
  expect(typeof body).toBe('object')
  expect(body.param).toBe('email')
})

test('POST /auth 400 (master) - invalid password', async () => {
  const { status, body } = await request(app())
    .post('/')
    .query({ access_token: masterKey })
    .auth('a@a.com', '123')
  expect(status).toBe(400)
  expect(typeof body).toBe('object')
  expect(body.param).toBe('password')
})

test('POST /auth 401 (master) - user does not exist', async () => {
  const { status } = await request(app())
    .post('/')
    .query({ access_token: masterKey })
    .auth('b@b.com', '123456')
  expect(status).toBe(401)
})

test('POST /auth 401 (master) - wrong password', async () => {
  const { status } = await request(app())
    .post('/')
    .query({ access_token: masterKey })
    .auth('a@a.com', '654321')
  expect(status).toBe(401)
})

test('POST /auth 401 (master) - missing access_token', async () => {
  const { status } = await request(app())
    .post('/')
    .auth('a@a.com', '123456')
  expect(status).toBe(401)
})

test('POST /auth 401 (master) - missing auth', async () => {
  const { status } = await request(app())
    .post('/')
    .query({ access_token: masterKey })
  expect(status).toBe(401)
})
<%_ } _%>
<%_ authServices.forEach(function(service) { _%>

test('POST /auth/<%= service %> 201', async () => {
  stub(<%= service %>, 'getUser', () => Promise.resolve({
    service: '<%= service %>',
    id: '123',
    name: 'user',
    email: 'b@b.com',
    picture: 'test.jpg'
  }))
  const { status, body } = await request(app())
    .post('/<%= service %>')
    .send({ access_token: '123' })
  expect(status).toBe(201)
  expect(typeof body).toBe('object')
  expect(typeof body.token).toBe('string')
  expect(typeof body.<%= userApiCamel %>).toBe('object')
  expect(await verify(body.token)).toBeTruthy()
})

test('POST /auth/<%= service %> 401 - missing token', async () => {
  const { status } = await request(app())
    .post('/<%= service %>')
  expect(status).toBe(401)
})
<%_ }) _%>

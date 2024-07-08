const request = require('supertest');
const app = require('../app');
const { sequelize, User, Organisation } = require('../models');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

describe('POST /auth/register', () => {
  it('should register user successfully with default organisation', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password',
        phone: '1234567890'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data.user.firstName).toBe('John');
    expect(res.body.data.user.lastName).toBe('Doe');
    expect(res.body.data.user.email).toBe('john.doe@example.com');
  });

  it('should fail if required fields are missing', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({});

    expect(res.statusCode).toEqual(422);
    expect(res.body).toHaveProperty('errors');
  });
});

describe('POST /auth/login', () => {
  it('should log the user in successfully', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'john.doe@example.com',
        password: 'password'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data.user.email).toBe('john.doe@example.com');
  });

  it('should fail if email or password is incorrect', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'john.doe@example.com',
        password: 'wrongpassword'
      });

    expect(res.statusCode).toEqual(401);
  });
});


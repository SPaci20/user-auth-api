require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { sequelize, User, Organisation } = require('./models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(bodyParser.json());

const SECRET_KEY = process.env.SECRET_KEY;

// Middleware to protect routes
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// User Registration
app.post('/auth/register', async (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body;
  const userId = `user_${Date.now()}`;

  if (!firstName || !lastName || !email || !password) {
    return res.status(422).json({
      errors: [
        { field: 'firstName', message: 'First name is required' },
        { field: 'lastName', message: 'Last name is required' },
        { field: 'email', message: 'Email is required' },
        { field: 'password', message: 'Password is required' }
      ]
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await User.create({ userId, firstName, lastName, email, password: hashedPassword, phone });
    const orgId = `org_${Date.now()}`;
    const orgName = `${firstName}'s Organisation`;
    const organisation = await Organisation.create({ orgId, name: orgName });

    await user.addOrganisation(organisation);

    const accessToken = jwt.sign({ userId: user.userId, email: user.email }, SECRET_KEY, { expiresIn: '1h' });

    res.status(201).json({
      status: 'success',
      message: 'Registration successful',
      data: {
        accessToken,
        user: {
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone
        }
      }
    });
  } catch (error) {
    res.status(400).json({ status: 'Bad request', message: 'Registration unsuccessful', statusCode: 400 });
  }
});

// User Login
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(422).json({
      errors: [
        { field: 'email', message: 'Email is required' },
        { field: 'password', message: 'Password is required' }
      ]
    });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ status: 'Bad request', message: 'Authentication failed', statusCode: 401 });
    }

    const accessToken = jwt.sign({ userId: user.userId, email: user.email }, SECRET_KEY, { expiresIn: '1h' });

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        accessToken,
        user: {
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone
        }
      }
    });
  } catch (error) {
    res.status(401).json({ status: 'Bad request', message: 'Authentication failed', statusCode: 401 });
  }
});

// Get User By ID
app.get('/api/users/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const user = await User.findByPk(id);
  if (!user) return res.sendStatus(404);

  res.status(200).json({
    status: 'success',
    message: 'User fetched successfully',
    data: {
      userId: user.userId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone
    }
  });
});

// Get All Organisations
app.get('/api/organisations', authenticateToken, async (req, res) => {
  const organisations = await req.user.getOrganisations();
  res.status(200).json({
    status: 'success',
    message: 'Organisations fetched successfully',
    data: { organisations }
  });
});

// Get Organisation By ID
app.get('/api/organisations/:orgId', authenticateToken, async (req, res) => {
  const { orgId } = req.params;
  const organisation = await Organisation.findByPk(orgId);
  if (!organisation) return res.sendStatus(404);

  res.status(200).json({
    status: 'success',
    message: 'Organisation fetched successfully',
    data: organisation
  });
});

// Create Organisation
app.post('/api/organisations', authenticateToken, async (req, res) => {
  const { name, description } = req.body;
  const orgId = `org_${Date.now()}`;

  if (!name) {
    return res.status(422).json({
      errors: [
        { field: 'name', message: 'Name is required' }
      ]
    });
  }

  const organisation = await Organisation.create({ orgId, name, description });

  res.status(201).json({
    status: 'success',
    message: 'Organisation created successfully',
    data: organisation
  });
});

// Add User to Organisation
app.post('/api/organisations/:orgId/users', authenticateToken, async (req, res) => {
  const { orgId } = req.params;
  const { userId } = req.body;

  const user = await User.findByPk(userId);
  const organisation = await Organisation.findByPk(orgId);

  if (!user || !organisation) return res.sendStatus(404);

  await organisation.addUser(user);

  res.status(200).json({
    status: 'success',
    message: 'User added to organisation successfully'
  });
});

// Start Server
app.listen(3000, async () => {
  console.log('Server is running on http://localhost:3000');
  await sequelize.authenticate();
  console.log('Database connected');
});


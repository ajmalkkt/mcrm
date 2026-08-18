const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Generate JWT Helper
const generateToken = (user) => {
  return jwt.sign(
    {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET || 'fallback_secret_change_in_prod',
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
};

// 1. User Registration
const register = async (req, res) => {
  const { username, email, password, first_name, last_name, role } = req.body;

  // Simple validation
  if (!username || !email || !password || !first_name || !last_name) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    // Check if user or email already exists
    const existingUser = await db.query(
      'SELECT user_id FROM Users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'Username or email already in use.' });
    }

    // Hash password (10 salt rounds)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Validate role if provided, default to 'USER'
    const allowedRoles = ['ADMIN', 'MANAGER', 'USER'];
    const assignedRole = allowedRoles.includes(role) ? role : 'USER';

    // Insert user into database
    const newUser = await db.query(
      `INSERT INTO Users (username, email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING user_id, username, email, first_name, last_name, role, created_at`,
      [username, email, passwordHash, first_name, last_name, assignedRole]
    );

    const user = newUser.rows[0];
    const token = generateToken(user);

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error during registration:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// 2. User Login
const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    // Fetch active user
    const result = await db.query(
      'SELECT * FROM Users WHERE (username = $1 OR email = $1) AND is_active = TRUE',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password match
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// 3. Get Current Authenticated Profile
const getProfile = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT user_id, username, email, first_name, last_name, role, created_at FROM Users WHERE user_id = $1',
      [req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
};
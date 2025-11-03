import { Router } from 'express';
import db from '../db/database';
import bcrypt from 'bcrypt';
import { User } from '../types';

const router = Router();

// Signup
router.post('/signup', async (req, res) => {
  const { user_name, contact, password, user_type, sector } = req.body;

  if (!user_name || !password || !user_type) {
    return res.status(400).json({ error: 'Username, password, and user type are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO Users (user_name, contact, password, user_type, sector) VALUES (?, ?, ?, ?, ?)';
    db.run(sql, [user_name, contact, hashedPassword, user_type, sector], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: 'User created successfully', userId: this.lastID });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', (req, res) => {
  const { user_name, password } = req.body;

  if (!user_name || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const sql = 'SELECT * FROM Users WHERE user_name = ?';
  db.get(sql, [user_name], async (err, user: User) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create a session or generate a token (e.g., JWT) here
    res.status(200).json({ message: 'Login successful', user });
  });
});

export default router;

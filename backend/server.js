import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
const { Database } = sqlite3;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));

// Database paths
const rootDir = path.resolve(__dirname, '..');
const databaseDir = path.join(rootDir, 'database');
const userDbPath = path.join(databaseDir, 'user.db');
const imagesDbPath = path.join(databaseDir, 'images.db');
const notificationsDbPath = path.join(databaseDir, 'notifications.db');

// Ensure databases exist and initialize tables
function initDatabases() {
  const userDb = new Database(userDbPath);
  userDb.serialize(() => {
    userDb.run(
      `CREATE TABLE IF NOT EXISTS users (
        userId INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        contact TEXT NOT NULL,
        password TEXT NOT NULL,
        userType TEXT CHECK(userType IN ('normal','service_provider')) NOT NULL DEFAULT 'normal',
        sector TEXT
      )`
    );
  });

  const imageDb = new Database(imagesDbPath);
  imageDb.serialize(() => {
    imageDb.run(
      `CREATE TABLE IF NOT EXISTS images (
        imageId INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        image TEXT NOT NULL,
        location TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(userId)
      )`
    );
  });

  const notificationsDb = new Database(notificationsDbPath);
  notificationsDb.serialize(() => {
    notificationsDb.run(
      `CREATE TABLE IF NOT EXISTS notifications (
        notificationId INTEGER PRIMARY KEY AUTOINCREMENT,
        recipientUserId INTEGER NOT NULL,
        type TEXT NOT NULL,
        jobId INTEGER,
        message TEXT NOT NULL,
        isRead BOOLEAN NOT NULL DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(recipientUserId) REFERENCES users(userId),
        FOREIGN KEY(jobId) REFERENCES images(imageId)
      )`
    );
  });

  return { userDb, imageDb, notificationsDb };
}

const { userDb, imageDb, notificationsDb } = initDatabases();

// Helpers
function sendError(res, status, message) {
  return res.status(status).json({ success: false, error: message });
}

// Routes
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Signup
app.post('/api/signup', (req, res) => {
  const { username, contactNumber, password, userType, sector } = req.body || {};
  if (!username || !contactNumber || !password) {
    return sendError(res, 400, 'Missing required fields');
  }
  const normalizedType = userType === 'service_provider' ? 'service_provider' : 'normal';
  // Sector provided for service providers, else null
  const stmt = userDb.prepare(
    `INSERT INTO users (username, contact, password, userType, sector) VALUES (?,?,?,?,?)`
  );
  stmt.run(
    username,
    contactNumber,
    password,
    normalizedType,
    normalizedType === 'service_provider' ? (sector ?? null) : null,
    function (err) {
      if (err) {
        if (err.message && err.message.includes('UNIQUE')) {
          return sendError(res, 409, 'Username already exists');
        }
        return sendError(res, 500, 'Database error');
      }
      return res.json({ success: true, userId: this.lastID });
    }
  );
  stmt.finalize();
});

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return sendError(res, 400, 'Missing credentials');
  }
  userDb.get(
    `SELECT userId as id, username, contact, userType as type, sector FROM users WHERE username = ? AND password = ?`,
    [username, password],
    (err, row) => {
      if (err) return sendError(res, 500, 'Database error');
      if (!row) return sendError(res, 401, 'Invalid credentials');
      return res.json({ success: true, user: row });
    }
  );
});

// Update user fields
app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { username, contact, sector } = req.body || {};
  if (!username && !contact && typeof sector === 'undefined') {
    return sendError(res, 400, 'No fields to update');
  }
  const fields = [];
  const params = [];
  if (username) { fields.push('username = ?'); params.push(username); }
  if (contact) { fields.push('contact = ?'); params.push(contact); }
  if (typeof sector !== 'undefined') { fields.push('sector = ?'); params.push(sector); }
  params.push(id);
  const sql = `UPDATE users SET ${fields.join(', ')} WHERE userId = ?`;
  userDb.run(sql, params, function(err) {
    if (err) return sendError(res, 500, 'Database error');
    if (this.changes === 0) return sendError(res, 404, 'User not found');
    return res.json({ success: true });
  });
});

// Delete a user and their images
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;

  // First, delete images associated with the user
  imageDb.run('DELETE FROM images WHERE userId = ?', id, function(err) {
    if (err) {
      console.error('Error deleting user images:', err);
    }

    // Then, delete the user
    userDb.run('DELETE FROM users WHERE userId = ?', id, function(err) {
      if (err) return sendError(res, 500, 'Database error while deleting user');
      if (this.changes === 0) return sendError(res, 404, 'User not found');
      return res.json({ success: true, message: 'User and associated images deleted' });
    });
  });
});

// Upload Image (stub - accepts base64 image string and location string)
app.post('/api/images', (req, res) => {
  const { userId, image, location, sector } = req.body || {};
  if (!userId || !image || !location || !sector) {
    return sendError(res, 400, 'Missing fields');
  }
  const stmt = imageDb.prepare(
    `INSERT INTO images (userId, image, location) VALUES (?,?,?)`
  );
  stmt.run(userId, image, location, function (err) {
    if (err) return sendError(res, 500, 'Database error');
    const imageId = this.lastID;

    // Notify service providers in the sector
    userDb.all(
      `SELECT userId FROM users WHERE userType = 'service_provider' AND sector = ?`,
      [sector],
      (err, rows) => {
        if (err) {
          console.error('Error fetching service providers:', err);
          return;
        }
        const message = `New job available in sector ${sector}`;
        rows.forEach((row) => {
          const stmt = notificationsDb.prepare(
            `INSERT INTO notifications (recipientUserId, type, jobId, message) VALUES (?, ?, ?, ?)`
          );
          stmt.run(row.userId, 'NEW_JOB', imageId, message);
          stmt.finalize();
        });
      }
    );

    return res.json({ success: true, imageId });
  });
  stmt.finalize();
});

// List Images (basic)
app.get('/api/images', (_req, res) => {
  imageDb.all(`SELECT imageId, userId, image, location, createdAt FROM images ORDER BY createdAt DESC`, [], (err, rows) => {
    if (err) return sendError(res, 500, 'Database error');
    return res.json({ success: true, images: rows });
  });
});

// Get notifications for a user
app.get('/api/notifications/:userId', (req, res) => {
  const { userId } = req.params;
  notificationsDb.all(
    `SELECT * FROM notifications WHERE recipientUserId = ? ORDER BY createdAt DESC`,
    [userId],
    (err, rows) => {
      if (err) return sendError(res, 500, 'Database error');
      return res.json({ success: true, notifications: rows });
    }
  );
});

// Create a notification
app.post('/api/notifications', (req, res) => {
  const { recipientUserId, type, jobId, message } = req.body;
  if (!recipientUserId || !type || !message) {
    return sendError(res, 400, 'Missing required fields');
  }
  const stmt = notificationsDb.prepare(
    `INSERT INTO notifications (recipientUserId, type, jobId, message) VALUES (?, ?, ?, ?)`
  );
  stmt.run(recipientUserId, type, jobId, message, function (err) {
    if (err) return sendError(res, 500, 'Database error');
    return res.json({ success: true, notificationId: this.lastID });
  });
  stmt.finalize();
});

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});



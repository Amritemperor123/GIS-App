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

  return { userDb, imageDb };
}

const { userDb, imageDb } = initDatabases();

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
  const { username, contactNumber, password, userType } = req.body || {};
  if (!username || !contactNumber || !password) {
    return sendError(res, 400, 'Missing required fields');
  }
  const normalizedType = userType === 'service_provider' ? 'service_provider' : 'normal';
  // Sector can be set later for service providers via a separate endpoint; default null
  const stmt = userDb.prepare(
    `INSERT INTO users (username, contact, password, userType, sector) VALUES (?,?,?,?,?)`
  );
  stmt.run(
    username,
    contactNumber,
    password,
    normalizedType,
    null,
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
    `SELECT userId as id, username, userType as type, sector FROM users WHERE username = ? AND password = ?`,
    [username, password],
    (err, row) => {
      if (err) return sendError(res, 500, 'Database error');
      if (!row) return sendError(res, 401, 'Invalid credentials');
      return res.json({ success: true, user: row });
    }
  );
});

// Upload Image (stub - accepts base64 image string and location string)
app.post('/api/images', (req, res) => {
  const { userId, image, location } = req.body || {};
  if (!userId || !image || !location) {
    return sendError(res, 400, 'Missing fields');
  }
  const stmt = imageDb.prepare(
    `INSERT INTO images (userId, image, location) VALUES (?,?,?)`
  );
  stmt.run(userId, image, location, function (err) {
    if (err) return sendError(res, 500, 'Database error');
    return res.json({ success: true, imageId: this.lastID });
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

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});



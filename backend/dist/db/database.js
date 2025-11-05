"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
// Store the SQLite database alongside compiled files under dist/db/gis.db
const dbPath = path_1.default.resolve(__dirname, 'gis.db');
const db = new sqlite3_1.default.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    }
    else {
        console.log('Connected to the SQLite database.');
        createTables();
    }
});
const createTables = () => {
    const createUsersTable = `
    CREATE TABLE IF NOT EXISTS Users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_name TEXT NOT NULL UNIQUE,
      contact INTEGER,
      password TEXT NOT NULL,
      user_type TEXT NOT NULL,
      sector TEXT
    );
  `;
    const createJobsTable = `
    CREATE TABLE IF NOT EXISTS Jobs (
      job_id INTEGER PRIMARY KEY AUTOINCREMENT,
      state INTEGER,
      location TEXT,
      created_by INTEGER,
      accepted_by INTEGER,
      key INTEGER,
      image_id INTEGER,
      FOREIGN KEY (created_by) REFERENCES Users(user_id),
      FOREIGN KEY (accepted_by) REFERENCES Users(user_id),
      FOREIGN KEY (image_id) REFERENCES Images(image_id)
    );
  `;
    const createImagesTable = `
    CREATE TABLE IF NOT EXISTS Images (
      image_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      image_url TEXT,
      location TEXT,
      timestamp DATETIME,
      FOREIGN KEY (user_id) REFERENCES Users(user_id)
    );
  `;
    const createNotificationsTable = `
    CREATE TABLE IF NOT EXISTS Notifications (
      notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
      notification_target TEXT,
      type TEXT,
      job_id INTEGER,
      sector TEXT,
      state INTEGER,
      recipient_id INTEGER,
      timestamp DATETIME,
      key INTEGER,
      FOREIGN KEY (job_id) REFERENCES Jobs(job_id),
      FOREIGN KEY (recipient_id) REFERENCES Users(user_id)
    );
  `;
    const createMarkersTable = `
    CREATE TABLE IF NOT EXISTS Markers (
        marker_id INTEGER PRIMARY KEY AUTOINCREMENT,
        state INTEGER,
        location TEXT,
        image_array TEXT,
        key INTEGER
    );
  `;
    db.serialize(() => {
        db.run(createUsersTable);
        db.run(createJobsTable);
        db.run(createImagesTable);
        db.run(createNotificationsTable);
        db.run(createMarkersTable);
    });
};
exports.default = db;

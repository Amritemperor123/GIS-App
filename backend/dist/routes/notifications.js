"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../db/database"));
const router = (0, express_1.Router)();
// Get all notifications for a user
router.get('/:userId', (req, res) => {
    const { userId } = req.params;
    const sql = 'SELECT * FROM Notifications WHERE recipient_id = ?';
    database_1.default.all(sql, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ notifications: rows });
    });
});
// Create a new notification
router.post('/', (req, res) => {
    const { notification_target, type, job_id, sector, state, recipient_id } = req.body;
    if (!notification_target || !type || !job_id || !sector || !state) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    const sql = 'INSERT INTO Notifications (notification_target, type, job_id, sector, state, recipient_id, timestamp, key) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    database_1.default.run(sql, [notification_target, type, job_id, sector, state, recipient_id, new Date(), 0], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Notification created successfully', notificationId: this.lastID });
    });
});
exports.default = router;

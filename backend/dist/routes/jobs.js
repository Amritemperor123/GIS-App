"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../db/database"));
const router = (0, express_1.Router)();
// Get all jobs
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM Jobs';
    database_1.default.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ jobs: rows });
    });
});
// Create a new job
router.post('/', (req, res) => {
    const { state, location, created_by } = req.body;
    if (!state || !location || !created_by) {
        return res.status(400).json({ error: 'State, location, and created_by are required' });
    }
    const sql = 'INSERT INTO Jobs (state, location, created_by, key) VALUES (?, ?, ?, ?)';
    database_1.default.run(sql, [state, location, created_by, 0], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Job created successfully', jobId: this.lastID });
    });
});
// Update job state
router.put('/:id', (req, res) => {
    const { state, accepted_by } = req.body;
    const { id } = req.params;
    if (!state) {
        return res.status(400).json({ error: 'State is required' });
    }
    let sql = 'UPDATE Jobs SET state = ?';
    const params = [state];
    if (accepted_by) {
        sql += ', accepted_by = ?';
        params.push(accepted_by);
    }
    sql += ' WHERE job_id = ?';
    params.push(id);
    database_1.default.run(sql, params, function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ message: 'Job updated successfully' });
    });
});
exports.default = router;

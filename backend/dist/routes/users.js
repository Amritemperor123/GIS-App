"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../db/database"));
const router = (0, express_1.Router)();
// Update user
router.put('/:id', (req, res) => {
    const { username, contact, sector } = req.body;
    const { id } = req.params;
    if (!username && !contact && !sector) {
        return res.status(400).json({ error: 'At least one field to update is required' });
    }
    let sql = 'UPDATE Users SET';
    const params = [];
    const fields = [];
    if (username) {
        fields.push('user_name = ?');
        params.push(username);
    }
    if (contact) {
        fields.push('contact = ?');
        params.push(contact);
    }
    if (sector) {
        fields.push('sector = ?');
        params.push(sector);
    }
    sql += ` ${fields.join(', ')} WHERE user_id = ?`;
    params.push(id);
    database_1.default.run(sql, params, function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ message: 'User updated successfully' });
    });
});
// Delete user
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM Users WHERE user_id = ?';
    database_1.default.run(sql, [id], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ message: 'User deleted successfully' });
    });
});
exports.default = router;

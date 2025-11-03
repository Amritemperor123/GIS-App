"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../db/database"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const router = (0, express_1.Router)();
// Signup
router.post('/signup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user_name, contact, password, user_type, sector } = req.body;
    if (!user_name || !password || !user_type) {
        return res.status(400).json({ error: 'Username, password, and user type are required' });
    }
    try {
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        const sql = 'INSERT INTO Users (user_name, contact, password, user_type, sector) VALUES (?, ?, ?, ?, ?)';
        database_1.default.run(sql, [user_name, contact, hashedPassword, user_type, sector], function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ message: 'User created successfully', userId: this.lastID });
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}));
// Login
router.post('/login', (req, res) => {
    const { user_name, password } = req.body;
    if (!user_name || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    const sql = 'SELECT * FROM Users WHERE user_name = ?';
    database_1.default.get(sql, [user_name], (err, user) => __awaiter(void 0, void 0, void 0, function* () {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const passwordMatch = yield bcrypt_1.default.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Create a session or generate a token (e.g., JWT) here
        res.status(200).json({ message: 'Login successful', user });
    }));
});
exports.default = router;

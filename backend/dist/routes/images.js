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
const body_parser_1 = __importDefault(require("body-parser"));
const database_1 = __importDefault(require("../db/database"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
// Increase JSON body size limit specifically for image uploads
router.use(body_parser_1.default.json({ limit: '50mb' }));
// Ensure the uploads directory exists
const uploadsDir = path_1.default.join(__dirname, '..', 'db', 'images');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
// POST /api/images
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, image, location, sector } = req.body;
    try {
        const imageBuffer = Buffer.from(image, 'base64');
        const imageName = `${Date.now()}.png`;
        const imagePath = path_1.default.join(uploadsDir, imageName);
        const imageUrl = `/db/images/${imageName}`;
        fs_1.default.writeFileSync(imagePath, imageBuffer);
        const sql = 'INSERT INTO Images (user_id, image_url, location, timestamp) VALUES (?, ?, ?, ?)';
        const timestamp = new Date().toISOString();
        database_1.default.run(sql, [userId, imageUrl, location, timestamp], function (err) {
            if (err) {
                console.error('Error saving image to database:', err);
                return res.status(500).json({ success: false, error: 'Failed to save image to database' });
            }
            res.status(201).json({ success: true, imageId: this.lastID });
        });
    }
    catch (error) {
        console.error('Error processing image upload:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
}));
exports.default = router;

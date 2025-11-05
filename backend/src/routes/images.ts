
import { Router } from 'express';
import db from '../db/database';
import fs from 'fs';
import path from 'path';

const router = Router();

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'db', 'images');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// POST /api/images
router.post('/', async (req, res) => {
  const { userId, image, location, sector } = req.body;



  try {
    const imageBuffer = Buffer.from(image, 'base64');
    const imageName = `${Date.now()}.png`;
    const imagePath = path.join(uploadsDir, imageName);
    const imageUrl = `/db/images/${imageName}`;

    fs.writeFileSync(imagePath, imageBuffer);

    const sql = 'INSERT INTO Images (user_id, image_url, location, timestamp) VALUES (?, ?, ?, ?)';
    const timestamp = new Date().toISOString();

    db.run(sql, [userId, imageUrl, location, timestamp], function (err) {
      if (err) {
        console.error('Error saving image to database:', err);
        return res.status(500).json({ success: false, error: 'Failed to save image to database' });
      }
      res.status(201).json({ success: true, imageId: this.lastID });
    });
  } catch (error) {
    console.error('Error processing image upload:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;

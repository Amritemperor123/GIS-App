import { Router } from 'express';
import db from '../db/database';

const router = Router();

// Get all jobs
router.get('/', (req, res) => {
  const sql = 'SELECT * FROM Jobs';
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json({ jobs: rows });
  });
});

// Create a new job
router.post('/', (req, res) => {
  const { state, location, created_by, image_id } = req.body;

  if (!state || !location || !created_by) {
    return res.status(400).json({ error: 'State, location, and created_by are required' });
  }

  const sql = 'INSERT INTO Jobs (state, location, created_by, image_id, key) VALUES (?, ?, ?, ?, ?)';
  db.run(sql, [state, location, created_by, image_id, 0], function (err) {
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
  const params: any[] = [state];

  if (accepted_by) {
    sql += ', accepted_by = ?';
    params.push(accepted_by);
  }

  sql += ' WHERE job_id = ?';
  params.push(id);

  db.run(sql, params, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json({ message: 'Job updated successfully' });
  });
});

export default router;

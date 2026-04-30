const router = require('express').Router();
const db     = require('../db');

router.get('/', (req, res) => {
  const { major, available, q } = req.query;
  let sql = `SELECT s.*, u.name, u.initials FROM seniors s JOIN users u ON s.user_id = u.id WHERE 1=1`;
  const params = [];

  if (major && major !== 'All')  { sql += ' AND s.major = ?';                                                 params.push(major); }
  if (available === '1')          { sql += ' AND s.available = 1'; }
  if (q) {
    sql += ' AND (u.name LIKE ? OR s.major LIKE ? OR s.topics LIKE ?)';
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }

  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(r => ({ ...r, topics: JSON.parse(r.topics || '[]') })));
});

router.get('/:id', (req, res) => {
  const row = db.prepare(
    'SELECT s.*, u.name, u.initials FROM seniors s JOIN users u ON s.user_id = u.id WHERE s.id = ?'
  ).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Senior not found' });
  res.json({ ...row, topics: JSON.parse(row.topics || '[]') });
});

module.exports = router;

const router = require('express').Router();
const auth   = require('../middleware/auth');
const db     = require('../db');

router.post('/', auth, (req, res) => {
  const { seniorId, type, slot, location, paymentMethod, topic } = req.body;
  if (!seniorId || !type || !slot || !paymentMethod)
    return res.status(400).json({ error: 'Missing required fields' });

  const result = db.prepare(`
    INSERT INTO bookings (freshman_id, senior_id, type, slot, location, payment_method, topic)
    VALUES (?,?,?,?,?,?,?)
  `).run(req.user.id, seniorId, type, slot, location || null, paymentMethod, topic || null);

  res.json({ success: true, bookingId: result.lastInsertRowid });
});

router.get('/', auth, (req, res) => {
  let rows;
  if (req.user.role === 'senior') {
    rows = db.prepare(`
      SELECT b.*, u.name AS student_name, u.initials AS student_initials
      FROM bookings b
      JOIN users u ON b.freshman_id = u.id
      WHERE b.senior_id = ? AND b.status != 'cancelled'
      ORDER BY b.created_at DESC
    `).all(req.user.seniorId);
  } else {
    rows = db.prepare(`
      SELECT b.*, u.name AS senior_name, s.major AS senior_major
      FROM bookings b
      JOIN seniors s ON b.senior_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE b.freshman_id = ? AND b.status != 'cancelled'
      ORDER BY b.created_at DESC
    `).all(req.user.id);
  }
  res.json(rows);
});

router.delete('/:id', auth, (req, res) => {
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  db.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

module.exports = router;

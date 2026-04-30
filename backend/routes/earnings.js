const router = require('express').Router();
const auth   = require('../middleware/auth');
const db     = require('../db');

router.get('/', auth, (req, res) => {
  if (req.user.role !== 'senior') return res.status(403).json({ error: 'Seniors only' });

  const earned = db.prepare(`
    SELECT COUNT(*) AS sessions, COALESCE(SUM(earned), 0) AS total
    FROM bookings WHERE senior_id = ? AND status = 'completed'
  `).get(req.user.seniorId);

  const withdrawn = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) AS total
    FROM withdrawals WHERE senior_id = ? AND status != 'cancelled'
  `).get(req.user.seniorId);

  res.json({
    balance:       earned.total - withdrawn.total,
    totalSessions: earned.sessions,
    totalEarned:   earned.total,
  });
});

router.post('/withdraw', auth, (req, res) => {
  if (req.user.role !== 'senior') return res.status(403).json({ error: 'Seniors only' });

  const { amount, destination } = req.body;
  if (!amount || !destination) return res.status(400).json({ error: 'Missing amount or destination' });

  const { balance } = (() => {
    const earned = db.prepare(`SELECT COALESCE(SUM(earned),0) AS total FROM bookings WHERE senior_id = ? AND status='completed'`).get(req.user.seniorId);
    const withdrawn = db.prepare(`SELECT COALESCE(SUM(amount),0) AS total FROM withdrawals WHERE senior_id = ? AND status != 'cancelled'`).get(req.user.seniorId);
    return { balance: earned.total - withdrawn.total };
  })();

  if (amount > balance) return res.status(400).json({ error: 'Amount exceeds available balance' });

  db.prepare('INSERT INTO withdrawals (senior_id, amount, destination) VALUES (?,?,?)').run(req.user.seniorId, amount, destination);
  res.json({ success: true });
});

module.exports = router;

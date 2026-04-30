const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../db');

const SECRET = () => process.env.JWT_SECRET || 'daleel_secret_key';

router.post('/login', (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) return res.status(400).json({ error: 'All fields required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: 'Invalid email or password' });
  if (user.role !== role)
    return res.status(401).json({ error: `This account is registered as a ${user.role}` });

  let seniorId = null;
  if (role === 'senior') {
    const s = db.prepare('SELECT id FROM seniors WHERE user_id = ?').get(user.id);
    seniorId = s?.id ?? null;
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, seniorId },
    SECRET(),
    { expiresIn: '7d' }
  );

  res.json({ token, user: { id: user.id, name: user.name, initials: user.initials, role: user.role } });
});

router.post('/register', (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !name || !role) return res.status(400).json({ error: 'All fields required' });

  const initials = name.split(' ').map(w => w[0]?.toUpperCase() || '').join('').slice(0, 2);
  const hash = bcrypt.hashSync(password, 10);

  try {
    const result = db.prepare(
      'INSERT INTO users (email, password_hash, name, initials, role) VALUES (?,?,?,?,?)'
    ).run(email, hash, name, initials, role);
    res.json({ success: true, userId: result.lastInsertRowid });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(400).json({ error: 'Email already registered' });
    throw e;
  }
});

module.exports = router;

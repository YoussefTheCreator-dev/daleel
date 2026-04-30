require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth',     require('./routes/auth'));
app.use('/api/seniors',  require('./routes/seniors'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/earnings', require('./routes/earnings'));

app.get('/', (_req, res) => res.json({ status: 'Daleel API running' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Daleel backend on port ${PORT}`));

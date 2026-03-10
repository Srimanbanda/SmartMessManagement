const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./config/db.js')
const app = express();

app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Smart Mess API is running' });
});

// Route Placeholders for upcoming phases
 app.use('/api/admin', require('./routes/admin'));
app.use('/api/student', require('./routes/student'));
// app.use('/api/rfid', require('./routes/rfid'));
app.use('/api/booking', require('./routes/booking'));

app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
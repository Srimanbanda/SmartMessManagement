const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// 1. SYNC ROUTE (ESP32 calls this to download the list for a specific meal)
// GET /api/rfid/sync/:mess_name/:meal_type
router.get('/sync/:mess_name/:meal_type', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT s.rfid_uid 
            FROM bookings b
            JOIN students s ON b.student_id = s.id
            WHERE b.mess_name = ? 
            AND b.meal_type = ?
            AND b.meal_date = CURDATE() 
            AND b.status = 'booked'
        `, [req.params.mess_name, req.params.meal_type]);

        // Return a flat array of strings to save ESP32 RAM (e.g., ["E38A2194", "A1B2C3D4"])
        const rfidList = rows.map(row => row.rfid_uid);
        
        res.status(200).json({ success: true, count: rfidList.length, rfids: rfidList });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 2. CONSUME ROUTE (ESP32 calls this when a student taps at the entrance)
// POST /api/rfid/consume
router.post('/consume', async (req, res) => {
    const { rfid_uid, mess_name, meal_type } = req.body; 
    
    if (!meal_type) {
        return res.status(400).json({ success: false, message: 'meal_type is required' });
    }

    try {
        const [result] = await pool.query(`
            UPDATE bookings b 
            JOIN students s ON b.student_id = s.id 
            SET b.status = 'consumed' 
            WHERE s.rfid_uid = ? 
            AND b.mess_name = ? 
            AND b.meal_type = ?
            AND b.meal_date = CURDATE() 
            AND b.status = 'booked'
        `, [rfid_uid, mess_name, meal_type]);

        if (result.affectedRows === 0) {
            return res.status(400).json({ success: false, message: 'Invalid, wrong meal, or already consumed' });
        }
        res.status(200).json({ success: true, message: `${meal_type} consumed successfully` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
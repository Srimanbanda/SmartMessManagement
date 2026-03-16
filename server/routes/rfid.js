const express = require('express');
const router = express.Router();
const pool = require('../config/db');

console.log("i am in rfid.js");


/* =====================================================
   1. FEEDBACK ROUTE (ESP32 Rating Buttons)
   POST /api/rfid/feedback
===================================================== */

router.post('/feedback', async (req, res) => {

    const { rfid_uid, mess_name, meal_type, rating } = req.body;

    if (!rfid_uid || !mess_name || !meal_type || !rating) {
        return res.status(400).json({ success:false, message:"Missing fields" });
    }

    if (rating < 1 || rating > 5) {
        return res.status(400).json({ success:false, message:"Rating must be 1-5" });
    }

    try {

        // Find student using RFID
        const [students] = await pool.query(
            'SELECT id FROM students WHERE rfid_uid = ?',
            [rfid_uid]
        );

        if (students.length === 0) {
            return res.status(404).json({ success:false, message:"Invalid RFID" });
        }

        const student_id = students[0].id;

        // Check if student actually consumed meal
        const [bookings] = await pool.query(`
            SELECT id FROM bookings
            WHERE student_id = ?
            AND mess_name = ?
            AND meal_type = ?
            AND meal_date = CURDATE()
            AND status = 'consumed'
        `, [student_id, mess_name, meal_type]);

        if (bookings.length === 0) {
            return res.status(403).json({
                success:false,
                message:"Consume meal before rating"
            });
        }

        // Insert feedback
        await pool.query(`
            INSERT INTO feedback
            (student_id, mess_name, meal_date, meal_type, rating, source)
            VALUES (?, ?, CURDATE(), ?, ?, 'esp32')
        `, [student_id, mess_name, meal_type, rating]);

        return res.json({ success:true });

    } catch (error) {

        // Duplicate rating protection
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success:false,
                message:"Already rated"
            });
        }

        return res.status(500).json({
            success:false,
            message:error.message
        });
    }

});


/* =====================================================
   2. SYNC ROUTE
   ESP32 downloads registered students
   GET /api/rfid/sync/:mess_name/:meal_type
===================================================== */

router.get('/sync/:mess_name/:meal_type', async (req, res) => {

    try {

        console.log("Sync request received");

        const [rows] = await pool.query(`
            SELECT s.rfid_uid
            FROM bookings b
            JOIN students s ON b.student_id = s.id
            WHERE b.mess_name = ?
            AND b.meal_type = ?
            AND b.meal_date = CURDATE()
            AND b.status = 'booked'
        `, [req.params.mess_name, req.params.meal_type]);

        // Convert to simple array to reduce ESP32 RAM usage
        const rfidList = rows.map(row => row.rfid_uid);

        res.status(200).json({
            success:true,
            count:rfidList.length,
            rfids:rfidList
        });

    } catch (error) {

        res.status(500).json({
            success:false,
            message:error.message
        });
    }

});


/* =====================================================
   3. CONSUME ROUTE
   ESP32 marks meal as consumed
   POST /api/rfid/consume
===================================================== */

router.post('/consume', async (req, res) => {

    const { rfid_uid, mess_name, meal_type } = req.body;

    if (!rfid_uid || !mess_name || !meal_type) {
        return res.status(400).json({
            success:false,
            message:"Missing fields"
        });
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
            return res.status(400).json({
                success:false,
                message:"Invalid, wrong meal, or already consumed"
            });
        }

        res.json({ success:true });

    } catch (error) {

        res.status(500).json({
            success:false,
            message:error.message
        });
    }

});


module.exports = router;
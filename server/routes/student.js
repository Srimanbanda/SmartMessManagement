const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// 1. Student Login
// POST /api/student/login
router.post('/login', async (req, res) => {
    const { roll_no, password } = req.body;

    try {
        // In a production app, you would use bcrypt to compare hashed passwords here.
        const [students] = await pool.query(
            'SELECT id, name, roll_no, coins FROM students WHERE roll_no = ? AND password = ?',
            [roll_no, password]
        );

        if (students.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid roll number or password' });
        }

        const student = students[0];
        res.status(200).json({
            success: true,
            message: 'Login successful',
            student: student
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
});

// 2. Fetch Dashboard Data (Menus and Wallet)
// GET /api/student/dashboard/:id
router.get('/dashboard/:id', async (req, res) => {
    const studentId = req.params.id;
    // Get today's date in YYYY-MM-DD format based on local time
    const today = new Date().toISOString().split('T')[0];
          console.log(today);
    try {
        // Fetch student balance
        const [students] = await pool.query('SELECT name, coins FROM students WHERE id = ?', [studentId]);
        
        if (students.length === 0) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Fetch today's menus for both messes
        const [menus] = await pool.query(
            'SELECT id, mess_name, meal_type, items, start_time, end_time, capacity FROM menu WHERE meal_date = ?',
            [today]
        );

        res.status(200).json({
            success: true,
            student: students[0],
            menus: menus
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error fetching dashboard' });
    }
});

// 3. Fetch Menus by Date
// GET /api/student/menus/:date
router.get('/menus/:date', async (req, res) => {
    try {
        const [menus] = await pool.query(
            'SELECT id, mess_name, meal_type, items, start_time, end_time, capacity FROM menu WHERE meal_date = ?',
            [req.params.date]
        );
        res.status(200).json({ success: true, menus });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error fetching menus' });
    }
});

module.exports = router;
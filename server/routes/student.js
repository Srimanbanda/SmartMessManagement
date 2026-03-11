const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// 1. Student Login
// POST /api/student/login
router.post('/login', async (req, res) => {
    const { roll_no, password } = req.body;

    try {
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

// 2. Fetch Dashboard Data (Personal Profile and Today's Bookings)
// GET /api/student/dashboard/:id
router.get('/dashboard/:id', async (req, res) => {
    const studentId = req.params.id;
    const today = new Date().toISOString().split('T')[0];
    
    try {
        const [students] = await pool.query('SELECT id, name, roll_no, coins FROM students WHERE id = ?', [studentId]);
        console.log(1);
        if (students.length === 0) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
           console.log(2);
        // Fetch what the student has actually booked for today (Includes the new booking_ref and cost)
        const [todayBookings] = await pool.query(`
            SELECT booking_ref, mess_name, meal_type, status 
            FROM bookings 
            WHERE student_id = ? AND meal_date = ?
            ORDER BY meal_type ASC
        `, [studentId, today]);
      console.log(3);
        res.status(200).json({
            success: true,
            student: students[0],
            today_bookings: todayBookings
        });
 console.log(4);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error fetching dashboard' });
    }
});

// NOTE: The old 'GET /menus/:date' route has been DELETED. 
// Your frontend must call 'GET /api/menu/:mess_name/:target_date' from your menu.js router instead.

// Get all bookings for a student (full history)
// GET /api/student/bookings/:id?date=YYYY-MM-DD&mess_name=Mess_A (both optional)
router.get('/bookings/:id', async (req, res) => {
    try {
        const studentId = req.params.id;
        const { date, mess_name } = req.query;

        let query = `
            SELECT booking_ref, mess_name, meal_type, meal_date, status
            FROM bookings
            WHERE student_id = ?
        `;
        const params = [studentId];

        if (date) { query += ' AND meal_date = ?'; params.push(date); }
        if (mess_name) { query += ' AND mess_name = ?'; params.push(mess_name); }

        query += ' ORDER BY meal_date DESC, meal_type ASC';

        const [bookings] = await pool.query(query, params);
        res.status(200).json({ success: true, bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 3. Get Pending Feedback (Strictly for CONSUMED meals)
// GET /api/student/feedback/pending/:id
router.get('/feedback/pending/:id', async (req, res) => {
    try {
        const [pending] = await pool.query(`
            SELECT b.id as booking_id, b.booking_ref, b.mess_name, b.meal_type, b.meal_date
            FROM bookings b
            LEFT JOIN feedback f ON b.student_id = f.student_id 
                        AND b.meal_date = f.meal_date 
                        AND b.meal_type = f.meal_type
            WHERE b.student_id = ? 
            AND b.status = 'consumed'  /* The ultimate validation */
            AND f.id IS NULL
        `, [req.params.id]);
        
        res.status(200).json({ success: true, pending });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 4. Submit Web Feedback
// POST /api/student/feedback
router.post('/feedback', async (req, res) => {
    const { student_id, mess_name, meal_date, meal_type, rating } = req.body;
    try {
        await pool.query(
            'INSERT INTO feedback (student_id, mess_name, meal_date, meal_type, rating, source) VALUES (?, ?, ?, ?, ?, "web")',
            [student_id, mess_name, meal_date, meal_type, rating]
        );
        res.status(200).json({ success: true, message: 'Feedback submitted!' });
    } catch (error) {
        // Catches the UNIQUE KEY constraint (Double review attempt)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'You have already rated this meal.' });
        }
        // Catches the CHECK constraint (Rating < 1 or Rating > 5)
        if (error.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

// 5. Live Crowd Occupancy (Wait Time Estimator)
// GET /api/student/occupancy
router.get('/occupancy', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // Determine current meal type based on time
        const hour = new Date().getHours();
        let currentMeal = 'lunch';
        if (hour >= 6 && hour < 11) currentMeal = 'breakfast';
        else if (hour >= 11 && hour < 15) currentMeal = 'lunch';
        else if (hour >= 15 && hour < 18) currentMeal = 'snacks';
        else currentMeal = 'dinner';

        const [rows] = await pool.query(`
            SELECT mess_name, status, COUNT(*) as count
            FROM bookings
            WHERE meal_date = ? AND meal_type = ?
            GROUP BY mess_name, status
        `, [today, currentMeal]);

        // Format data: { Mess_A: { booked: 0, consumed: 0 }, Mess_B: { booked: 0, consumed: 0 } }
        const occupancy = {
            Mess_A: { booked: 0, consumed: 0 },
            Mess_B: { booked: 0, consumed: 0 },
            currentMeal
        };

        rows.forEach(row => {
            if (occupancy[row.mess_name]) {
                if (row.status === 'consumed') occupancy[row.mess_name].consumed += row.count;
                if (row.status === 'booked') occupancy[row.mess_name].booked += row.count;
            }
        });

        res.status(200).json({ success: true, occupancy });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
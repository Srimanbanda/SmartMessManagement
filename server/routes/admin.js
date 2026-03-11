const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// 1. Register a Student
// POST /api/admin/student
router.post('/student', async (req, res) => {
    const { name, roll_no, password, rfid_uid } = req.body;
    try {
        // Updated: Removed the hardcoded '0' coins. Let the DB handle defaults.
        const [result] = await pool.query(
            'INSERT INTO students (name, roll_no, password, rfid_uid) VALUES (?, ?, ?, ?)',
            [name, roll_no, password, rfid_uid]
        );
        res.status(201).json({ 
            success: true, 
            message: 'Student registered successfully', 
            student_id: result.insertId 
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Roll number or RFID already exists.' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

// NOTE: The old '/menu' route has been removed.
// Please use your dedicated 'server/routes/menu.js' file to handle weekly_menus and special_menus.



// 3. Recharge Student Wallet
// POST /api/admin/recharge
router.post('/recharge', async (req, res) => {
    const { student_id, amount } = req.body;
    
    // Grab a dedicated connection for the SQL Transaction
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // Step A: Add coins
        await connection.query(
            'UPDATE students SET coins = coins + ? WHERE id = ?', 
            [amount, student_id]
        );
        

        // Step B: Log the transaction using your exact new schema structure
        await connection.query(
            `INSERT INTO transactions 
            (student_id, booking_id, mess_name, amount, type, description) 
            VALUES (?, NULL, "Admin_System", ?, "credit", "Manual Recharge")`, 
            [student_id, amount]
        );
        console.log(2);
        await connection.commit();
        res.status(200).json({ success: true, message: `Successfully added ${amount} coins.` });
        
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: 'Recharge failed: ' + error.message });
    } finally {
        connection.release();
    }
});

// 4. Admin Login (With Explicit Role Check)
// POST /api/admin/login
router.post('/login', async (req, res) => {
    const { username, password, role } = req.body;
    
    try {
        const [admins] = await pool.query(
            'SELECT id, username, role FROM admins WHERE username = ? AND password = ?',
            [username, password]
        );
        
        if (admins.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }

        const admin = admins[0];

        // Security check to ensure they selected the correct role from the dropdown
        if (admin.role !== role) {
            return res.status(403).json({ 
                success: false, 
                message: `Access Denied: You do not have permission to log in as ${role.replace('_', ' ')}.` 
            });
        }

        res.status(200).json({ success: true, message: 'Login successful', admin: admin });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 5. View Bookings
// GET /api/admin/bookings?date=YYYY-MM-DD&mess_name=Mess_A
router.get('/bookings', async (req, res) => {
    const { date, mess_name } = req.query;
    try {
        const [bookings] = await pool.query(`
            SELECT b.id, s.name, s.roll_no, b.meal_type, b.status 
            FROM bookings b
            JOIN students s ON b.student_id = s.id
            WHERE b.meal_date = ? AND b.mess_name = ?
            ORDER BY b.meal_type ASC
        `, [date, mess_name]);
        res.status(200).json({ success: true, bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 6. Get Feedback Analytics
// GET /api/admin/feedback/stats
router.get('/feedback/stats', async (req, res) => {
    try {
        // Get overall averages per mess
        const [stats] = await pool.query(`
            SELECT mess_name, ROUND(AVG(rating), 1) as avg_rating, COUNT(*) as total_reviews 
            FROM feedback GROUP BY mess_name
        `);
        // Get the 5 most recent reviews
        const [recent] = await pool.query(`
            SELECT f.rating, f.meal_type, f.meal_date, f.mess_name, f.source, s.name 
            FROM feedback f
            JOIN students s ON f.student_id = s.id
            ORDER BY f.created_at DESC LIMIT 5
        `);
        res.status(200).json({ success: true, stats, recent });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 7. Get Global System Analytics (College Admin Dashboard)
// GET /api/admin/analytics
router.get('/analytics', async (req, res) => {
    try {
        // Query 1: Total Active Students
        const [[{ total_students }]] = await pool.query(
            `SELECT COUNT(*) as total_students FROM students WHERE is_active = TRUE`
        );

        // Query 2: Meals Served Today
        const [[{ meals_today }]] = await pool.query(
            `SELECT COUNT(*) as meals_today FROM bookings WHERE meal_date = CURDATE() AND status = 'consumed'`
        );

        res.status(200).json({
            success: true,
            data: {
                total_students: total_students || 0,
                meals_today: meals_today || 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 8. Get All Students for Registry
// GET /api/admin/students
router.get('/students', async (req, res) => {
    try {
        const [students] = await pool.query(
            `SELECT id, name, roll_no, rfid_uid, coins, is_active FROM students ORDER BY id DESC`
        );
        res.status(200).json({ success: true, students });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 9. Update Student Policy/Details
// PUT /api/admin/student/:id
router.put('/student/:id', async (req, res) => {
    const studentId = req.params.id;
    const { name, roll_no, rfid_uid, coins, is_active } = req.body;
    
    try {
        await pool.query(
            `UPDATE students SET name = ?, roll_no = ?, rfid_uid = ?, coins = ?, is_active = ? WHERE id = ?`,
            [name, roll_no, rfid_uid, coins, is_active ? 1 : 0, studentId]
        );
        res.status(200).json({ success: true, message: 'Student updated successfully.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Roll number or RFID already exists.' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// 1. Register a Student
// POST /api/admin/student
router.post('/student', async (req, res) => {
    const { name, roll_no, password, rfid_uid } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO students (name, roll_no, password, rfid_uid, coins) VALUES (?, ?, ?, ?, 0)',
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

// 2. Set the Daily Menu
// POST /api/admin/menu
router.post('/menu', async (req, res) => {
    const { mess_name, meal_type, items, meal_date, start_time, end_time, capacity } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO menu (mess_name, meal_type, items, meal_date, start_time, end_time, capacity) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [mess_name, meal_type, items, meal_date, start_time, end_time, capacity || 100]
        );
        res.status(201).json({ 
            success: true, 
            message: `${meal_type} menu added for ${mess_name}`,
            menu_id: result.insertId
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Menu already exists for this mess, meal, and date.' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

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

        // Step B: Log the transaction
        await connection.query(
            'INSERT INTO transactions (student_id, type, amount, action_by, remarks) VALUES (?, "credit", ?, "admin", "Manual Recharge")', 
            [student_id, amount]
        );

        await connection.commit();
        res.status(200).json({ success: true, message: `Successfully added ${amount} coins.` });
        
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: 'Recharge failed: ' + error.message });
    } finally {
        connection.release();
    }
});
// 4. Admin Login
// POST /api/admin/login
// 4. Admin Login
// POST /api/admin/login
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

        // NEW: Security check to ensure they selected the correct role from the dropdown
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

module.exports = router;
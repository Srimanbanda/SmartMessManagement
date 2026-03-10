const express = require('express');
const router = express.Router();
const pool = require('../config/db');

const MEAL_COST = 50; // Standardize the cost

// POST /api/booking/create
router.post('/create', async (req, res) => {
    const { student_id, mess_name, meal_type, meal_date } = req.body;
    
    // Grab a dedicated connection for the transaction
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // --- NEW: Strict Next-Day Security ---
        // Get today's date in YYYY-MM-DD based on local server time
        const todayStr = new Date().toISOString().split('T')[0];
        
        if (meal_date <= todayStr) {
            throw new Error("Cutoff passed. You can only book meals for tomorrow or later.");
        }
        // -------------------------------------

        // 1. Check if the student already booked ANY mess for this specific meal and date
        const [existingBooking] = await connection.query(
            'SELECT id FROM bookings WHERE student_id = ? AND meal_type = ? AND meal_date = ? AND status = "booked"',
            [student_id, meal_type, meal_date]
        );
        if (existingBooking.length > 0) {
            throw new Error(`You have already booked ${meal_type} for this date.`);
        }

        // 2. Lock the menu row and check capacity
        const [menuRows] = await connection.query(
            'SELECT capacity FROM menu WHERE mess_name = ? AND meal_type = ? AND meal_date = ? FOR UPDATE',
            [mess_name, meal_type, meal_date]
        );
        if (menuRows.length === 0) {
            throw new Error(`No menu published for ${mess_name} - ${meal_type} on this date.`);
        }

        const [bookingCount] = await connection.query(
            'SELECT COUNT(*) as total FROM bookings WHERE mess_name = ? AND meal_type = ? AND meal_date = ?',
            [mess_name, meal_type, meal_date]
        );
        if (bookingCount[0].total >= menuRows[0].capacity) {
            throw new Error(`${mess_name} is full for ${meal_type}. Please select the other mess.`);
        }

        // 3. Check student's coin balance
        const [studentRows] = await connection.query(
            'SELECT coins FROM students WHERE id = ?', 
            [student_id]
        );
        if (studentRows[0].coins < MEAL_COST) {
            throw new Error(`Insufficient funds. You need ${MEAL_COST} coins, but have ${studentRows[0].coins}.`);
        }

        // 4. Deduct coins
        await connection.query(
            'UPDATE students SET coins = coins - ? WHERE id = ?',
            [MEAL_COST, student_id]
        );

        // 5. Create the booking
        await connection.query(
            'INSERT INTO bookings (student_id, meal_type, mess_name, meal_date) VALUES (?, ?, ?, ?)',
            [student_id, meal_type, mess_name, meal_date]
        );

        // 6. Log the transaction
        await connection.query(
            'INSERT INTO transactions (student_id, type, amount, action_by, remarks) VALUES (?, "debit", ?, "system", ?)',
            [student_id, MEAL_COST, `Booked ${meal_type} at ${mess_name}`]
        );

        // If we made it this far, save everything permanently
        await connection.commit();
        res.status(200).json({ success: true, message: `Successfully booked ${meal_type} at ${mess_name}!` });

    } catch (error) {
        // If anything fails, revert the entire transaction (no coins lost)
        await connection.rollback();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
});

module.exports = router;
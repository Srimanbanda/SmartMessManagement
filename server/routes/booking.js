const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// POST /api/bookings/book
router.post('/book', async (req, res) => {
    const { student_id, mess_name, meal_type, meal_date } = req.body;

    if (!student_id || !mess_name || !meal_type || !meal_date) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Calculate Day of the Week for fallback
        const dateObj = new Date(meal_date);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayOfWeek = days[dateObj.getDay()];

        // 2. Determine Dynamic Price
        let mealPrice = 0;
        const [specialMenu] = await connection.query(`
            SELECT price FROM special_menus 
            WHERE mess_name = ? AND specific_date = ? AND meal_type = ?
        `, [mess_name, meal_date, meal_type]);

        if (specialMenu.length > 0) {
            mealPrice = specialMenu[0].price;
        } else {
            const [weeklyMenu] = await connection.query(`
                SELECT price FROM weekly_menus 
                WHERE mess_name = ? AND day_of_week = ? AND meal_type = ?
            `, [mess_name, dayOfWeek, meal_type]);

            if (weeklyMenu.length > 0) {
                mealPrice = weeklyMenu[0].price;
            } else {
                throw new Error(`No menu scheduled for ${meal_type} on this date.`);
            }
        }

        // 3. Check Wallet Balance
        const [student] = await connection.query('SELECT coins FROM students WHERE id = ? FOR UPDATE', [student_id]);
        
        if (student.length === 0) {
            throw new Error('Student not found.');
        }

        if (student[0].coins < mealPrice) {
            throw new Error(`Insufficient funds. Meal costs ${mealPrice} coins, but you only have ${student[0].coins}.`);
        }

        // 4. Deduct Coins
        await connection.query(`
            UPDATE students SET coins = coins - ? WHERE id = ?
        `, [mealPrice, student_id]);

        // 5. Generate unique Booking Reference (e.g., BK-482910)
        const randomDigits = Math.floor(1000 + Math.random() * 9000); 
        const timeSuffix = Date.now().toString().slice(-3);
        const bookingRef = `BK-${randomDigits}${timeSuffix}`;

        // 6. Create Booking & Capture ID
        const [bookingResult] = await connection.query(`
            INSERT INTO bookings (student_id, booking_ref, mess_name, meal_type, meal_date,  status) 
            VALUES (?, ?, ?, ?, ?,'booked')
        `, [student_id, bookingRef, mess_name, meal_type, meal_date, mealPrice]);
        
        const bookingId = bookingResult.insertId;

        // 7. Log the Transaction (Linked to the Booking)
        const description = `${meal_type.charAt(0).toUpperCase() + meal_type.slice(1)} booked for ${meal_date} (Ref: ${bookingRef})`;
        await connection.query(`
            INSERT INTO transactions (student_id, booking_id, mess_name, amount, type, description) 
            VALUES (?, ?, ?, ?, 'debit', ?)
        `, [student_id, bookingId, mess_name, mealPrice, description]);

        // 8. Commit Transaction
        await connection.commit();
        res.status(200).json({ 
            success: true, 
            message: `Successfully booked ${meal_type} for ${mealPrice} coins.`,
            booking_ref: bookingRef, // Send the receipt number to the frontend UI
            remaining_coins: student[0].coins - mealPrice
        });

    } catch (error) {
        await connection.rollback();
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'You have already booked this meal.' });
        }
        
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
});

module.exports = router;
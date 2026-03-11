const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET: Fetch menu for a specific date (Includes Fallback Logic & Dynamic Pricing)
router.get('/:mess_name/:target_date', async (req, res) => {
    try {
        const { mess_name, target_date } = req.params;
        
        const dateObj = new Date(target_date);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayOfWeek = days[dateObj.getDay()];

        // 1. Fetch the default weekly templates (Now includes 'price')
        const [weeklyRows] = await pool.query(`
            SELECT meal_type, items, price, TIME_FORMAT(start_time, '%H:%i') as start_time, TIME_FORMAT(end_time, '%H:%i') as end_time 
            FROM weekly_menus 
            WHERE mess_name = ? AND day_of_week = ?
        `, [mess_name, dayOfWeek]);

        // 2. Fetch any special overrides for this exact date (Now includes 'price')
        const [specialRows] = await pool.query(`
            SELECT meal_type, items, price, TIME_FORMAT(start_time, '%H:%i') as start_time, TIME_FORMAT(end_time, '%H:%i') as end_time 
            FROM special_menus 
            WHERE mess_name = ? AND specific_date = ?
        `, [mess_name, target_date]);

        // 3. Merge logic: Special menus overwrite weekly menus for specific meal_types
        const mergedMenuMap = {};
        
        // Load defaults first
        weeklyRows.forEach(row => {
            mergedMenuMap[row.meal_type] = { ...row, is_special: false };
        });

        // Overwrite with specials (if any exist)
        specialRows.forEach(row => {
            mergedMenuMap[row.meal_type] = { ...row, is_special: true };
        });

        // Convert map back to an array for the frontend
        const finalMenus = Object.values(mergedMenuMap);

        res.status(200).json({ success: true, day: dayOfWeek, date: target_date, menus: finalMenus });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT: Update standard weekly menu
router.put('/update', async (req, res) => {
    const { mess_name, day_of_week, meal_type, items, start_time, end_time, price } = req.body;
    
    if (!mess_name || !day_of_week || !meal_type || !items || !start_time || !end_time) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const mealPrice = price || 50; // Fallback to 50 if admin doesn't specify

    try {
        // UPSERT Logic for weekly templates
        await pool.query(`
            INSERT INTO weekly_menus (mess_name, day_of_week, meal_type, items, start_time, end_time, price) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            items = VALUES(items), start_time = VALUES(start_time), end_time = VALUES(end_time), price = VALUES(price)
        `, [mess_name, day_of_week, meal_type, items, start_time, end_time, mealPrice]);

        res.status(200).json({ success: true, message: `Successfully updated ${day_of_week} ${meal_type} template.` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT: Add or Update a SPECIAL menu for an exceptional day
router.put('/special', async (req, res) => {
    const { mess_name, specific_date, meal_type, items, start_time, end_time, price } = req.body;

    if (!mess_name || !specific_date || !meal_type || !items || !start_time || !end_time) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const mealPrice = price || 50; // Fallback to 50 if admin doesn't specify

    try {
        // UPSERT Logic for special overrides
        await pool.query(`
            INSERT INTO special_menus (mess_name, specific_date, meal_type, items, start_time, end_time, price) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            items = VALUES(items), start_time = VALUES(start_time), end_time = VALUES(end_time), price = VALUES(price)
        `, [mess_name, specific_date, meal_type, items, start_time, end_time, mealPrice]);

        res.status(200).json({ success: true, message: `Successfully set special ${meal_type} menu for ${specific_date}.` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE: Remove a special menu override (revert back to weekly default)
router.delete('/special/:mess_name/:specific_date/:meal_type', async (req, res) => {
    try {
        const { mess_name, specific_date, meal_type } = req.params;
        await pool.query(`
            DELETE FROM special_menus 
            WHERE mess_name = ? AND specific_date = ? AND meal_type = ?
        `, [mess_name, specific_date, meal_type]);
        
        res.status(200).json({ success: true, message: 'Special menu removed, reverted to weekly default.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;